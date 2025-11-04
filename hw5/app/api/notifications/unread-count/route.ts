import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      // Check if notification model exists
      if (!prisma.notification) {
        console.error('Notification model not available in Prisma Client')
        return NextResponse.json({ count: 0 })
      }

      const count = await prisma.notification.count({
        where: {
          userId: session.user.id as string,
          read: false
        }
      })

      return NextResponse.json({ count })
    } catch (dbError: any) {
      console.error('Database error fetching unread count:', dbError)
      // If table doesn't exist, return 0
      if (dbError.message?.includes('does not exist') || dbError.message?.includes('Unknown model')) {
        console.log('Notification table does not exist yet, returning 0')
        return NextResponse.json({ count: 0 })
      }
      throw dbError
    }
  } catch (error: any) {
    console.error('Error fetching unread count:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 })
  }
}

