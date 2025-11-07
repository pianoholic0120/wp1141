'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Avatar from '@/components/common/Avatar'
import { formatRelativeTime } from '@/lib/utils/timeFormat'
import { HeartIcon, ChatBubbleLeftIcon, ArrowPathIcon, UserPlusIcon, AtSymbolIcon } from '@heroicons/react/24/outline'
import { getPusherClient } from '@/lib/pusher-client'
import toast from 'react-hot-toast'

interface Notification {
  id: string
  type: 'like' | 'comment' | 'follow' | 'mention' | 'repost'
  read: boolean
  postId?: string | null
  createdAt: string
  actor: {
    id: string
    user_id: string | null
    name: string | null
    avatar_url: string | null
    image: string | null
  }
  post?: {
    id: string
    content: string
    author: {
      id: string
      user_id: string | null
      name: string | null
    }
  } | null
}

export default function NotificationsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) throw new Error('Failed to fetch notifications')
      const data = await res.json()
      setNotifications(data)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user) {
      fetchNotifications()
    }
  }, [session])

  // Set up real-time notifications
  useEffect(() => {
    if (!session?.user?.id || typeof window === 'undefined') return

    const pusherClient = getPusherClient()
    if (!pusherClient) return

    const channelName = `user-${session.user.id}`
    const channel = pusherClient.channel(channelName) || pusherClient.subscribe(channelName)

    const handleNewNotification = () => {
      fetchNotifications()
    }

    const handleNotificationsRead = () => {
      fetchNotifications()
    }

    channel.bind('new-notification', handleNewNotification)
    channel.bind('notifications-read', handleNotificationsRead)

    // Also listen to custom events for immediate updates
    const handleCustomRead = () => {
      fetchNotifications()
    }
    window.addEventListener('notifications-read', handleCustomRead)

    return () => {
      channel.unbind('new-notification', handleNewNotification)
      channel.unbind('notifications-read', handleNotificationsRead)
      window.removeEventListener('notifications-read', handleCustomRead)
      // Don't unsubscribe from the channel as Sidebar still needs it
    }
  }, [session?.user?.id])

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      try {
        const res = await fetch(`/api/notifications/${notification.id}/read`, {
          method: 'PUT'
        })
        if (res.ok) {
          setNotifications(prev =>
            prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
          )
          
          // Trigger custom event to update sidebar count
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('notifications-read'))
          }
        }
      } catch (error) {
        console.error('Error marking notification as read:', error)
      }
    }

    // Navigate based on notification type
    if (notification.postId) {
      router.push(`/post/${notification.postId}`)
    } else if (notification.type === 'follow') {
      router.push(`/profile/${notification.actor.user_id}`)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'PUT'
      })
      if (!res.ok) throw new Error('Failed to mark all as read')
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      
      // Trigger a custom event to update sidebar count
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notifications-read'))
      }
      
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Failed to mark all as read')
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <HeartIcon className="w-5 h-5 text-red-500" />
      case 'comment':
        return <ChatBubbleLeftIcon className="w-5 h-5 text-primary" />
      case 'follow':
        return <UserPlusIcon className="w-5 h-5 text-primary" />
      case 'mention':
        return <AtSymbolIcon className="w-5 h-5 text-primary" />
      case 'repost':
        return <ArrowPathIcon className="w-5 h-5 text-green-500" />
      default:
        return null
    }
  }

  const getNotificationText = (notification: Notification) => {
    const actorName = notification.actor.name || notification.actor.user_id || 'Someone'
    switch (notification.type) {
      case 'like':
        return `${actorName} liked your post`
      case 'comment':
        return `${actorName} commented on your post`
      case 'follow':
        return `${actorName} followed you`
      case 'mention':
        return `${actorName} mentioned you in a post`
      case 'repost':
        return `${actorName} reposted your post`
      default:
        return 'New notification'
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto border-x border-border min-h-screen">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading notifications...</div>
        </div>
      </div>
    )
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="max-w-2xl mx-auto border-x border-border min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-sm text-primary hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">No notifications yet</div>
        </div>
      ) : (
        <div>
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`border-b border-border p-4 hover:bg-gray-950 transition-colors cursor-pointer ${
                !notification.read ? 'bg-gray-950/50' : ''
              }`}
            >
              <div className="flex space-x-3">
                <div className="flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                <Avatar
                  src={notification.actor.avatar_url || notification.actor.image || undefined}
                  alt={notification.actor.name || 'User'}
                  size={48}
                  className="flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold">
                      {notification.actor.name || 'Anonymous'}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {getNotificationText(notification)}
                    </span>
                  </div>
                  {notification.post && (
                    <div className="text-gray-500 text-sm mt-2 line-clamp-2">
                      {notification.post.content}
                    </div>
                  )}
                  <div className="text-gray-500 text-xs mt-2">
                    {formatRelativeTime(notification.createdAt)}
                  </div>
                </div>
                {!notification.read && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

