import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.log('[Unread Count] No session')
      return NextResponse.json({ count: 0 })
    }

    console.log('[Unread Count] Fetching for user:', session.user.id)

    try {
      // Check if notification model exists
      if (!prisma.notification) {
        console.error('[Unread Count] Notification model not available in Prisma Client')
        return NextResponse.json({ count: 0 })
      }

      const count = await prisma.notification.count({
        where: {
          userId: session.user.id as string,
          read: false
        }
      })

      console.log('[Unread Count] Count:', count)
      return NextResponse.json({ count })
    } catch (dbError: any) {
      console.error('[Unread Count] Database error:', dbError)
      // If table doesn't exist, return 0
      if (dbError.message?.includes('does not exist') || dbError.message?.includes('Unknown model')) {
        console.log('[Unread Count] Notification table does not exist yet, returning 0')
        return NextResponse.json({ count: 0 })
      }
      throw dbError
    }
  } catch (error: any) {
    console.error('[Unread Count] Error:', error)
    return NextResponse.json({ count: 0 })
  }
}

