import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '5', 10)

    // Build where clause
    const where: any = {}
    if (query.trim()) {
      where.tag = {
        contains: query.toLowerCase(),
        mode: 'insensitive'
      }
    }

    // Get hashtags with post counts
    const hashtags = await prisma.hashtag.findMany({
      where,
      include: {
        _count: {
          select: {
            posts: true
          }
        }
      },
      take: 100 // Get more to sort properly
    })

    // Sort by post count (popularity) descending
    hashtags.sort((a, b) => b._count.posts - a._count.posts)
    
    // Take only the requested limit after sorting
    const limitedHashtags = hashtags.slice(0, limit)

    // Format response
    const result = limitedHashtags.map(hashtag => ({
      tag: hashtag.tag,
      count: hashtag._count.posts
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error searching hashtags:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

