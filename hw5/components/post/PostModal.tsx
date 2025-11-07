'use client'

import { useState, useEffect, useRef } from 'react'
import { XMarkIcon, GlobeAltIcon, UserGroupIcon, AtSymbolIcon, LockClosedIcon, ChevronDownIcon, PhotoIcon, VideoCameraIcon } from '@heroicons/react/24/outline'
import { calculateCharacterCount } from '@/lib/utils/characterCount'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import DraftsModal from './DraftsModal'
import MentionAutocomplete from '../common/MentionAutocomplete'
import HashtagAutocomplete from '../common/HashtagAutocomplete'
import Image from 'next/image'

interface User {
  id: string
  user_id: string | null
  name: string | null
  avatar_url: string | null
  image: string | null
}

interface MediaFile {
  url: string
  type: 'image' | 'video'
  mimeType?: string
  size?: number
  width?: number
  height?: number
  file?: File // For preview before upload
  preview?: string // For preview URL
}

interface PostModalProps {
  isOpen: boolean
  onClose: () => void
  initialContent?: string
  parentPostId?: string
  onSuccess?: () => void
  onMentionClick?: (userId: string, event: React.MouseEvent) => void
}

export default function PostModal({ isOpen, onClose, initialContent = '', parentPostId, onSuccess, onMentionClick }: PostModalProps) {
  const [content, setContent] = useState(initialContent)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
  const [showDrafts, setShowDrafts] = useState(false)
  const [showMentionAutocomplete, setShowMentionAutocomplete] = useState(false)
  const [showHashtagAutocomplete, setShowHashtagAutocomplete] = useState(false)
  const [mentionCursorPosition, setMentionCursorPosition] = useState(0)
  const [hashtagCursorPosition, setHashtagCursorPosition] = useState(0)
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null) // Track the draft ID being edited
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'mentioned'>('public')
  const [replySettings, setReplySettings] = useState<'everyone' | 'followers' | 'mentioned'>('everyone')
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false)
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      setContent(initialContent)
      setShowMentionAutocomplete(false)
      setShowHashtagAutocomplete(false)
      setCurrentDraftId(null) // Reset draft ID when modal opens
      setVisibility('public') // Reset visibility
      setReplySettings('everyone') // Reset reply settings (will sync with visibility)
      setShowVisibilityDropdown(false) // Close visibility dropdown
      setMediaFiles([]) // Reset media files
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [isOpen, initialContent])

  // Sync replySettings with visibility
  useEffect(() => {
    if (visibility === 'public') {
      setReplySettings('everyone')
    } else if (visibility === 'followers') {
      setReplySettings('followers')
    } else if (visibility === 'mentioned') {
      setReplySettings('mentioned')
    }
  }, [visibility])

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
      
      // Set cursor position after the inserted hashtag
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = lastHashIndex + hashtag.length + 2 // +2 for # and space
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

  const handleDiscard = async () => {
    // Delete the draft if it was being edited
    if (currentDraftId) {
      try {
        await fetch(`/api/drafts/${currentDraftId}`, {
          method: 'DELETE'
        })
        console.log('Draft deleted:', currentDraftId)
      } catch (error) {
        console.error('Error deleting draft:', error)
        // Continue anyway - close the modal even if draft deletion fails
      }
    }
    
    setContent('')
    setMediaFiles([])
    setCurrentDraftId(null)
    setShowDiscardConfirm(false)
    onClose()
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Limit to 4 media files
    if (mediaFiles.length + files.length > 4) {
      toast.error('Maximum 4 media files allowed')
      return
    }

    setUploadingMedia(true)

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Create preview URL for images
        let preview: string | undefined
        if (file.type.startsWith('image/')) {
          preview = URL.createObjectURL(file)
        }

        // Upload file
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to upload file')
        }

        const data = await res.json()
        return {
          url: data.url,
          type: data.type,
          mimeType: data.mimeType,
          size: data.size,
          width: data.width,
          height: data.height,
          preview
        } as MediaFile
      })

      const uploadedFiles = await Promise.all(uploadPromises)
      setMediaFiles(prev => [...prev, ...uploadedFiles])
      toast.success(`${uploadedFiles.length} file(s) uploaded successfully`)
    } catch (error: any) {
      console.error('Error uploading files:', error)
      toast.error(error.message || 'Failed to upload files')
    } finally {
      setUploadingMedia(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveMedia = (index: number) => {
    setMediaFiles(prev => {
      const newFiles = [...prev]
      // Revoke preview URL if exists
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview)
      }
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  const handleSubmit = async () => {
    if (!charCount.isValid || (!content.trim() && mediaFiles.length === 0)) {
      if (!content.trim() && mediaFiles.length === 0) {
        toast.error('Please add content or media')
      }
      return
    }

    setIsSubmitting(true)
    try {
      const payload: any = {
        content: content.trim(),
        parentPostId: parentPostId || undefined,
        media: mediaFiles.map((file, index) => ({
          url: file.url,
          type: file.type,
          mimeType: file.mimeType,
          size: file.size,
          width: file.width,
          height: file.height,
          order: index
        }))
      }

      // Only set visibility and replySettings for top-level posts
      if (!parentPostId) {
        payload.visibility = visibility
        payload.replySettings = replySettings
      }

      console.log('[PostModal] Submitting post with payload:', payload)

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error('[PostModal] Post creation failed:', errorData)
        throw new Error(errorData.error || 'Failed to create post')
      }

      const data = await res.json()
      console.log('[PostModal] Post created successfully:', data)

      // Delete the draft if it was used to create this post
      if (currentDraftId) {
        try {
          await fetch(`/api/drafts/${currentDraftId}`, {
            method: 'DELETE'
          })
        } catch (error) {
          console.error('Error deleting draft:', error)
          // Don't fail the post creation if draft deletion fails
        }
      }

      toast.success('Post created!')
      setContent('')
      setMediaFiles([])
      setCurrentDraftId(null)
      setVisibility('public')
      setReplySettings('everyone')
      onClose()
      if (onSuccess) onSuccess()
    } catch (error: any) {
      console.error('[PostModal] Error creating post:', error)
      toast.error(error.message || 'Failed to create post')
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
              {/* Visibility Dropdown - Only for top-level posts */}
              {!parentPostId && (
                <div className="relative">
                  <button
                    onClick={() => setShowVisibilityDropdown(!showVisibilityDropdown)}
                    className="flex items-center space-x-1 px-3 py-1.5 text-sm border border-border rounded-full hover:bg-gray-900 transition-colors"
                  >
                    <span>
                      {visibility === 'public' && 'Everyone'}
                      {visibility === 'followers' && 'People you follow'}
                      {visibility === 'mentioned' && 'People you mention'}
                    </span>
                    <ChevronDownIcon className="w-4 h-4" />
                  </button>
                  
                  {showVisibilityDropdown && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowVisibilityDropdown(false)}
                      />
                      <div className="absolute top-full left-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 min-w-[220px]">
                        <button
                          onClick={() => {
                            setVisibility('public')
                            setShowVisibilityDropdown(false)
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-900 transition-colors ${
                            visibility === 'public' ? 'bg-gray-900' : ''
                          }`}
                        >
                          <div className="font-semibold">Everyone</div>
                          <div className="text-xs text-gray-500">Anyone can see this post</div>
                        </button>
                        <button
                          onClick={() => {
                            setVisibility('followers')
                            setShowVisibilityDropdown(false)
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-900 transition-colors border-t border-border ${
                            visibility === 'followers' ? 'bg-gray-900' : ''
                          }`}
                        >
                          <div className="font-semibold">People you follow</div>
                          <div className="text-xs text-gray-500">Only people you follow or who follow you can see</div>
                        </button>
                        <button
                          onClick={() => {
                            setVisibility('mentioned')
                            setShowVisibilityDropdown(false)
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-900 transition-colors border-t border-border ${
                            visibility === 'mentioned' ? 'bg-gray-900' : ''
                          }`}
                        >
                          <div className="font-semibold">People you mention</div>
                          <div className="text-xs text-gray-500">Only people mentioned in this post can see</div>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
              <button
                onClick={() => setShowDrafts(true)}
                className="px-4 py-2 text-sm border border-border rounded-full hover:bg-gray-900 transition-colors text-primary"
              >
                Drafts
              </button>
            </div>
            <button
              onClick={handleSubmit}
              disabled={(!charCount.isValid || (!content.trim() && mediaFiles.length === 0)) || isSubmitting || uploadingMedia}
              className="bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-2 rounded-full transition-colors"
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          </div>

          <div className="p-4">
            <div className="relative" ref={containerRef}>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                onSelect={(e) => {
                  if (textareaRef.current) {
                    const cursorPos = textareaRef.current.selectionStart
                    setMentionCursorPosition(cursorPos)
                    setHashtagCursorPosition(cursorPos)
                    const textBeforeCursor = content.substring(0, cursorPos)
                    const lastHashIndex = textBeforeCursor.lastIndexOf('#')
                    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
                    
                    const hashDistance = lastHashIndex !== -1 ? cursorPos - lastHashIndex : Infinity
                    const atDistance = lastAtIndex !== -1 ? cursorPos - lastAtIndex : Infinity
                    
                    // Check for hashtag
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
                    
                    // Check for mention
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
                placeholder={"What\u2019s happening?"}
                className="w-full bg-transparent resize-none outline-none text-lg min-h-[200px]"
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

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              {/* Left side: Media upload buttons and visibility display */}
              <div className="flex items-center space-x-4">
                {/* Media Upload Buttons */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingMedia || mediaFiles.length >= 4}
                  className="p-2 hover:bg-gray-900 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Add photos/videos"
                >
                  <PhotoIcon className="w-5 h-5 text-primary" />
                </button>
                {uploadingMedia && (
                  <span className="text-sm text-gray-500">Uploading...</span>
                )}
                {mediaFiles.length > 0 && (
                  <span className="text-sm text-gray-500">
                    {mediaFiles.length}/4 media
                  </span>
                )}
                
                {/* Visibility Display */}
                {!parentPostId && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    {visibility === 'public' && <GlobeAltIcon className="w-4 h-4" />}
                    {visibility === 'followers' && <UserGroupIcon className="w-4 h-4" />}
                    {visibility === 'mentioned' && <AtSymbolIcon className="w-4 h-4" />}
                    <span>
                      {visibility === 'public' && 'Everyone can see'}
                      {visibility === 'followers' && 'People you follow can see'}
                      {visibility === 'mentioned' && 'People you mention can see'}
                    </span>
                  </div>
                )}
              </div>
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
            <p className="text-gray-500 mb-6">This can\u2019t be undone and you\u2019ll lose your draft.</p>
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
        onSelect={(draftContent, draftId) => {
          setContent(draftContent)
          setCurrentDraftId(draftId)
          setShowDrafts(false)
        }}
      />
    </>
  )
}

