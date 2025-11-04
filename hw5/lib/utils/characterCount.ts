export interface CharacterCountResult {
  count: number
  isValid: boolean
  links: string[]
  hashtags: string[]
  mentions: string[]
}

export function calculateCharacterCount(text: string): CharacterCountResult {
  const URL_LENGTH = 23
  const MAX_LENGTH = 280
  
  // Extract URLs (match http://, https:// URLs)
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const links = text.match(urlRegex) || []
  
  // Extract hashtags (# followed by Unicode characters, numbers, or underscore)
  // Support Unicode characters (including Chinese, Japanese, etc.)
  const hashtagRegex = /#[\p{L}\p{N}_]+/gu
  const hashtags = text.match(hashtagRegex) || []
  
  // Extract mentions (@ followed by Unicode characters, numbers, or underscore)
  // Support Unicode characters (including Chinese, Japanese, etc.)
  const mentionRegex = /@[\p{L}\p{N}_]+/gu
  const mentions = text.match(mentionRegex) || []
  
  // Remove hashtags and mentions from counting
  let countableText = text
  hashtags.forEach(tag => {
    countableText = countableText.replace(tag, '')
  })
  mentions.forEach(mention => {
    countableText = countableText.replace(mention, '')
  })
  
  // Replace each URL with 23 characters
  links.forEach(link => {
    countableText = countableText.replace(link, 'x'.repeat(URL_LENGTH))
  })
  
  const count = countableText.length
  
  return {
    count,
    isValid: count <= MAX_LENGTH,
    links,
    hashtags: hashtags.map(tag => tag.substring(1)), // Remove #
    mentions: mentions.map(mention => mention.substring(1)) // Remove @
  }
}

