'use client'

import { parseText } from '@/lib/utils/textParser'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ParsedTextProps {
  text: string
  className?: string
  onMentionClick?: (userId: string, event: React.MouseEvent) => void
}

export default function ParsedText({ text, className = '', onMentionClick }: ParsedTextProps) {
  const router = useRouter()
  const parts = parseText(text)

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === 'url') {
          return (
            <a
              key={index}
              href={part.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {part.content}
            </a>
          )
        } else if (part.type === 'hashtag') {
          return (
            <span
              key={index}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation() // Prevent triggering post click
                router.push(`/hashtag/${encodeURIComponent(part.hashtag!)}`)
              }}
              className="text-blue-500 hover:text-blue-400 hover:underline cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  e.stopPropagation()
                  router.push(`/hashtag/${encodeURIComponent(part.hashtag!)}`)
                }
              }}
            >
              {part.content}
            </span>
          )
        } else if (part.type === 'mention') {
          return (
            <span
              key={index}
              data-mention
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (part.mention) {
                  if (onMentionClick) {
                    // Show in preview instead of navigating, pass event for position
                    onMentionClick(part.mention, e)
                  } else {
                    // Fallback to navigation if no handler provided
                    router.push(`/profile/${encodeURIComponent(part.mention)}`)
                  }
                }
              }}
              className="text-primary hover:underline cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  if (part.mention) {
                    if (onMentionClick) {
                      // For keyboard navigation, use a synthetic event
                      const syntheticEvent = {
                        clientX: 0,
                        clientY: 0,
                        currentTarget: e.currentTarget
                      } as React.MouseEvent
                      onMentionClick(part.mention, syntheticEvent)
                    } else {
                      router.push(`/profile/${encodeURIComponent(part.mention)}`)
                    }
                  }
                }
              }}
            >
              {part.content}
            </span>
          )
        } else {
          return <span key={index}>{part.content}</span>
        }
      })}
    </span>
  )
}

