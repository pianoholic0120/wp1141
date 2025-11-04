import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '3') // Default to 3 users max

    console.log('[API /users/search] Query:', query, 'Limit:', limit)

    // Search users by user_id or name (case-insensitive)
    // If query is empty, show all users with user_id
    const whereClause: any = {
      user_id: { not: null } // Only users with user_id
    }

    if (query && query.length > 0) {
      whereClause.AND = [
        { user_id: { not: null } },
        {
          OR: [
            { user_id: { contains: query, mode: 'insensitive' } },
            { name: { contains: query, mode: 'insensitive' } }
          ]
        }
      ]
    }

    console.log('[API /users/search] Where clause:', JSON.stringify(whereClause, null, 2))

    // Get all matching users first (without limit for sorting)
    let allUsers = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        user_id: true,
        name: true,
        avatar_url: true,
        image: true,
      },
      orderBy: [
        { user_id: 'asc' }
      ]
    })

    console.log('[API /users/search] Found', allUsers.length, 'users:', allUsers.map(u => u.user_id))

    // Sort results to prioritize matches
    if (query && query.length > 0) {
      const queryLower = query.toLowerCase()
      allUsers.sort((a, b) => {
        const aUserId = (a.user_id || '').toLowerCase()
        const bUserId = (b.user_id || '').toLowerCase()
        const aName = (a.name || '').toLowerCase()
        const bName = (b.name || '').toLowerCase()

        // Exact match in user_id (highest priority)
        if (aUserId === queryLower && bUserId !== queryLower) return -1
        if (bUserId === queryLower && aUserId !== queryLower) return 1

        // Starts with query in user_id
        if (aUserId.startsWith(queryLower) && !bUserId.startsWith(queryLower)) return -1
        if (bUserId.startsWith(queryLower) && !aUserId.startsWith(queryLower)) return 1

        // Contains query in user_id
        if (aUserId.includes(queryLower) && !bUserId.includes(queryLower)) return -1
        if (bUserId.includes(queryLower) && !aUserId.includes(queryLower)) return 1

        // Contains query in name
        if (aName.includes(queryLower) && !bName.includes(queryLower)) return -1
        if (bName.includes(queryLower) && !aName.includes(queryLower)) return 1

        // Otherwise, alphabetical
        return aUserId.localeCompare(bUserId)
      })
    }

    // Apply limit after sorting
    const users = allUsers.slice(0, limit)

    console.log('[API /users/search] Returning', users.length, 'users:', users.map(u => u.user_id))

    return NextResponse.json(users)
  } catch (error) {
    console.error('[API /users/search] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

