import { NextRequest, NextResponse } from 'next/server'
import { pusher } from '@/lib/pusher'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    console.log('[Test Pusher] Triggering test event for user:', userId)
    
    await pusher.trigger(`user-${userId}`, 'new-notification', {
      notification: {
        id: 'test-' + Date.now(),
        type: 'test',
        actor: {
          id: 'test',
          user_id: 'test',
          name: 'Test User'
        },
        createdAt: new Date().toISOString()
      }
    })
    
    console.log('[Test Pusher] ✅ Test event triggered successfully')
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Test Pusher] Error:', error)
    return NextResponse.json({ error: 'Failed to trigger event' }, { status: 500 })
  }
}

