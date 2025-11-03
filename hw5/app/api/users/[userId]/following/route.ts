import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: params.userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const follows = await prisma.follow.findMany({
      where: { followerId: user.id },
      include: {
        following: {
          select: {
            id: true,
            user_id: true,
            name: true,
            avatar_url: true,
            image: true,
            bio: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(follows.map(f => f.following))
  } catch (error) {
    console.error('Error fetching following:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

