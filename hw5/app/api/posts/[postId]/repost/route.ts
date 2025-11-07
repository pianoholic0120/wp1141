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

    // Get optional content from request body for repost with comment
    const body = await req.json().catch(() => ({}))
    const repostContent = body.content || ''

    // Find the original post (if it's a repost, get the original; otherwise use the post itself)
    let originalPost = await prisma.post.findUnique({
      where: { id: params.postId }
    })

    if (!originalPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // If this is a repost, get the original post
    if (originalPost.is_repost && originalPost.originalPostId) {
      const trueOriginalPost = await prisma.post.findUnique({
        where: { id: originalPost.originalPostId }
      })
      if (trueOriginalPost) {
        originalPost = trueOriginalPost
      }
    }

    // Check if user can see the original post (based on visibility settings)
    // Use the original post ID for visibility check
    const canSee = await canUserSeePost(originalPost.id, session.user.id as string)
    if (!canSee) {
      return NextResponse.json({ error: 'You cannot interact with this post' }, { status: 403 })
    }

    // Check if user already reposted (use originalPost.id, not params.postId)
    const existingRepost = await prisma.post.findFirst({
      where: {
        authorId: session.user.id as string,
        originalPostId: originalPost.id,
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
          originalPostId: originalPost.id,
          is_repost: true
        }
      })

      pusher.trigger(`post-${originalPost.id}`, 'repost-removed', {
        postId: originalPost.id,
        userId: session.user.id,
        repostCount
      })

      return NextResponse.json({ reposted: false, repostCount })
    } else {
      // Parse text to extract hashtags and mentions if repost has content
      let hashtags: string[] = []
      let mentions: string[] = []
      
      if (repostContent.trim()) {
        const { parseText } = await import('@/lib/utils/textParser')
        const parsedText = parseText(repostContent)
        hashtags = parsedText.filter(p => p.type === 'hashtag').map(p => p.hashtag!)
        mentions = parsedText.filter(p => p.type === 'mention').map(p => p.mention!)
      }

      // Create repost (use originalPost.id)
      // Allow content to be provided for repost with comment
      const repost = await prisma.post.create({
        data: {
          authorId: session.user.id as string,
          content: repostContent.trim() || '', // Use provided content or empty string
          originalPostId: originalPost.id,
          is_repost: true,
          hashtags: {
            create: await Promise.all(
              hashtags.map(async (tag) => {
                const hashtag = await prisma.hashtag.upsert({
                  where: { tag: tag.toLowerCase() },
                  create: { tag: tag.toLowerCase() },
                  update: {}
                })
                return { hashtagId: hashtag.id }
              })
            )
          },
          mentions: {
            create: (await Promise.all(
              mentions.map(async (mentionUserId) => {
                const mentionedUser = await prisma.user.findUnique({
                  where: { user_id: mentionUserId }
                })
                if (mentionedUser) {
                  return { userId: mentionedUser.id }
                }
                return null
              })
            )).filter(Boolean) as any[]
          }
        }
      })

      // Create notifications for mentioned users in repost comment
      for (const mentionUserId of mentions) {
        const mentionedUser = await prisma.user.findUnique({
          where: { user_id: mentionUserId }
        })
        if (mentionedUser && mentionedUser.id !== session.user.id && mentionedUser.id !== originalPost.authorId) {
          await createNotification({
            userId: mentionedUser.id,
            actorId: session.user.id as string,
            type: 'mention',
            postId: repost.id
          })
        }
      }

      const repostCount = await prisma.post.count({
        where: {
          originalPostId: originalPost.id,
          is_repost: true
        }
      })

      // Create notification for original post author (if not reposting own post)
      // Use repost.id instead of originalPost.id so clicking notification goes to the repost
      // Note: Notification is sent regardless of post visibility settings.
      // If a user can see and interact with a post, the author should be notified.
      if (originalPost.authorId !== session.user.id) {
        await createNotification({
          userId: originalPost.authorId,
          actorId: session.user.id as string,
          type: 'repost',
          postId: repost.id
        })
      }

      // Trigger Pusher event for repost count update
      pusher.trigger(`post-${originalPost.id}`, 'repost-added', {
        postId: originalPost.id,
        userId: session.user.id,
        repostCount
      })

      // Also trigger 'new-post' event so the repost appears in the feed
      // Fetch the repost with all necessary data
      const repostWithData = await prisma.post.findUnique({
        where: { id: repost.id },
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

      if (repostWithData) {
        // Check if current user has liked this repost
        const isLiked = await prisma.like.findUnique({
          where: {
            userId_postId: {
              userId: session.user.id as string,
              postId: repost.id
            }
          }
        })

        pusher.trigger('posts', 'new-post', {
          post: {
            ...repostWithData,
            isLiked: !!isLiked,
            likeCount: repostWithData._count.likes,
            commentCount: repostWithData._count.comments,
            repostCount: repostWithData._count.reposts,
            visibility: repostWithData.visibility || 'public',
            replySettings: repostWithData.replySettings || 'everyone',
            _count: undefined
          }
        })
      }

      return NextResponse.json({ reposted: true, repostCount })
    }
  } catch (error) {
    console.error('Error toggling repost:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

