'use client'

import { useState, useEffect, useRef } from 'react'
import Avatar from './Avatar'

interface User {
  id: string
  user_id: string | null
  name: string | null
  avatar_url: string | null
  image: string | null
}

interface MentionAutocompleteProps {
  text: string
  cursorPosition: number
  onSelect: (user: User) => void
  onClose: () => void
}

export default function MentionAutocomplete({ text, cursorPosition, onSelect, onClose }: MentionAutocompleteProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  // Extract the mention query (text after @)
  useEffect(() => {
    // Find the @ symbol before cursor position
    let startIndex = cursorPosition - 1
    while (startIndex >= 0 && text[startIndex] !== '@' && text[startIndex] !== ' ' && text[startIndex] !== '\n') {
      startIndex--
    }

    if (startIndex < 0 || text[startIndex] !== '@') {
      setUsers([])
      onClose()
      return
    }

    // Extract query after @
    const query = text.substring(startIndex + 1, cursorPosition).trim()
    
    console.log('[MentionAutocomplete] Query:', query, 'Cursor:', cursorPosition)
    
    // Always fetch users (empty query shows all, non-empty filters)
    fetchUsers(query)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, cursorPosition])

  const fetchUsers = async (query: string) => {
    setLoading(true)
    try {
      const url = `/api/users/search?q=${encodeURIComponent(query)}&limit=3`
      console.log('[MentionAutocomplete] Fetching users from:', url)
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to search users')
      const data = await res.json()
      console.log('[MentionAutocomplete] Received users:', data.length, data)
      setUsers(data)
      setSelectedIndex(0)
    } catch (error) {
      console.error('Error searching users:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (user: User) => {
    onSelect(user)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (users.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % users.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + users.length) % users.length)
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      handleSelect(users[selectedIndex])
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

  if (users.length === 0 && !loading) {
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
      ) : users.length === 0 ? (
        <div className="p-4 text-gray-500 text-center">No users found</div>
      ) : (
        users.map((user, index) => (
          <div
            key={user.id}
            onClick={() => handleSelect(user)}
            className={`flex items-center space-x-3 p-3 hover:bg-gray-900 cursor-pointer transition-colors ${
              index === selectedIndex ? 'bg-gray-900' : ''
            }`}
          >
            <Avatar
              src={user.avatar_url || user.image || undefined}
              alt={user.name || user.user_id || 'User'}
              size={40}
            />
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{user.name || 'Anonymous'}</div>
              <div className="text-sm text-gray-500 truncate">@{user.user_id}</div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

