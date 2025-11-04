'use client'

import { useState, useRef, useEffect } from 'react'
import { calculateCharacterCount } from '@/lib/utils/characterCount'
import toast from 'react-hot-toast'
import Avatar from '../common/Avatar'
import { useSession } from 'next-auth/react'
import MentionAutocomplete from '../common/MentionAutocomplete'

interface User {
  id: string
  user_id: string | null
  name: string | null
  avatar_url: string | null
  image: string | null
}

interface InlinePostComposerProps {
  parentPostId?: string
  onSuccess?: () => void
  placeholder?: string
  onMentionClick?: (userId: string) => void
}

export default function InlinePostComposer({ parentPostId, onSuccess, placeholder = "What's happening?", onMentionClick }: InlinePostComposerProps) {
  const { data: session } = useSession()
  const [content, setContent] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMentionAutocomplete, setShowMentionAutocomplete] = useState(false)
  const [mentionCursorPosition, setMentionCursorPosition] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const charCount = calculateCharacterCount(content)

  useEffect(() => {
    if (isExpanded) {
      textareaRef.current?.focus()
    }
  }, [isExpanded])

  // Detect @ mention trigger
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    const cursorPos = e.target.selectionStart
    
    setContent(newContent)
    
    // Check if we're in a mention context (@)
    const textBeforeCursor = newContent.substring(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      // Check if there's a space or newline after @
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setShowMentionAutocomplete(true)
        setMentionCursorPosition(cursorPos)
        return
      }
    }
    
    setShowMentionAutocomplete(false)
  }

  const handleMentionSelect = (user: User) => {
    if (!textareaRef.current) return
    
    const cursorPos = mentionCursorPosition
    const textBeforeCursor = content.substring(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      const textAfterCursor = content.substring(cursorPos)
      const newContent = 
        content.substring(0, lastAtIndex) + 
        `@${user.user_id} ` + 
        textAfterCursor
      
      setContent(newContent)
      setShowMentionAutocomplete(false)
      
      // Set cursor position after the mention
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = lastAtIndex + user.user_id!.length + 2 // @ + user_id + space
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
          textareaRef.current.focus()
        }
      }, 0)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionAutocomplete && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Tab' || e.key === 'Escape')) {
      e.preventDefault()
      // Let MentionAutocomplete handle these keys
      return
    }
  }

  const handleSubmit = async () => {
    if (!charCount.isValid || !content.trim()) {
      return
    }

    setIsSubmitting(true)
    try {
      const url = parentPostId ? `/api/posts/${parentPostId}/comment` : '/api/posts'
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          parentPostId
        })
      })

      if (!res.ok) {
        throw new Error('Failed to create post')
      }

      toast.success(parentPostId ? 'Comment posted!' : 'Post created!')
      setContent('')
      setIsExpanded(false)
      if (onSuccess) onSuccess()
    } catch (error) {
      toast.error('Failed to create post')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!session?.user) return null

  if (!isExpanded) {
    return (
      <div className="border-b border-border p-4">
        <div
          onClick={() => setIsExpanded(true)}
          className="text-gray-500 cursor-text"
        >
          {placeholder}
        </div>
      </div>
    )
  }

  return (
    <div className="border-b border-border p-4">
      <div className="flex space-x-3">
        <Avatar
          src={session.user.avatar_url || session.user.image || undefined}
          alt={session.user.name || 'User'}
          size={48}
          className="flex-shrink-0"
        />
        <div className="flex-1 relative" ref={containerRef}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onSelectionChange={(e) => {
              if (textareaRef.current) {
                const cursorPos = textareaRef.current.selectionStart
                setMentionCursorPosition(cursorPos)
                const textBeforeCursor = content.substring(0, cursorPos)
                const lastAtIndex = textBeforeCursor.lastIndexOf('@')
                if (lastAtIndex !== -1) {
                  const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
                  if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
                    setShowMentionAutocomplete(true)
                  } else {
                    setShowMentionAutocomplete(false)
                  }
                } else {
                  setShowMentionAutocomplete(false)
                }
              }
            }}
            placeholder={placeholder}
            className="w-full bg-transparent resize-none outline-none text-lg min-h-[100px]"
            maxLength={charCount.isValid ? undefined : content.length}
          />
          
          {showMentionAutocomplete && (
            <MentionAutocomplete
              text={content}
              cursorPosition={mentionCursorPosition}
              onSelect={handleMentionSelect}
              onClose={() => setShowMentionAutocomplete(false)}
            />
          )}

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              <span className={charCount.count > 280 ? 'text-red-500' : ''}>
                {charCount.count}
              </span>
              /280
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setIsExpanded(false)
                  setContent('')
                }}
                className="px-4 py-2 border border-border rounded-full hover:bg-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!charCount.isValid || !content.trim() || isSubmitting}
                className="bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-2 rounded-full transition-colors"
              >
                {parentPostId ? 'Reply' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

