import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const registerSchema = z.object({
  user_id: z.string().min(3).max(15).regex(/^[a-zA-Z0-9_]+$/, 'User ID can only contain letters, numbers, and underscores')
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { user_id } = registerSchema.parse(body)

    // Check if user_id is already taken
    const existingUser = await prisma.user.findUnique({
      where: { user_id }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User ID already taken' }, { status: 400 })
    }

    // Update current user with user_id
    // Use user.id instead of email (works for Facebook users without email)
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { user_id }
    })

    // Return success - client will trigger session update
    return NextResponse.json({ 
      user_id: user.user_id,
      success: true 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

