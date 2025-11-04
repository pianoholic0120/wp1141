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

    const post = await prisma.post.findUnique({
      where: { id: params.postId },
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
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Get like status
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

    return NextResponse.json({
      ...post,
      isLiked,
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      repostCount: post._count.reposts,
      visibility: post.visibility,
      replySettings: post.replySettings,
      _count: undefined
    })
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const post = await prisma.post.findUnique({
      where: { id: params.postId }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Can only delete own posts, and not reposts
    if (post.authorId !== session.user.id || post.is_repost) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.post.delete({
      where: { id: params.postId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

