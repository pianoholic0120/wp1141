import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pusher } from '@/lib/pusher'
import { createNotification } from '@/lib/notifications'

export async function POST(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const originalPost = await prisma.post.findUnique({
      where: { id: params.postId }
    })

    if (!originalPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check if user already reposted
    const existingRepost = await prisma.post.findFirst({
      where: {
        authorId: session.user.id as string,
        originalPostId: params.postId,
        is_repost: true
      }
    })

    if (existingRepost) {
      // Delete repost (unrepost)
      await prisma.post.delete({
        where: { id: existingRepost.id }
      })

      const repostCount = await prisma.post.count({
        where: {
          originalPostId: params.postId,
          is_repost: true
        }
      })

      pusher.trigger(`post-${params.postId}`, 'repost-removed', {
        postId: params.postId,
        userId: session.user.id,
        repostCount
      })

      return NextResponse.json({ reposted: false, repostCount })
    } else {
      // Create repost
      await prisma.post.create({
        data: {
          authorId: session.user.id as string,
          content: '',
          originalPostId: params.postId,
          is_repost: true
        }
      })

      const repostCount = await prisma.post.count({
        where: {
          originalPostId: params.postId,
          is_repost: true
        }
      })

      // Create notification for original post author (if not reposting own post)
      if (originalPost.authorId !== session.user.id) {
        await createNotification({
          userId: originalPost.authorId,
          actorId: session.user.id as string,
          type: 'repost',
          postId: params.postId
        })
      }

      pusher.trigger(`post-${params.postId}`, 'repost-added', {
        postId: params.postId,
        userId: session.user.id,
        repostCount
      })

      return NextResponse.json({ reposted: true, repostCount })
    }
  } catch (error) {
    console.error('Error toggling repost:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

