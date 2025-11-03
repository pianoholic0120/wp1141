'use client'

import { useSession, signOut } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'
import { ChevronDownIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import Avatar from '../common/Avatar'

export default function UserMenu() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!session?.user) {
    return null
  }

  const user = session.user

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center space-x-3 p-3 rounded-full hover:bg-gray-900 transition-colors"
      >
        <Avatar
          src={user.avatar_url || user.image || undefined}
          alt={user.name || 'User'}
          size={40}
        />
        <div className="flex-1 text-left min-w-0">
          <div className="font-semibold truncate">{user.name || 'User'}</div>
          <div className="text-sm text-gray-500 truncate">@{user.user_id || 'user'}</div>
        </div>
        <ChevronDownIcon className="w-5 h-5 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
          <button
            onClick={() => {
              signOut({ callbackUrl: '/login' })
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-900 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  )
}

