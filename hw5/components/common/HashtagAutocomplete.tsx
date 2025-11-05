'use client'

import { useState, useEffect, useRef } from 'react'
import { HashtagIcon } from '@heroicons/react/24/outline'

interface Hashtag {
  tag: string
  count: number
}

interface HashtagAutocompleteProps {
  text: string
  cursorPosition: number
  onSelect: (hashtag: string) => void
  onClose: () => void
}

export default function HashtagAutocomplete({ text, cursorPosition, onSelect, onClose }: HashtagAutocompleteProps) {
  const [hashtags, setHashtags] = useState<Hashtag[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  // Extract the hashtag query (text after #)
  useEffect(() => {
    // Find the # symbol before cursor position
    let startIndex = cursorPosition - 1
    while (startIndex >= 0 && text[startIndex] !== '#' && text[startIndex] !== ' ' && text[startIndex] !== '\n') {
      startIndex--
    }

    if (startIndex < 0 || text[startIndex] !== '#') {
      setHashtags([])
      onClose()
      return
    }

    // Extract query after #
    const query = text.substring(startIndex + 1, cursorPosition).trim()
    
    // Always fetch hashtags (empty query shows popular, non-empty filters)
    fetchHashtags(query)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, cursorPosition])

  const fetchHashtags = async (query: string) => {
    setLoading(true)
    try {
      const url = `/api/hashtags/search?q=${encodeURIComponent(query)}&limit=5`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to search hashtags')
      const data = await res.json()
      setHashtags(data)
      setSelectedIndex(0)
    } catch (error) {
      console.error('Error searching hashtags:', error)
      setHashtags([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (hashtag: string) => {
    onSelect(hashtag)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (hashtags.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % hashtags.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + hashtags.length) % hashtags.length)
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      handleSelect(hashtags[selectedIndex].tag)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  if (hashtags.length === 0 && !loading) {
    return null
  }

  return (
    <div
      className="absolute z-50 bg-background border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto"
      style={{ top: '100%', left: 0, right: 0, marginTop: '4px' }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      ref={listRef}
    >
      {loading ? (
        <div className="p-4 text-gray-500 text-center">Loading...</div>
      ) : hashtags.length === 0 ? (
        <div className="p-4 text-gray-500 text-center">No hashtags found</div>
      ) : (
        hashtags.map((hashtag, index) => (
          <div
            key={hashtag.tag}
            onClick={() => handleSelect(hashtag.tag)}
            className={`flex items-center space-x-3 p-3 hover:bg-gray-900 cursor-pointer transition-colors ${
              index === selectedIndex ? 'bg-gray-900' : ''
            }`}
          >
            <HashtagIcon className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate text-primary">#{hashtag.tag}</div>
              <div className="text-sm text-gray-500">{hashtag.count} posts</div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

