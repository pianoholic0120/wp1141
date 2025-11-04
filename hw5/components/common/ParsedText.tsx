'use client'

import { parseText } from '@/lib/utils/textParser'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ParsedTextProps {
  text: string
  className?: string
  onMentionClick?: (userId: string) => void
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
                // Navigate to hashtag search page (you can implement this later)
                // For now, just show the hashtag
                router.push(`/hashtag/${encodeURIComponent(part.hashtag!)}`)
              }}
              className="text-primary hover:underline cursor-pointer"
            >
              {part.content}
            </span>
          )
        } else if (part.type === 'mention') {
          return (
            <span
              key={index}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (part.mention) {
                  if (onMentionClick) {
                    // Show in preview instead of navigating
                    onMentionClick(part.mention)
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
                      onMentionClick(part.mention)
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

