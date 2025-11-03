'use client'

import { parseText } from '@/lib/utils/textParser'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ParsedTextProps {
  text: string
  className?: string
}

export default function ParsedText({ text, className = '' }: ParsedTextProps) {
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
                router.push(`/profile/${part.mention}`)
              }}
              className="text-primary hover:underline cursor-pointer"
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

