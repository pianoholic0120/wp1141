'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { HomeIcon, UserIcon, PencilSquareIcon, ArrowRightOnRectangleIcon, BellIcon } from '@heroicons/react/24/outline'
import { HomeIcon as HomeIconSolid, UserIcon as UserIconSolid, BellIcon as BellIconSolid } from '@heroicons/react/24/solid'
import UserMenu from './UserMenu'
import Link from 'next/link'

export default function Sidebar() {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch unread notification count
  useEffect(() => {
    if (!session?.user?.id) {
      console.log('[Sidebar] No session or user id, skipping notification setup')
      return
    }

    console.log('[Sidebar] Setting up notifications for user:', session.user.id)

    const fetchUnreadCount = async () => {
      try {
        const res = await fetch('/api/notifications/unread-count')
        if (res.ok) {
          const data = await res.json()
          console.log('[Sidebar] Fetched unread count:', data.count)
          setUnreadCount(data.count || 0)
        }
      } catch (error) {
        console.error('[Sidebar] Error fetching unread count:', error)
      }
    }

    fetchUnreadCount()

    // Set up real-time updates via Pusher
    const { getPusherClient } = require('@/lib/pusher-client')
    const pusherClient = getPusherClient()
    
    if (!pusherClient) {
      console.error('[Sidebar] Pusher client not available')
      return
    }

    console.log('[Sidebar] Subscribing to channel:', `user-${session.user.id}`)
    const channel = pusherClient.subscribe(`user-${session.user.id}`)
    
    const handleNewNotification = (data: any) => {
      console.log('[Sidebar] ✅ New notification received:', data)
      // Immediately increment unread count for instant feedback
      setUnreadCount(prev => {
        const newCount = prev + 1
        console.log('[Sidebar] Updating unread count:', prev, '→', newCount)
        return newCount
      })
      // Also fetch from server to ensure accuracy
      fetchUnreadCount()
    }
    
    const handleNotificationsRead = () => {
      console.log('[Sidebar] ✅ Notifications read event received')
      fetchUnreadCount()
    }
    
    channel.bind('new-notification', handleNewNotification)
    channel.bind('notifications-read', handleNotificationsRead)
    
    console.log('[Sidebar] Pusher channel bound:', channel.name)

    // Also listen to custom events for immediate updates
    const handleCustomRead = () => {
      console.log('[Sidebar] Custom notifications read event received')
      fetchUnreadCount()
    }
    window.addEventListener('notifications-read', handleCustomRead)

    return () => {
      console.log('[Sidebar] Cleaning up Pusher subscriptions')
      channel.unbind('new-notification', handleNewNotification)
      channel.unbind('notifications-read', handleNotificationsRead)
      pusherClient.unsubscribe(`user-${session.user.id}`)
      window.removeEventListener('notifications-read', handleCustomRead)
    }
  }, [session?.user?.id])

  const navItems = [
    {
      name: 'Home',
      icon: pathname === '/home' || pathname === '/' ? HomeIconSolid : HomeIcon,
      href: '/home',
      active: pathname === '/home' || pathname === '/'
    },
    {
      name: 'Notifications',
      icon: pathname === '/notifications' ? BellIconSolid : BellIcon,
      href: '/notifications',
      active: pathname === '/notifications',
      badge: unreadCount > 0 ? unreadCount : undefined
    },
    {
      name: 'Profile',
      icon: pathname?.startsWith('/profile') ? UserIconSolid : UserIcon,
      href: session?.user?.user_id ? `/profile/${session.user.user_id}` : '/home',
      active: pathname?.startsWith('/profile')
    },
  ]

  if (!session?.user) {
    return null
  }

  return (
    <div className="fixed left-0 top-0 h-full w-64 border-r border-border bg-background p-4 flex flex-col">
      {/* Logo */}
      <div className="mb-8">
        <Link href="/home" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">V</span>
          </div>
          <span className="text-xl font-bold">Vector</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-4 px-4 py-3 rounded-full transition-colors relative ${
                item.active
                  ? 'font-bold'
                  : 'hover:bg-gray-900'
              }`}
            >
              <div className="relative">
                <Icon className="w-6 h-6" />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span>{item.name}</span>
            </Link>
          )
        })}

        {/* Post Button */}
        <button
          onClick={() => router.push('/home?post=true')}
          className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-full transition-colors flex items-center justify-center space-x-2 mt-4"
        >
          <PencilSquareIcon className="w-5 h-5" />
          <span>Post</span>
        </button>
      </nav>

      {/* User Menu */}
      <UserMenu />
    </div>
  )
}

