import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { user_id: params.userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only allow users to see their own likes
    if (user.id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const likes = await prisma.like.findMany({
      where: {
        userId: user.id
      },
      include: {
        post: {
          include: {
            author: {
              select: {
                id: true,
                user_id: true,
                name: true,
                avatar_url: true,
                image: true,
              }
            },
            originalPost: {
              include: {
                author: {
                  select: {
                    id: true,
                    user_id: true,
                    name: true,
                    avatar_url: true,
                    image: true,
                  }
                }
              }
            },
            _count: {
              select: {
                likes: true,
                comments: true,
                reposts: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const postsWithLikes = likes.map((like) => ({
      ...like.post,
      isLiked: true,
      likeCount: like.post._count.likes,
      commentCount: like.post._count.comments,
      repostCount: like.post._count.reposts,
      _count: undefined
    }))

    return NextResponse.json(postsWithLikes)
  } catch (error) {
    console.error('Error fetching user likes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

