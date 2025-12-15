import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Clear existing data (optional, for development)
  if (process.env.CLEAR_DB === 'true') {
    console.log('Clearing existing data...')
    await prisma.activityLog.deleteMany()
    await prisma.callback.deleteMany()
    await prisma.note.deleteMany()
    await prisma.lead.deleteMany()
    await prisma.status.deleteMany()
    await prisma.user.deleteMany()
  }

  // Create statuses
  const statuses = [
    { name: 'Attempted Contact', isFinal: false },
    { name: 'Busy', isFinal: false },
    { name: 'Scheduled Callback', isFinal: false },
    { name: 'Junk Lead', isFinal: true },
    { name: 'Converted', isFinal: true },
    { name: 'Not Converted', isFinal: true },
  ]

  console.log('Creating statuses...')
  for (const status of statuses) {
    await prisma.status.upsert({
      where: { name: status.name },
      update: {},
      create: status,
    })
  }

  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
  const passwordHash = await bcrypt.hash(adminPassword, 10)

  console.log('Creating admin user...')
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      name: 'Admin User',
      role: 'ADMIN',
    },
  })

  // Create sample agent (optional)
  if (process.env.CREATE_SAMPLE_AGENT === 'true') {
    const agentPassword = await bcrypt.hash('agent123', 10)
    await prisma.user.upsert({
      where: { email: 'agent@example.com' },
      update: {},
      create: {
        email: 'agent@example.com',
        passwordHash: agentPassword,
        name: 'Sample Agent',
        role: 'AGENT',
      },
    })
    console.log('Created sample agent: agent@example.com / agent123')
  }

  console.log('Database seed completed!')
  console.log(`Admin credentials: ${adminEmail} / ${adminPassword}`)
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

