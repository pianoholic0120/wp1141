'use client'

import PusherClient from 'pusher-js'

let pusherClientInstance: PusherClient | null = null

export const getPusherClient = () => {
  if (typeof window === 'undefined') {
    return null
  }

  if (!pusherClientInstance) {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    
    console.log('[Pusher Client] Initializing with:', { key, cluster })
    
    if (!key || !cluster) {
      console.error('[Pusher Client] Missing environment variables:', { key, cluster })
      return null
    }
    
    pusherClientInstance = new PusherClient(key, {
      cluster: cluster,
    })
    
    // Listen for connection state changes
    pusherClientInstance.connection.bind('connected', () => {
      console.log('[Pusher Client] Connected successfully')
    })
    
    pusherClientInstance.connection.bind('disconnected', () => {
      console.log('[Pusher Client] Disconnected')
    })
    
    pusherClientInstance.connection.bind('error', (err: any) => {
      console.error('[Pusher Client] Connection error:', err)
    })
    
    pusherClientInstance.connection.bind('state_change', (states: any) => {
      console.log('[Pusher Client] State changed:', states.current)
    })
  }

  return pusherClientInstance
}

export const pusherClient = getPusherClient()!

