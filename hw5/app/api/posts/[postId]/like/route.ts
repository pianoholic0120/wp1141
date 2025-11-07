import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pusher } from '@/lib/pusher'
import { createNotification } from '@/lib/notifications'
import { canUserSeePost } from '@/lib/postVisibility'

export async function POST(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id as string,
          postId: params.postId
        }
      }
    })

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: {
          id: existingLike.id
        }
      })

      const likeCount = await prisma.like.count({
        where: { postId: params.postId }
      })

      // Trigger Pusher event
      pusher.trigger(`post-${params.postId}`, 'like-removed', {
        postId: params.postId,
        userId: session.user.id,
        likeCount
      })

      return NextResponse.json({ liked: false, likeCount })
    } else {
      // Get post to find author (for reposts, notify the repost author, not original author)
      const post = await prisma.post.findUnique({
        where: { id: params.postId },
        select: { authorId: true }
      })

      if (!post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }

      // Check if user can see the post (based on visibility settings)
      const canSee = await canUserSeePost(params.postId, session.user.id as string)
      if (!canSee) {
        return NextResponse.json({ error: 'You cannot interact with this post' }, { status: 403 })
      }

      // Like
      await prisma.like.create({
        data: {
          userId: session.user.id as string,
          postId: params.postId
        }
      })

      const likeCount = await prisma.like.count({
        where: { postId: params.postId }
      })

      // Create notification for post author (for reposts, this is the repost author)
      // Note: Notification is sent regardless of post visibility settings.
      // If a user can see and interact with a post, the author should be notified.
      if (post.authorId !== session.user.id) {
        await createNotification({
          userId: post.authorId,
          actorId: session.user.id as string,
          type: 'like',
          postId: params.postId
        })
      }

      // Trigger Pusher event
      pusher.trigger(`post-${params.postId}`, 'like-added', {
        postId: params.postId,
        userId: session.user.id,
        likeCount
      })

      return NextResponse.json({ liked: true, likeCount })
    }
  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

