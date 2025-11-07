'use client'

import PusherClient from 'pusher-js'

let pusherClientInstance: PusherClient | null = null
let subscribedChannels = new Set<string>()

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
      enabledTransports: ['ws', 'wss'], // Force websocket
    })
    
    // Listen for connection state changes
    pusherClientInstance.connection.bind('connected', () => {
      console.log('[Pusher Client] ✅ Connected successfully at', new Date().toLocaleTimeString())
    })
    
    pusherClientInstance.connection.bind('disconnected', () => {
      console.warn('[Pusher Client] ⚠️ Disconnected at', new Date().toLocaleTimeString())
    })
    
    pusherClientInstance.connection.bind('error', (err: any) => {
      console.error('[Pusher Client] ❌ Connection error:', err)
    })
    
    pusherClientInstance.connection.bind('state_change', (states: any) => {
      console.log('[Pusher Client] State changed:', states.previous, '→', states.current, 'at', new Date().toLocaleTimeString())
    })
    
    pusherClientInstance.connection.bind('unavailable', () => {
      console.error('[Pusher Client] ❌ Connection unavailable - trying to reconnect...')
    })
    
    pusherClientInstance.connection.bind('failed', () => {
      console.error('[Pusher Client] ❌ Connection failed')
    })
  }

  return pusherClientInstance
}

// Helper function to track channel subscriptions
export const subscribeToChannel = (channelName: string) => {
  const client = getPusherClient()
  if (!client) return null
  
  // Check if already subscribed
  if (subscribedChannels.has(channelName)) {
    console.log('[Pusher Client] Already subscribed to:', channelName)
    return client.channel(channelName)
  }
  
  console.log('[Pusher Client] New subscription to:', channelName)
  subscribedChannels.add(channelName)
  return client.subscribe(channelName)
}

export const unsubscribeFromChannel = (channelName: string) => {
  const client = getPusherClient()
  if (!client) return
  
  if (subscribedChannels.has(channelName)) {
    console.log('[Pusher Client] Unsubscribing from:', channelName)
    client.unsubscribe(channelName)
    subscribedChannels.delete(channelName)
  }
}

export const pusherClient = getPusherClient()!

