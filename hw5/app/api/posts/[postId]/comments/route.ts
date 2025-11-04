import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const currentUserId = session?.user?.id as string | undefined

    const comments = await prisma.post.findMany({
      where: {
        parentPostId: params.postId
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

    // Get like status for current user
    const commentsWithLikes = await Promise.all(
      comments.map(async (comment) => {
        let isLiked = false
        if (currentUserId) {
          const like = await prisma.like.findUnique({
            where: {
              userId_postId: {
                userId: currentUserId,
                postId: comment.id
              }
            }
          })
          isLiked = !!like
        }

        return {
          ...comment,
          isLiked,
          likeCount: comment._count.likes,
          commentCount: comment._count.comments,
          repostCount: comment._count.reposts,
          visibility: comment.visibility,
          replySettings: comment.replySettings,
          _count: undefined
        }
      })
    )

    return NextResponse.json(commentsWithLikes)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

