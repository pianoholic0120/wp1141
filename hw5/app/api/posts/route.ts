import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseText } from '@/lib/utils/textParser'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const filter = searchParams.get('filter') || 'all' // 'all' or 'following'
    const parentId = searchParams.get('parentId') // For recursive comments

    const session = await getServerSession(authOptions)
    const currentUserId = session?.user?.id as string | undefined

    let where: any = {
      parentPostId: parentId || null,
    }

    if (filter === 'following' && currentUserId) {
      // Get posts from users that current user follows
      const following = await prisma.follow.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true }
      })

      const followingIds = following.map(f => f.followingId)
      
      where = {
        ...where,
        authorId: {
          in: followingIds
        }
      }
    }

    const posts = await prisma.post.findMany({
      where,
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
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    })

    // Get like status for current user
    const postsWithLikes = await Promise.all(
      posts.map(async (post) => {
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

        return {
          ...post,
          isLiked,
          likeCount: post._count.likes,
          commentCount: post._count.comments,
          repostCount: post._count.reposts,
          _count: undefined
        }
      })
    )

    return NextResponse.json(postsWithLikes)
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('[POST /api/posts] Request received')
    
    const session = await getServerSession(authOptions)
    console.log('[POST /api/posts] Session:', session?.user?.id)
    
    if (!session?.user?.id) {
      console.log('[POST /api/posts] Unauthorized - no session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    console.log('[POST /api/posts] Body:', body)
    const { content, parentPostId, originalPostId } = body

    if (!content || content.trim().length === 0) {
      console.log('[POST /api/posts] No content provided')
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Parse text to extract hashtags and mentions
    console.log('[POST /api/posts] Parsing text...')
    const parsedText = parseText(content)
    const hashtags = parsedText.filter(p => p.type === 'hashtag').map(p => p.hashtag!)
    const mentions = parsedText.filter(p => p.type === 'mention').map(p => p.mention!)
    console.log('[POST /api/posts] Parsed - hashtags:', hashtags, 'mentions:', mentions)

    // Create post
    console.log('[POST /api/posts] Creating post...')
    const post = await prisma.post.create({
      data: {
        authorId: session.user.id as string,
        content: content.trim(),
        parentPostId: parentPostId || null,
        originalPostId: originalPostId || null,
        is_repost: !!originalPostId,
        hashtags: {
          create: await Promise.all(
            hashtags.map(async (tag) => {
              // Find or create hashtag
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

    // Trigger Pusher event for new post
    const { pusher } = await import('@/lib/pusher')
    pusher.trigger('posts', 'new-post', {
      post: {
        ...post,
        isLiked: false,
        likeCount: 0,
        commentCount: 0,
        repostCount: 0,
      }
    })

    return NextResponse.json({
      ...post,
      isLiked: false,
      likeCount: 0,
      commentCount: 0,
      repostCount: 0,
      _count: undefined
    })
  } catch (error: any) {
    console.error('[POST /api/posts] Error creating post:', error)
    console.error('[POST /api/posts] Error stack:', error.stack)
    console.error('[POST /api/posts] Error message:', error.message)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

