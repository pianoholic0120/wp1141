import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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

    const posts = await prisma.post.findMany({
      where: {
        authorId: user.id,
        parentPostId: null, // Only top-level posts, not comments
      },
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const session = await getServerSession(authOptions)
    const currentUserId = session?.user?.id as string | undefined

    // Get like status for current user
    const postsWithLikes = await Promise.all(
      posts.map(async (post) => {
        let isLiked = false
        if (currentUserId) {
          const like = await prisma.like.findUnique({
            where: {
              userId_postId: {
                userId: currentUserId,
                postId: post.id
              }
            }
          })
          isLiked = !!like
        }

        return {
          ...post,
          isLiked,
          likeCount: post._count.likes,
          commentCount: post._count.comments,
          repostCount: post._count.reposts,
          visibility: post.visibility,
          replySettings: post.replySettings,
          _count: undefined
        }
      })
    )

    return NextResponse.json(postsWithLikes)
  } catch (error) {
    console.error('Error fetching user posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

