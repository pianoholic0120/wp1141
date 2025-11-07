'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { getPusherClient } from '@/lib/pusher-client'

export default function TestPusherPage() {
  const { data: session } = useSession()
  const [logs, setLogs] = useState<string[]>([])
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [receivedEvents, setReceivedEvents] = useState<any[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(message)
  }

  useEffect(() => {
    if (!session?.user?.id) {
      addLog('❌ No session or user ID')
      return
    }

    addLog(`✅ Session found: User ID = ${session.user.id}`)

    const pusherClient = getPusherClient()
    
    if (!pusherClient) {
      addLog('❌ Pusher client not available')
      return
    }

    addLog('✅ Pusher client initialized')
    addLog(`Connection state: ${pusherClient.connection.state}`)

    const channelName = `user-${session.user.id}`
    addLog(`📡 Subscribing to channel: ${channelName}`)
    
    const channel = pusherClient.subscribe(channelName)

    channel.bind('pusher:subscription_succeeded', () => {
      addLog(`✅ Successfully subscribed to: ${channelName}`)
      setIsSubscribed(true)
    })

    channel.bind('pusher:subscription_error', (status: any) => {
      addLog(`❌ Subscription error: ${JSON.stringify(status)}`)
    })

    channel.bind('new-notification', (data: any) => {
      addLog(`✅✅✅ RECEIVED new-notification event!`)
      addLog(`Event data: ${JSON.stringify(data)}`)
      setReceivedEvents(prev => [...prev, { type: 'new-notification', data, time: new Date().toLocaleTimeString() }])
    })

    pusherClient.connection.bind('state_change', (states: any) => {
      addLog(`Pusher connection state: ${states.previous} → ${states.current}`)
    })

    return () => {
      channel.unbind_all()
      pusherClient.unsubscribe(channelName)
      addLog('Cleaned up subscriptions')
    }
  }, [session?.user?.id])

  const testTrigger = async () => {
    if (!session?.user?.id) {
      addLog('❌ Cannot test: No session')
      return
    }

    addLog('🧪 Triggering test notification...')
    try {
      const res = await fetch('/api/test-pusher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id })
      })
      
      if (res.ok) {
        addLog('✅ Test trigger sent successfully')
      } else {
        addLog('❌ Test trigger failed')
      }
    } catch (error) {
      addLog(`❌ Error: ${error}`)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Pusher Connection Test</h1>
        
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-gray-900 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Status</h2>
            <div className="space-y-2">
              <div>Session: {session?.user?.id ? '✅ Connected' : '❌ Not logged in'}</div>
              <div>User ID: {session?.user?.id || 'N/A'}</div>
              <div>Pusher Subscribed: {isSubscribed ? '✅ Yes' : '❌ No'}</div>
              <div>Events Received: {receivedEvents.length}</div>
            </div>
          </div>

          {/* Test Button */}
          <div className="bg-gray-900 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Test</h2>
            <button
              onClick={testTrigger}
              disabled={!session?.user?.id}
              className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-bold py-2 px-4 rounded"
            >
              Trigger Test Notification
            </button>
            <p className="text-sm text-gray-400 mt-2">
              Click this button to manually trigger a test Pusher event
            </p>
          </div>

          {/* Events Received */}
          {receivedEvents.length > 0 && (
            <div className="bg-gray-900 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Received Events ({receivedEvents.length})</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {receivedEvents.map((event, idx) => (
                  <div key={idx} className="bg-gray-800 p-3 rounded text-sm">
                    <div className="text-green-400">[{event.time}] {event.type}</div>
                    <pre className="text-gray-300 mt-1 overflow-x-auto">
                      {JSON.stringify(event.data, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Logs */}
          <div className="bg-gray-900 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Debug Logs</h2>
            <div className="bg-black p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
              {logs.map((log, idx) => (
                <div key={idx} className={`${
                  log.includes('❌') ? 'text-red-400' : 
                  log.includes('✅') ? 'text-green-400' : 
                  'text-gray-400'
                }`}>
                  {log}
                </div>
              ))}
            </div>
          </div>

          {/* Environment Variables */}
          <div className="bg-gray-900 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
            <div className="space-y-1 text-sm">
              <div>NEXT_PUBLIC_PUSHER_KEY: {process.env.NEXT_PUBLIC_PUSHER_KEY || '❌ NOT SET'}</div>
              <div>NEXT_PUBLIC_PUSHER_CLUSTER: {process.env.NEXT_PUBLIC_PUSHER_CLUSTER || '❌ NOT SET'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

