'use client'

interface AvatarProps {
  src?: string | null
  alt: string
  size?: number
  className?: string
  style?: React.CSSProperties
}

export default function Avatar({ src, alt, size = 48, className = '', style }: AvatarProps) {
  if (!src) {
    return (
      <div
        className={`rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold ${className}`}
        style={{ width: size, height: size, ...style }}
      >
        {alt.charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <div className={`rounded-full overflow-hidden ${className}`} style={{ width: size, height: size, ...style }}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        style={{ width: size, height: size }}
        onError={(e) => {
          // Replace with fallback on error
          e.currentTarget.style.display = 'none'
          const parent = e.currentTarget.parentElement
          if (parent) {
            parent.innerHTML = `<div class="rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold" style="width: ${size}px; height: ${size}px;">${alt.charAt(0).toUpperCase()}</div>`
          }
        }}
      />
    </div>
  )
}

