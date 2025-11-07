'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { HomeIcon, UserIcon, PencilSquareIcon, BellIcon } from '@heroicons/react/24/outline'
import { HomeIcon as HomeIconSolid, UserIcon as UserIconSolid, BellIcon as BellIconSolid } from '@heroicons/react/24/solid'
import UserMenu from './UserMenu'
import Link from 'next/link'
import { subscribeToChannel, unsubscribeFromChannel } from '@/lib/pusher-client'

export default function Sidebar() {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)
  const [pusherConnected, setPusherConnected] = useState(false)

  // Shared function to fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const res = await fetch('/api/notifications/unread-count')
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.count || 0)
      }
    } catch (error) {
      setUnreadCount(0)
    }
  }

  // Initial fetch on mount
  useEffect(() => {
    if (session?.user?.id) {
      fetchUnreadCount()
    }
  }, [session?.user?.id])

  // Set up Pusher subscription - separate useEffect to prevent unnecessary re-subscriptions
  useEffect(() => {
    if (!session?.user?.id) return

    const channelName = `user-${session.user.id}`
    const channel = subscribeToChannel(channelName)
    
    if (!channel) return
    
    // Handle subscription success
    channel.bind('pusher:subscription_succeeded', () => {
      setPusherConnected(true)
    })
    
    // Handle subscription error
    channel.bind('pusher:subscription_error', (status: any) => {
      console.error('[Sidebar] Subscription error:', status)
      setPusherConnected(false)
    })
    
    // Handle new notification
    const handleNewNotification = () => {
      // Immediately increment unread count for instant feedback
      setUnreadCount(prev => prev + 1)
      
      // Also fetch from server to ensure accuracy
      setTimeout(() => {
        fetch('/api/notifications/unread-count')
          .then(res => res.json())
          .then(data => {
            setUnreadCount(data.count || 0)
          })
          .catch(() => setUnreadCount(0))
      }, 100)
    }
    
    // Handle notifications read
    const handleNotificationsRead = () => {
      fetch('/api/notifications/unread-count')
        .then(res => res.json())
        .then(data => {
          setUnreadCount(data.count || 0)
        })
        .catch(() => setUnreadCount(0))
    }
    
    channel.bind('new-notification', handleNewNotification)
    channel.bind('notifications-read', handleNotificationsRead)

    return () => {
      channel.unbind('new-notification', handleNewNotification)
      channel.unbind('notifications-read', handleNotificationsRead)
      channel.unbind('pusher:subscription_succeeded')
      channel.unbind('pusher:subscription_error')
      unsubscribeFromChannel(channelName)
      setPusherConnected(false)
    }
  }, [session?.user?.id])

  // Listen to custom read events separately to avoid re-subscription
  useEffect(() => {
    const handleCustomRead = () => {
      fetchUnreadCount()
    }
    
    window.addEventListener('notifications-read', handleCustomRead)
    
    return () => {
      window.removeEventListener('notifications-read', handleCustomRead)
    }
  }, [])

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
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center relative">
            <span className="text-white font-bold text-xl">V</span>
            {/* Pusher connection indicator */}
            <div 
              className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                pusherConnected ? 'bg-green-500' : 'bg-gray-500'
              }`}
              title={pusherConnected ? 'Real-time updates active' : 'Connecting...'}
            />
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
                {item.badge !== undefined && item.badge > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                    key={`badge-${item.name}-${item.badge}`}
                  >
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
