import { formatDistanceToNow, format } from 'date-fns'

export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)
  
  // Less than 1 minute
  if (diffInSeconds < 60) {
    return `${diffInSeconds}秒前`
  }
  
  // Less than 1 hour
  if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}分鐘前`
  }
  
  // Less than 24 hours
  if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}小時前`
  }
  
  // Less than 30 days
  if (diffInSeconds < 2592000) {
    return `${Math.floor(diffInSeconds / 86400)}天前`
  }
  
  // Current year - show month and day
  if (dateObj.getFullYear() === now.getFullYear()) {
    return format(dateObj, 'M月d日')
  }
  
  // Different year - show full date
  return format(dateObj, 'yyyy年M月d日')
}

