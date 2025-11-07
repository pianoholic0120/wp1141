import { prisma } from '@/lib/prisma'

/**
 * Check if a user can see a post based on its visibility settings
 * @param postId - The ID of the post to check
 * @param userId - The ID of the user trying to view the post
 * @returns true if the user can see the post, false otherwise
 */
export async function canUserSeePost(postId: string, userId: string | undefined): Promise<boolean> {
  if (!userId) {
    // Not logged in - can only see public posts
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { visibility: true }
    })
    return post?.visibility === 'public'
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: {
        select: { id: true }
      },
      mentions: {
        include: {
          user: {
            select: { user_id: true }
          }
        }
      }
    }
  })

  if (!post) {
    return false
  }

  const visibility = post.visibility || 'public'
  const isOwnPost = userId === post.author.id

  // Post author can always see their own posts
  if (isOwnPost) {
    return true
  }

  // Public posts: everyone can see
  if (visibility === 'public') {
    return true
  }

  // For followers visibility: only people the author follows or who follow the author
  if (visibility === 'followers') {
    const following = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: post.author.id
        }
      }
    })
    const followedBy = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: post.author.id,
          followingId: userId
        }
      }
    })
    return !!following || !!followedBy
  }

  // For mentioned visibility: only people mentioned in the post
  if (visibility === 'mentioned') {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { user_id: true }
    })
    if (currentUser?.user_id) {
      const mentionedUserIds = post.mentions.map(m => m.user.user_id).filter(Boolean)
      return mentionedUserIds.includes(currentUser.user_id)
    }
    return false
  }

  return false
}

