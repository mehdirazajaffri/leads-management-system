import { prisma } from './prisma'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'

/**
 * Check if error is a database connection error
 */
export function isConnectionError(error: unknown): boolean {
  if (error instanceof PrismaClientKnownRequestError) {
    // P1001: Can't reach database server
    // P1002: Connection timeout
    // P1003: Database does not exist
    // P1017: Server has closed the connection
    return ['P1001', 'P1002', 'P1003', 'P1017'].includes(error.code)
  }
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return (
      message.includes("can't reach database") ||
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('enotfound')
    )
  }
  
  return false
}

/**
 * Execute a Prisma query with connection error handling
 */
export async function withDbErrorHandling<T>(
  query: () => Promise<T>,
  fallback?: T
): Promise<T> {
  try {
    return await query()
  } catch (error) {
    if (isConnectionError(error)) {
      console.error('Database connection error:', error)
      if (fallback !== undefined) {
        return fallback
      }
      throw new Error('Database connection failed. Please check your DATABASE_URL and ensure the database is running.')
    }
    throw error
  }
}

/**
 * Test database connection with retry logic
 */
export async function testDatabaseConnection(retries = 3, delay = 1000): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      await Promise.race([
        prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 5000)
        )
      ])
      return true
    } catch (error) {
      if (i < retries - 1) {
        console.log(`Connection attempt ${i + 1} failed, retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        console.error('All connection attempts failed:', error)
        return false
      }
    }
  }
  return false
}

