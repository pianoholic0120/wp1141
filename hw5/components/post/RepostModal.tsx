'use client'

import { useState, useEffect, useRef } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { calculateCharacterCount } from '@/lib/utils/characterCount'
import toast from 'react-hot-toast'
import Avatar from '../common/Avatar'
import ParsedText from '../common/ParsedText'
import { formatRelativeTime } from '@/lib/utils/timeFormat'
import MentionAutocomplete from '../common/MentionAutocomplete'
import HashtagAutocomplete from '../common/HashtagAutocomplete'

interface Post {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    user_id: string | null
    name: string | null
    avatar_url: string | null
    image: string | null
  }
  originalPost?: Post | null
  is_repost?: boolean
}

interface User {
  id: string
  user_id: string | null
  name: string | null
  avatar_url: string | null
  image: string | null
}

interface RepostModalProps {
  isOpen: boolean
  onClose: () => void
  post: Post
  onSuccess?: () => void
  onMentionClick?: (userId: string, event: React.MouseEvent) => void
}

export default function RepostModal({ isOpen, onClose, post, onSuccess, onMentionClick }: RepostModalProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMentionAutocomplete, setShowMentionAutocomplete] = useState(false)
  const [showHashtagAutocomplete, setShowHashtagAutocomplete] = useState(false)
  const [mentionCursorPosition, setMentionCursorPosition] = useState(0)
  const [hashtagCursorPosition, setHashtagCursorPosition] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Get the original post to display
  const originalPost = post.originalPost || post

  useEffect(() => {
    if (isOpen) {
      setContent('')
      setShowMentionAutocomplete(false)
      setShowHashtagAutocomplete(false)
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [isOpen])

  const charCount = calculateCharacterCount(content)

  // Detect @ mention and # hashtag triggers
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    const cursorPos = e.target.selectionStart
    
    setContent(newContent)
    
    const textBeforeCursor = newContent.substring(0, cursorPos)
    
    // Check for hashtag (#) first
    const lastHashIndex = textBeforeCursor.lastIndexOf('#')
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    // Determine which is closer to cursor
    const hashDistance = lastHashIndex !== -1 ? cursorPos - lastHashIndex : Infinity
    const atDistance = lastAtIndex !== -1 ? cursorPos - lastAtIndex : Infinity
    
    // Check if we're in a hashtag context (#)
    if (lastHashIndex !== -1 && hashDistance < atDistance) {
      const textAfterHash = textBeforeCursor.substring(lastHashIndex + 1)
      if (!textAfterHash.includes(' ') && !textAfterHash.includes('\n') && !textAfterHash.includes('#')) {
        setShowHashtagAutocomplete(true)
        setHashtagCursorPosition(cursorPos)
        setShowMentionAutocomplete(false)
        return
      }
    }
    
    // Check if we're in a mention context (@)
    if (lastAtIndex !== -1 && atDistance < hashDistance) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n') && !textAfterAt.includes('@')) {
        setShowMentionAutocomplete(true)
        setMentionCursorPosition(cursorPos)
        setShowHashtagAutocomplete(false)
        return
      }
    }
    
    setShowMentionAutocomplete(false)
    setShowHashtagAutocomplete(false)
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
      
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = lastAtIndex + user.user_id!.length + 2
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
          textareaRef.current.focus()
        }
      }, 0)
    }
  }

  const handleHashtagSelect = (hashtag: string) => {
    if (!textareaRef.current) return
    
    const cursorPos = hashtagCursorPosition
    const textBeforeCursor = content.substring(0, cursorPos)
    const lastHashIndex = textBeforeCursor.lastIndexOf('#')
    
    if (lastHashIndex !== -1) {
      const textAfterCursor = content.substring(cursorPos)
      const newContent = 
        content.substring(0, lastHashIndex) + 
        `#${hashtag} ` +
        textAfterCursor
      
      setContent(newContent)
      setShowHashtagAutocomplete(false)
      
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = lastHashIndex + hashtag.length + 2
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
          textareaRef.current.focus()
        }
      }, 0)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionAutocomplete && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Tab' || e.key === 'Escape')) {
      e.preventDefault()
      return
    }
    if (showHashtagAutocomplete && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Tab' || e.key === 'Escape')) {
      e.preventDefault()
      return
    }
    if (e.key === 'Escape' && !showMentionAutocomplete && !showHashtagAutocomplete) {
      onClose()
    }
  }

  const handleSubmit = async () => {
    if (!charCount.isValid) {
      return
    }

    setIsSubmitting(true)
    try {
      // For reposts, repost the original post, not the repost itself
      const targetPostId = post.is_repost && post.originalPost ? post.originalPost.id : post.id
      
      const res = await fetch(`/api/posts/${targetPostId}/repost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim() || '' // Allow empty content for simple repost
        })
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to repost')
      }

      toast.success('Reposted!')
      onClose()
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Repost error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to repost')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-900 rounded-full transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold">Repost</h2>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {/* Textarea for repost comment */}
            <div className="relative mb-4" ref={containerRef}>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                onSelectionChange={(e) => {
                  if (textareaRef.current) {
                    const cursorPos = textareaRef.current.selectionStart
                    setMentionCursorPosition(cursorPos)
                    setHashtagCursorPosition(cursorPos)
                    const textBeforeCursor = content.substring(0, cursorPos)
                    const lastHashIndex = textBeforeCursor.lastIndexOf('#')
                    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
                    
                    const hashDistance = lastHashIndex !== -1 ? cursorPos - lastHashIndex : Infinity
                    const atDistance = lastAtIndex !== -1 ? cursorPos - lastAtIndex : Infinity
                    
                    if (lastHashIndex !== -1 && hashDistance < atDistance) {
                      const textAfterHash = textBeforeCursor.substring(lastHashIndex + 1)
                      if (!textAfterHash.includes(' ') && !textAfterHash.includes('\n') && !textAfterHash.includes('#')) {
                        setShowHashtagAutocomplete(true)
                        setShowMentionAutocomplete(false)
                      } else {
                        setShowHashtagAutocomplete(false)
                      }
                    } else {
                      setShowHashtagAutocomplete(false)
                    }
                    
                    if (lastAtIndex !== -1 && atDistance < hashDistance) {
                      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
                      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n') && !textAfterAt.includes('@')) {
                        setShowMentionAutocomplete(true)
                        setShowHashtagAutocomplete(false)
                      } else {
                        setShowMentionAutocomplete(false)
                      }
                    } else {
                      setShowMentionAutocomplete(false)
                    }
                  }
                }}
                placeholder="Add a comment..."
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
              {showHashtagAutocomplete && (
                <HashtagAutocomplete
                  text={content}
                  cursorPosition={hashtagCursorPosition}
                  onSelect={handleHashtagSelect}
                  onClose={() => setShowHashtagAutocomplete(false)}
                />
              )}
            </div>

            {/* Original post preview with border */}
            <div className="border border-border rounded-lg p-4 bg-gray-950/50">
              <div className="flex space-x-3">
                <Avatar
                  src={originalPost.author.avatar_url || originalPost.author.image || undefined}
                  alt={originalPost.author.name || 'User'}
                  size={48}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold">
                      {originalPost.author.name || 'Anonymous'}
                    </span>
                    {originalPost.author.user_id && (
                      <span className="text-gray-500">@{originalPost.author.user_id}</span>
                    )}
                    <span className="text-gray-500">·</span>
                    <span className="text-gray-500 text-sm">
                      {formatRelativeTime(new Date(originalPost.createdAt))}
                    </span>
                  </div>
                  <div className="text-base">
                    <ParsedText text={originalPost.content} onMentionClick={onMentionClick} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              <span className={charCount.count > 280 ? 'text-red-500' : ''}>
                {charCount.count}
              </span>
              /280
            </div>
            <button
              onClick={handleSubmit}
              disabled={!charCount.isValid || isSubmitting}
              className="bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-2 rounded-full transition-colors"
            >
              Repost
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

