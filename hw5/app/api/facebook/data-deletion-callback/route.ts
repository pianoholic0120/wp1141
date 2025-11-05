import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

/**
 * Facebook Data Deletion Callback
 * 
 * This endpoint handles Facebook's data deletion requests.
 * When a user requests to delete their data from Facebook,
 * Facebook will send a POST request to this endpoint.
 * 
 * Documentation: https://developers.facebook.com/docs/apps/delete-data
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { signed_request } = body

    if (!signed_request) {
      return NextResponse.json(
        { error: 'Missing signed_request parameter' },
        { status: 400 }
      )
    }

    // Parse signed_request
    const [encoded_sig, payload] = signed_request.split('.', 2)
    
    if (!encoded_sig || !payload) {
      return NextResponse.json(
        { error: 'Invalid signed_request format' },
        { status: 400 }
      )
    }

    // Decode payload
    const decodedPayload = Buffer.from(payload, 'base64').toString('utf-8')
    const data = JSON.parse(decodedPayload)

    // Verify signature (optional but recommended)
    // In production, you should verify the signature using your app secret
    const appSecret = process.env.FACEBOOK_CLIENT_SECRET
    if (appSecret) {
      const expectedSig = crypto
        .createHmac('sha256', appSecret)
        .update(payload)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')

      if (encoded_sig !== expectedSig) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    }

    // Handle different types of requests
    if (data.type === 'USER_DATA_DELETION') {
      // Facebook is requesting deletion confirmation
      // Return a confirmation URL where user can request deletion
      const confirmationCode = data.user_id

      return NextResponse.json({
        url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/facebook/confirm-deletion?code=${confirmationCode}`,
        confirmation_code: confirmationCode
      })
    } else if (data.type === 'USER_DATA_DELETION_CONFIRMATION') {
      // User has confirmed deletion - actually delete the data
      const userId = data.user_id

      if (!userId) {
        return NextResponse.json(
          { error: 'Missing user_id in deletion confirmation' },
          { status: 400 }
        )
      }

      // Find user by Facebook account
      const account = await prisma.account.findFirst({
        where: {
          provider: 'facebook',
          providerAccountId: userId
        },
        include: {
          user: true
        }
      })

      if (account && account.user) {
        // Delete user data
        const deletedUserId = account.user.id

        // Delete all user-related data
        await prisma.$transaction([
          // Delete notifications
          prisma.notification.deleteMany({
            where: {
              OR: [
                { userId: deletedUserId },
                { actorId: deletedUserId }
              ]
            }
          }),
          // Delete likes
          prisma.like.deleteMany({
            where: {
              userId: deletedUserId
            }
          }),
          // Delete follows
          prisma.follow.deleteMany({
            where: {
              OR: [
                { followerId: deletedUserId },
                { followingId: deletedUserId }
              ]
            }
          }),
          // Delete mentions
          prisma.mention.deleteMany({
            where: {
              userId: deletedUserId
            }
          }),
          // Delete post hashtags (via posts)
          prisma.postHashtag.deleteMany({
            where: {
              post: {
                authorId: deletedUserId
              }
            }
          }),
          // Delete posts (cascades to comments, likes, reposts, mentions)
          prisma.post.deleteMany({
            where: {
              authorId: deletedUserId
            }
          }),
          // Delete drafts
          prisma.draft.deleteMany({
            where: {
              userId: deletedUserId
            }
          }),
          // Delete accounts
          prisma.account.deleteMany({
            where: {
              userId: deletedUserId
            }
          }),
          // Delete user
          prisma.user.delete({
            where: {
              id: deletedUserId
            }
          })
        ])

        return NextResponse.json({
          success: true,
          message: 'User data deleted successfully'
        })
      } else {
        // User not found - still return success to Facebook
        return NextResponse.json({
          success: true,
          message: 'User not found or already deleted'
        })
      }
    }

    // Default response for other request types
    return NextResponse.json({
      success: true,
      message: 'Request received'
    })
  } catch (error: any) {
    console.error('[Facebook Data Deletion] Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for deletion confirmation page
 * This is the URL users will visit to confirm deletion
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json(
        { error: 'Missing confirmation code' },
        { status: 400 }
      )
    }

    // In a real implementation, you would:
    // 1. Show a confirmation page to the user
    // 2. After user confirms, make a request to Facebook to confirm deletion
    // 3. Then delete the user data

    // For now, we'll return a simple response
    return NextResponse.json({
      message: 'Deletion confirmation page',
      code: code,
      instructions: 'Visit this page to confirm deletion of your data'
    })
  } catch (error: any) {
    console.error('[Facebook Data Deletion] GET Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

