'use client'

import { useState, useRef, useEffect } from 'react'
import { calculateCharacterCount } from '@/lib/utils/characterCount'
import toast from 'react-hot-toast'
import Avatar from '../common/Avatar'
import { useSession } from 'next-auth/react'

interface InlinePostComposerProps {
  parentPostId?: string
  onSuccess?: () => void
  placeholder?: string
}

export default function InlinePostComposer({ parentPostId, onSuccess, placeholder = "What's happening?" }: InlinePostComposerProps) {
  const { data: session } = useSession()
  const [content, setContent] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const charCount = calculateCharacterCount(content)

  useEffect(() => {
    if (isExpanded) {
      textareaRef.current?.focus()
    }
  }, [isExpanded])

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
          src={session.user.image || session.user.avatar_url || undefined}
          alt={session.user.name || 'User'}
          size={48}
          className="flex-shrink-0"
        />
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent resize-none outline-none text-lg min-h-[100px]"
            maxLength={charCount.isValid ? undefined : content.length}
          />

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

