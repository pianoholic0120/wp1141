'use client'

import Image from 'next/image'

interface AvatarProps {
  src?: string | null
  alt: string
  size?: number
  className?: string
}

export default function Avatar({ src, alt, size = 48, className = '' }: AvatarProps) {
  if (!src) {
    return (
      <div
        className={`rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold ${className}`}
        style={{ width: size, height: size }}
      >
        {alt.charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <div className={`rounded-full overflow-hidden ${className}`} style={{ width: size, height: size }}>
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="object-cover"
        unoptimized
      />
    </div>
  )
}

