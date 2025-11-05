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

    // Get all posts first, then filter by visibility
    const allPosts = postHashtags
      .map(ph => ph.post)
      .filter(post => post.parentPostId === null) // Only top-level posts, not comments

    // Filter posts by visibility settings (similar to main posts API)
    const filteredPosts = await Promise.all(
      allPosts.map(async (post) => {
        const visibility = post.visibility || 'public'
        const isOwnPost = currentUserId === post.authorId

        // Post author can always see their own posts
        if (isOwnPost) {
          return post
        }

        // Public posts: everyone can see
        if (visibility === 'public') {
          return post
        }

        // For followers visibility: only people the author follows or who follow the author
        if (visibility === 'followers' && currentUserId) {
          const following = await prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: currentUserId,
                followingId: post.authorId
              }
            }
          })
          const followedBy = await prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: post.authorId,
                followingId: currentUserId
              }
            }
          })
          if (following || followedBy) {
            return post
          }
          return null // Hide post if visibility check fails
        }

        // For mentioned visibility: only mentioned users can see
        if (visibility === 'mentioned' && currentUserId) {
          const currentUser = await prisma.user.findUnique({
            where: { id: currentUserId },
            select: { user_id: true }
          })
          if (currentUser?.user_id) {
            const mentions = await prisma.mention.findMany({
              where: { postId: post.id },
              include: { user: { select: { user_id: true } } }
            })
            const mentionedUserIds = mentions.map(m => m.user.user_id).filter(Boolean)
            if (mentionedUserIds.includes(currentUser.user_id)) {
              return post
            }
          }
          return null // Hide post if visibility check fails
        }

        return null // Hide post if visibility check fails
      })
    )

    // Filter out null values and sort by createdAt desc (newest first)
    const visiblePosts = filteredPosts
      .filter((post): post is typeof allPosts[0] => post !== null)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Get like status for current user and format posts
    const posts = await Promise.all(
      visiblePosts.map(async (post) => {
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

