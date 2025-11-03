import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseText } from '@/lib/utils/textParser'
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

    const body = await req.json()
    const { content } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Parse text to extract hashtags and mentions
    const parsedText = parseText(content)
    const hashtags = parsedText.filter(p => p.type === 'hashtag').map(p => p.hashtag!)
    const mentions = parsedText.filter(p => p.type === 'mention').map(p => p.mention!)

    // Create comment
    const comment = await prisma.post.create({
      data: {
        authorId: session.user.id as string,
        content: content.trim(),
        parentPostId: params.postId,
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
      }
    })

    // Get updated comment count
    const commentCount = await prisma.post.count({
      where: { parentPostId: params.postId }
    })

    // Trigger Pusher event
    pusher.trigger(`post-${params.postId}`, 'comment-added', {
      postId: params.postId,
      commentCount,
      comment: {
        ...comment,
        isLiked: false,
        likeCount: 0,
        commentCount: 0,
        repostCount: 0,
        _count: undefined
      }
    })

    return NextResponse.json({
      ...comment,
      isLiked: false,
      likeCount: 0,
      commentCount: 0,
      repostCount: 0,
      _count: undefined
    })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

