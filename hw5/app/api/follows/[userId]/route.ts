import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pusher } from '@/lib/pusher'

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    console.log('[POST /api/follows] Request received for userId:', params.userId)
    const session = await getServerSession(authOptions)
    console.log('[POST /api/follows] Session:', {
      hasSession: !!session,
      userId: session?.user?.id,
      user_id: session?.user?.user_id,
      email: session?.user?.email
    })
    
    if (!session?.user?.id) {
      console.log('[POST /api/follows] No session or user id')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { user_id: params.userId }
    })

    console.log('[POST /api/follows] Target user:', {
      found: !!targetUser,
      targetUserId: targetUser?.id,
      targetUser_id: targetUser?.user_id
    })

    if (!targetUser) {
      console.log('[POST /api/follows] User not found with user_id:', params.userId)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (targetUser.id === session.user.id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id as string,
          followingId: targetUser.id
        }
      }
    })

    if (existingFollow) {
      return NextResponse.json({ error: 'Already following' }, { status: 400 })
    }

    const follow = await prisma.follow.create({
      data: {
        followerId: session.user.id as string,
        followingId: targetUser.id
      }
    })

    // Get updated follower count
    const followerCount = await prisma.follow.count({
      where: { followingId: targetUser.id }
    })

    // Trigger Pusher event for real-time updates
    try {
      await pusher.trigger(`user-${targetUser.id}`, 'follow-added', {
        followerId: session.user.id,
        followingId: targetUser.id,
        followerCount
      })
    } catch (pusherError) {
      console.error('[POST /api/follows] Pusher error:', pusherError)
      // Continue anyway - follow was successful
    }

    console.log('[POST /api/follows] Follow successful, returning:', { success: true, followerCount })
    return NextResponse.json({ success: true, followerCount })
  } catch (error) {
    console.error('[POST /api/follows] Error following user:', error)
    console.error('[POST /api/follows] Error stack:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    console.log('[DELETE /api/follows] Request received for userId:', params.userId)
    const session = await getServerSession(authOptions)
    console.log('[DELETE /api/follows] Session:', {
      hasSession: !!session,
      userId: session?.user?.id,
      user_id: session?.user?.user_id,
      email: session?.user?.email
    })
    
    if (!session?.user?.id) {
      console.log('[DELETE /api/follows] No session or user id')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { user_id: params.userId }
    })

    console.log('[DELETE /api/follows] Target user:', {
      found: !!targetUser,
      targetUserId: targetUser?.id,
      targetUser_id: targetUser?.user_id
    })

    if (!targetUser) {
      console.log('[DELETE /api/follows] User not found with user_id:', params.userId)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await prisma.follow.deleteMany({
      where: {
        followerId: session.user.id as string,
        followingId: targetUser.id
      }
    })

    // Get updated follower count
    const followerCount = await prisma.follow.count({
      where: { followingId: targetUser.id }
    })

    // Trigger Pusher event for real-time updates
    try {
      await pusher.trigger(`user-${targetUser.id}`, 'follow-removed', {
        followerId: session.user.id,
        followingId: targetUser.id,
        followerCount
      })
    } catch (pusherError) {
      console.error('[DELETE /api/follows] Pusher error:', pusherError)
      // Continue anyway - unfollow was successful
    }

    console.log('[DELETE /api/follows] Unfollow successful, returning:', { success: true, followerCount })
    return NextResponse.json({ success: true, followerCount })
  } catch (error) {
    console.error('[DELETE /api/follows] Error unfollowing user:', error)
    console.error('[DELETE /api/follows] Error stack:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

