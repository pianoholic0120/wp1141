import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const drafts = await prisma.draft.findMany({
      where: {
        userId: session.user.id as string
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json(drafts)
  } catch (error) {
    console.error('Error fetching drafts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { content } = body

    const draft = await prisma.draft.create({
      data: {
        userId: session.user.id as string,
        content: content || ''
      }
    })

    return NextResponse.json(draft)
  } catch (error) {
    console.error('Error creating draft:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

