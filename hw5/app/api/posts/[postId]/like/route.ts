import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pusher } from '@/lib/pusher'

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

