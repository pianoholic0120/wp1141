'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import PostList from '@/components/post/PostList'
import PostModal from '@/components/post/PostModal'
import InlinePostComposer from '@/components/post/InlinePostComposer'
import ProfilePreview from '@/components/profile/ProfilePreview'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function HomePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'following'>('all')
  const [showPostModal, setShowPostModal] = useState(false)
  const [previewUserId, setPreviewUserId] = useState<string | null>(null)
  const [previewPosition, setPreviewPosition] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (searchParams.get('post') === 'true') {
      setShowPostModal(true)
      router.replace('/home', { scroll: false })
    }
  }, [searchParams, router])

  const handleMentionClick = (userId: string, event: React.MouseEvent) => {
    // Toggle: if clicking the same user, close the preview
    if (previewUserId === userId) {
      setPreviewUserId(null)
      setPreviewPosition(null)
      return
    }
    
    const rect = event.currentTarget.getBoundingClientRect()
    
    // Use viewport-relative coordinates (getBoundingClientRect already gives viewport coords)
    // Position to the right of the clicked element
    const x = rect.right + 20 // 20px spacing to the right
    const y = rect.top // Align with top of clicked element
    
    // Store position and show preview
    setPreviewPosition({ x, y })
    setPreviewUserId(userId)
  }

  const handleClosePreview = () => {
    setPreviewUserId(null)
    setPreviewPosition(null)
  }

  // Close preview when clicking outside
  useEffect(() => {
    if (!previewUserId) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Check if click is outside the preview modal and not on a mention
      if (!target.closest('[data-profile-preview]') && !target.closest('[data-mention]')) {
        handleClosePreview()
      }
    }

    // Add event listener with a slight delay to avoid immediate closure
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true) // Use capture phase
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('click', handleClickOutside, true)
    }
  }, [previewUserId])

  return (
    <div className="max-w-2xl mx-auto border-x border-border min-h-screen">
      {/* Main Content */}
      <div className="w-full">
        {/* Header */}
        <div className="sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border p-4">
          <h1 className="text-xl font-bold">Home</h1>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-4 text-center font-semibold border-b-2 transition-colors ${
              filter === 'all'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('following')}
            className={`flex-1 py-4 text-center font-semibold border-b-2 transition-colors ${
              filter === 'following'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-white'
            }`}
          >
            Following
          </button>
        </div>

        {/* Inline Post Composer */}
        <InlinePostComposer onMentionClick={handleMentionClick} />

        {/* Post List */}
        <PostList filter={filter} onMentionClick={handleMentionClick} />

        {/* Post Modal */}
        <PostModal
          isOpen={showPostModal}
          onClose={() => setShowPostModal(false)}
          onSuccess={() => {
            setShowPostModal(false)
          }}
          onMentionClick={handleMentionClick}
        />
      </div>

      {/* Floating Profile Preview */}
      {previewUserId && previewPosition && (
        <div
          data-profile-preview
          className="fixed z-50 w-80 pointer-events-auto"
          style={{
            left: typeof window !== 'undefined' 
              ? `${Math.min(previewPosition.x, window.innerWidth - 340)}px` 
              : `${previewPosition.x}px`,
            top: typeof window !== 'undefined'
              ? `${Math.max(10, Math.min(previewPosition.y, window.innerHeight - 500))}px`
              : `${previewPosition.y}px`,
            maxHeight: 'calc(100vh - 20px)',
            maxWidth: 'calc(100vw - 20px)',
          }}
        >
          <ProfilePreview
            userId={previewUserId}
            onClose={handleClosePreview}
          />
        </div>
      )}
    </div>
  )
}

