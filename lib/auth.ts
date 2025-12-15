import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

// Validate NEXTAUTH_SECRET
if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error(
    'NEXTAUTH_SECRET is required in production. Generate one with: openssl rand -base64 32'
  )
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        try {
          // Use a timeout wrapper for the database query
          const user = await Promise.race([
            prisma.user.findUnique({
              where: { email: credentials.email },
            }),
            new Promise<null>((_, reject) => {
              setTimeout(() => {
                reject(new Error('Database query timeout'))
              }, 25000) // 25 second timeout
            }),
          ]) as Awaited<ReturnType<typeof prisma.user.findUnique>>

          if (!user) {
            throw new Error('Invalid email or password')
          }

          const isValid = await bcrypt.compare(credentials.password, user.passwordHash)

          if (!isValid) {
            throw new Error('Invalid email or password')
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error: unknown) {
          // Log database connection errors for debugging
          const errorMessage = error instanceof Error ? error.message : String(error)
          const errorCode = (error as { code?: string })?.code

          if (
            errorCode === 'ETIMEDOUT' ||
            errorCode === 'ECONNREFUSED' ||
            errorMessage.includes('timeout') ||
            errorMessage.includes('Connection terminated')
          ) {
            console.error('Database connection error:', error)
            throw new Error('Database connection error. Please check your database connection and try again.')
          }
          // Re-throw authentication errors as-is
          throw error
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as 'ADMIN' | 'AGENT'
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  secret:
    process.env.NEXTAUTH_SECRET ||
    (process.env.NODE_ENV === 'development'
      ? 'development-secret-key-change-in-production-min-32-chars'
      : undefined),
}

