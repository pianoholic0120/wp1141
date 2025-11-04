import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pusher } from '@/lib/pusher'

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.notification.updateMany({
      where: {
        userId: session.user.id as string,
        read: false
      },
      data: {
        read: true
      }
    })

    // Trigger Pusher event to update unread count in sidebar
    try {
      await pusher.trigger(`user-${session.user.id}`, 'notifications-read', {
        userId: session.user.id
      })
    } catch (pusherError) {
      console.error('Error triggering Pusher notification read event:', pusherError)
      // Continue anyway - notifications were marked as read
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

