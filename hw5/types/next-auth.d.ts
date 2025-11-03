import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      user_id: string | null
      email?: string | null
      name?: string | null
      image?: string | null
      avatar_url?: string | null
    }
  }

  interface User {
    user_id?: string | null
  }
}

