'use client'

import { useState, useEffect, useRef } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { calculateCharacterCount } from '@/lib/utils/characterCount'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import DraftsModal from './DraftsModal'

interface PostModalProps {
  isOpen: boolean
  onClose: () => void
  initialContent?: string
  parentPostId?: string
  onSuccess?: () => void
}

export default function PostModal({ isOpen, onClose, initialContent = '', parentPostId, onSuccess }: PostModalProps) {
  const [content, setContent] = useState(initialContent)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
  const [showDrafts, setShowDrafts] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      setContent(initialContent)
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [isOpen, initialContent])

  const charCount = calculateCharacterCount(content)

  const handleClose = () => {
    if (content.trim() && content !== initialContent) {
      setShowDiscardConfirm(true)
    } else {
      onClose()
    }
  }

  const handleSaveDraft = async () => {
    try {
      await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })
      toast.success('Draft saved')
      setShowDiscardConfirm(false)
      onClose()
    } catch (error) {
      toast.error('Failed to save draft')
    }
  }

  const handleDiscard = () => {
    setContent('')
    setShowDiscardConfirm(false)
    onClose()
  }

  const handleSubmit = async () => {
    if (!charCount.isValid || !content.trim()) {
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/posts', {
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

      toast.success('Post created!')
      setContent('')
      onClose()
      if (onSuccess) onSuccess()
    } catch (error) {
      toast.error('Failed to create post')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={handleClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-background border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden pointer-events-auto">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-900 rounded-full transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowDrafts(true)}
                className="px-4 py-2 text-sm border border-border rounded-full hover:bg-gray-900 transition-colors"
              >
                Drafts
              </button>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!charCount.isValid || !content.trim() || isSubmitting}
              className="bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-2 rounded-full transition-colors"
            >
              Post
            </button>
          </div>

          <div className="p-4">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening?"
              className="w-full bg-transparent resize-none outline-none text-lg min-h-[200px]"
              maxLength={charCount.isValid ? undefined : content.length}
            />

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <div className="text-sm text-gray-500">
                <span className={charCount.count > 280 ? 'text-red-500' : ''}>
                  {charCount.count}
                </span>
                /280
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDiscardConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-background border border-border rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-2">Discard post?</h3>
            <p className="text-gray-500 mb-6">This can't be undone and you'll lose your draft.</p>
            <div className="flex space-x-3">
              <button
                onClick={handleSaveDraft}
                className="flex-1 bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-full transition-colors"
              >
                Save draft
              </button>
              <button
                onClick={handleDiscard}
                className="flex-1 border border-border hover:bg-gray-900 font-bold py-3 rounded-full transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      <DraftsModal
        isOpen={showDrafts}
        onClose={() => setShowDrafts(false)}
        onSelect={(draftContent) => {
          setContent(draftContent)
          setShowDrafts(false)
        }}
      />
    </>
  )
}

