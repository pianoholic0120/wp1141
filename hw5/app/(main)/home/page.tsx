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

  useEffect(() => {
    if (searchParams.get('post') === 'true') {
      setShowPostModal(true)
      router.replace('/home', { scroll: false })
    }
  }, [searchParams, router])

  return (
    <div className="flex max-w-6xl mx-auto min-h-screen">
      {/* Main Content */}
      <div className="flex-1 max-w-2xl border-x border-border">
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
        <InlinePostComposer onMentionClick={setPreviewUserId} />

        {/* Post List */}
        <PostList filter={filter} onMentionClick={setPreviewUserId} />

        {/* Post Modal */}
        <PostModal
          isOpen={showPostModal}
          onClose={() => setShowPostModal(false)}
          onSuccess={() => {
            setShowPostModal(false)
          }}
          onMentionClick={setPreviewUserId}
        />
      </div>

      {/* Right Sidebar - Profile Preview */}
      {previewUserId && (
        <div className="hidden lg:block w-80 p-4">
          <ProfilePreview
            userId={previewUserId}
            onClose={() => setPreviewUserId(null)}
          />
        </div>
      )}
    </div>
  )
}

