import { prisma } from './prisma'

/**
 * Check database connection health
 * Returns true if connection is healthy, false otherwise
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}

/**
 * Test database connection with timeout
 */
export async function testConnection(timeoutMs: number = 5000): Promise<boolean> {
  return Promise.race([
    checkDatabaseHealth(),
    new Promise<boolean>((resolve) => {
      setTimeout(() => {
        console.error('Database connection test timed out')
        resolve(false)
      }, timeoutMs)
    }),
  ])
}

