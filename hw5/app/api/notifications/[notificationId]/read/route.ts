import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pusher } from '@/lib/pusher'

export async function PUT(
  req: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the notification belongs to the current user
    const notification = await prisma.notification.findUnique({
      where: { id: params.notificationId }
    })

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    if (notification.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updated = await prisma.notification.update({
      where: { id: params.notificationId },
      data: { read: true }
    })

    // Trigger Pusher event to update unread count in sidebar
    try {
      await pusher.trigger(`user-${session.user.id}`, 'notifications-read', {
        userId: session.user.id
      })
    } catch (pusherError) {
      console.error('Error triggering Pusher notification read event:', pusherError)
      // Continue anyway - notification was marked as read
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

