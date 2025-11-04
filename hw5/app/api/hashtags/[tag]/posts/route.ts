import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { tag: string } }
) {
  try {
    const tag = decodeURIComponent(params.tag).toLowerCase()
    
    // Find hashtag
    const hashtag = await prisma.hashtag.findUnique({
      where: { tag }
    })

    if (!hashtag) {
      return NextResponse.json([])
    }

    // Get all posts with this hashtag
    const postHashtags = await prisma.postHashtag.findMany({
      where: { hashtagId: hashtag.id },
      include: {
        post: {
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
        }
      },
      orderBy: {
        post: {
          createdAt: 'desc'
        }
      }
    })

    const session = await getServerSession(authOptions)
    const currentUserId = session?.user?.id as string | undefined

    // Get like status for current user and format posts
    const posts = await Promise.all(
      postHashtags
        .map(ph => ph.post)
        .filter(post => post.parentPostId === null) // Only top-level posts, not comments
        .map(async (post) => {
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
            visibility: post.visibility,
            replySettings: post.replySettings,
            _count: undefined
          }
        })
    )

    return NextResponse.json(posts)
  } catch (error) {
    console.error('Error fetching hashtag posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

