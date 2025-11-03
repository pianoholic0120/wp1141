'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface User {
  id: string
  user_id: string | null
  name: string | null
  bio: string | null
  background_image_url: string | null
  avatar_url: string | null
}

interface EditProfileModalProps {
  user: User
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function EditProfileModal({ user, isOpen, onClose, onSuccess }: EditProfileModalProps) {
  const [name, setName] = useState(user.name || '')
  const [bio, setBio] = useState(user.bio || '')
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(user.background_image_url || '')
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setName(user.name || '')
      setBio(user.bio || '')
      setBackgroundImageUrl(user.background_image_url || '')
      setAvatarUrl(user.avatar_url || '')
    }
  }, [isOpen, user])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/users/${user.user_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          bio,
          background_image_url: backgroundImageUrl || null,
          avatar_url: avatarUrl || null
        })
      })

      if (!res.ok) {
        throw new Error('Failed to update profile')
      }

      // Refresh session to update avatar in sidebar
      const { update } = await import('next-auth/react')
      await update()

      toast.success('Profile updated!')
      onSuccess()
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-background border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto">
          <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-900 rounded-full transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold">Edit Profile</h2>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-2 rounded-full transition-colors"
            >
              Save
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent border border-border rounded-lg px-4 py-2 outline-none focus:border-primary"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-transparent border border-border rounded-lg px-4 py-2 outline-none focus:border-primary resize-none"
                rows={4}
                placeholder="Tell us about yourself"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Avatar URL</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full bg-transparent border border-border rounded-lg px-4 py-2 outline-none focus:border-primary mb-2"
                placeholder="https://..."
              />
              {avatarUrl && (
                <div className="mt-2">
                  <div className="text-xs text-gray-500 mb-1">Preview:</div>
                  <div className="w-20 h-20 rounded-full overflow-hidden border border-border">
                    <img
                      src={avatarUrl}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        const parent = e.currentTarget.parentElement
                        if (parent) {
                          parent.innerHTML = '<div class="w-full h-full bg-gray-700 flex items-center justify-center text-white text-sm">Invalid URL</div>'
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Background Image URL</label>
              <input
                type="url"
                value={backgroundImageUrl}
                onChange={(e) => setBackgroundImageUrl(e.target.value)}
                className="w-full bg-transparent border border-border rounded-lg px-4 py-2 outline-none focus:border-primary mb-2"
                placeholder="https://..."
              />
              {backgroundImageUrl && (
                <div className="mt-2">
                  <div className="text-xs text-gray-500 mb-1">Preview:</div>
                  <div className="w-full h-32 rounded-lg overflow-hidden border border-border bg-gray-800">
                    <img
                      src={backgroundImageUrl}
                      alt="Background preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        const parent = e.currentTarget.parentElement
                        if (parent) {
                          parent.innerHTML = '<div class="w-full h-full bg-gray-700 flex items-center justify-center text-gray-500 text-sm">Invalid URL</div>'
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

