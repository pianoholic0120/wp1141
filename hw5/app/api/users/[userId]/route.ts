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
      where: { user_id: params.userId },
      select: {
        id: true,
        user_id: true,
        name: true,
        email: true,
        avatar_url: true,
        image: true,
        bio: true,
        background_image_url: true,
        createdAt: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get post count (only top-level posts, excluding comments/replies)
    const postCount = await prisma.post.count({
      where: { 
        authorId: user.id,
        parentPostId: null // Only count top-level posts, not replies/comments
      }
    })

    // Get follower and following counts
    const followerCount = await prisma.follow.count({
      where: { followingId: user.id }
    })

    const followingCount = await prisma.follow.count({
      where: { followerId: user.id }
    })

    // Check if current user follows this user
    const session = await getServerSession(authOptions)
    let isFollowing = false
    if (session?.user?.id) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: session.user.id as string,
            followingId: user.id
          }
        }
      })
      isFollowing = !!follow
    }

    return NextResponse.json({
      ...user,
      postCount,
      followerCount,
      followingCount,
      isFollowing,
      isOwnProfile: session?.user?.id === user.id
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
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

    if (!user || user.id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const { name, bio, background_image_url, avatar_url } = body

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        bio,
        background_image_url,
        avatar_url,
      },
      select: {
        id: true,
        user_id: true,
        name: true,
        email: true,
        avatar_url: true,
        image: true,
        bio: true,
        background_image_url: true,
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

