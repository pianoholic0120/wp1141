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

    const searchParams = req.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    try {
      // Check if notification model exists
      if (!prisma.notification) {
        console.error('Notification model not available in Prisma Client')
        return NextResponse.json([])
      }

      const notifications = await prisma.notification.findMany({
        where: {
          userId: session.user.id as string
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
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      })

      return NextResponse.json(notifications)
    } catch (dbError: any) {
      console.error('Database error fetching notifications:', dbError)
      // If table doesn't exist, return empty array
      if (dbError.message?.includes('does not exist') || dbError.message?.includes('Unknown model')) {
        console.log('Notification table does not exist yet, returning empty array')
        return NextResponse.json([])
      }
      throw dbError
    }
  } catch (error: any) {
    console.error('Error fetching notifications:', error)
    console.error('Error details:', error.message, error.stack)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 })
  }
}

