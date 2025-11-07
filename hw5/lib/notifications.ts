import { prisma } from '@/lib/prisma'
import { pusher } from '@/lib/pusher'

export async function createNotification(params: {
  userId: string // Recipient user ID
  actorId: string // User who triggered the notification
  type: 'like' | 'comment' | 'follow' | 'mention' | 'repost'
  postId?: string // Related post ID (optional for follow notifications)
}) {
  try {
    // Don't create notification if user is notifying themselves
    if (params.userId === params.actorId) {
      return null
    }

    // Check if notification model exists
    if (!prisma.notification) {
      console.error('Notification model not available in Prisma Client')
      return null
    }

    // Check if notification already exists (to prevent duplicates)
    const existing = await prisma.notification.findFirst({
      where: {
        userId: params.userId,
        actorId: params.actorId,
        type: params.type,
        postId: params.postId || null,
        read: false
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // If notification exists and was created recently (within 1 minute), don't create duplicate
    if (existing) {
      const timeDiff = Date.now() - existing.createdAt.getTime()
      if (timeDiff < 60000) { // 1 minute
        return existing
      }
    }

    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        actorId: params.actorId,
        type: params.type,
        postId: params.postId || null,
        read: false, // Explicitly set to false to ensure it's unread
      },
      include: {
        actor: {
          select: {
            id: true,
            user_id: true,
            name: true,
            avatar_url: true,
            image: true,
          }
        },
        post: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                id: true,
                user_id: true,
                name: true,
              }
            }
          }
        }
      }
    })
    
    // Trigger Pusher event for real-time notification
    try {
      const pusherChannel = `user-${params.userId}`
      await pusher.trigger(pusherChannel, 'new-notification', {
        notification: {
          id: notification.id,
          type: notification.type,
          actor: notification.actor,
          postId: notification.postId,
          createdAt: notification.createdAt,
        }
      })
    } catch (pusherError) {
      console.error('[Notification] Error triggering Pusher notification:', pusherError)
      // Continue anyway - notification was created
    }

    return notification
  } catch (error) {
    console.error('Error creating notification:', error)
    return null
  }
}

