export interface ParsedTextPart {
  type: 'text' | 'url' | 'hashtag' | 'mention'
  content: string
  url?: string
  hashtag?: string
  mention?: string
}

export function parseText(text: string): ParsedTextPart[] {
  const parts: ParsedTextPart[] = []
  const urlRegex = /(https?:\/\/[^\s]+)/g
  // Support Unicode characters (including Chinese, Japanese, etc.) and alphanumeric + underscore
  // Match # followed by at least one valid character (letter, number, underscore, or Unicode letter)
  const hashtagRegex = /#[\p{L}\p{N}_]+/gu
  // Match @ followed by at least one valid character (letter, number, underscore, or Unicode letter)
  const mentionRegex = /@[\p{L}\p{N}_]+/gu
  
  // Find all matches with their positions
  const matches: Array<{ type: 'url' | 'hashtag' | 'mention', match: RegExpMatchArray, index: number }> = []
  
  let match
  const urlMatches = [...text.matchAll(urlRegex)]
  urlMatches.forEach(m => matches.push({ type: 'url', match: m, index: m.index! }))
  
  const hashtagMatches = [...text.matchAll(hashtagRegex)]
  hashtagMatches.forEach(m => matches.push({ type: 'hashtag', match: m, index: m.index! }))
  
  const mentionMatches = [...text.matchAll(mentionRegex)]
  mentionMatches.forEach(m => matches.push({ type: 'mention', match: m, index: m.index! }))
  
  // Sort matches by position
  matches.sort((a, b) => a.index - b.index)
  
  // Remove overlapping matches (URLs take precedence)
  const filteredMatches = []
  let lastEnd = 0
  for (const { type, match, index } of matches) {
    const end = index + match[0].length
    if (index >= lastEnd) {
      filteredMatches.push({ type, match, index, end })
      lastEnd = end
    } else if (type === 'url') {
      // URL overlaps with previous, replace the previous match
      filteredMatches.pop()
      filteredMatches.push({ type, match, index, end })
      lastEnd = end
    }
  }
  
  // Build parts array
  let currentIndex = 0
  for (const { type, match, index, end } of filteredMatches) {
    // Add text before match
    if (index > currentIndex) {
      parts.push({
        type: 'text',
        content: text.substring(currentIndex, index)
      })
    }
    
    // Add match
    const content = match[0]
    if (type === 'url') {
      parts.push({
        type: 'url',
        content,
        url: content
      })
    } else if (type === 'hashtag') {
      parts.push({
        type: 'hashtag',
        content,
        hashtag: content.substring(1)
      })
    } else if (type === 'mention') {
      parts.push({
        type: 'mention',
        content,
        mention: content.substring(1)
      })
    }
    
    currentIndex = end
  }
  
  // Add remaining text
  if (currentIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(currentIndex)
    })
  }
  
  // If no matches, return entire text as single part
  if (parts.length === 0) {
    parts.push({ type: 'text', content: text })
  }
  
  return parts
}

