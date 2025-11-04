'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { formatRelativeTime } from '@/lib/utils/timeFormat'

interface Draft {
  id: string
  content: string
  createdAt: string
  updatedAt: string
}

interface DraftsModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (content: string, draftId: string) => void
}

export default function DraftsModal({ isOpen, onClose, onSelect }: DraftsModalProps) {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchDrafts()
    }
  }, [isOpen])

  const fetchDrafts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/drafts')
      if (!res.ok) throw new Error('Failed to fetch drafts')
      const data = await res.json()
      setDrafts(data)
    } catch (error) {
      toast.error('Failed to load drafts')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (draftId: string) => {
    try {
      const res = await fetch(`/api/drafts/${draftId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete draft')
      toast.success('Draft deleted')
      fetchDrafts()
    } catch (error) {
      toast.error('Failed to delete draft')
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-background border border-border rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden pointer-events-auto flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-xl font-bold">Drafts</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-900 rounded-full transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="text-center text-gray-500 py-8">Loading...</div>
            ) : drafts.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No drafts</div>
            ) : (
              <div className="space-y-4">
                {drafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="border border-border rounded-lg p-4 hover:bg-gray-900 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm text-gray-500">
                        {formatRelativeTime(draft.updatedAt)}
                      </span>
                      <button
                        onClick={() => handleDelete(draft.id)}
                        className="p-1 hover:bg-gray-800 rounded-full"
                      >
                        <TrashIcon className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                    <p className="text-sm mb-3 whitespace-pre-wrap">{draft.content}</p>
                    <button
                      onClick={() => {
                        onSelect(draft.content, draft.id)
                        onClose()
                      }}
                      className="text-primary hover:underline text-sm font-semibold"
                    >
                      Continue editing
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

