import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ForbiddenError, ValidationError, handleApiError } from '@/lib/errors'
import { parseCSV, validateCSVRows, importLeads } from '@/lib/csv-processor'
import { prisma } from '@/lib/prisma'
import { config } from '@/lib/config'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      throw new ForbiddenError('Admin access required')
    }

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      throw new ValidationError('No file provided')
    }

    if (file.size > config.upload.maxFileSize) {
      throw new ValidationError(`File size exceeds ${config.upload.maxFileSize / 1024 / 1024}MB limit`)
    }

    // Get default status (first non-final status)
    const defaultStatus = await prisma.status.findFirst({
      where: { 
        isFinal: false,
        name: 'Need to Contact'
      },
      orderBy: { name: 'asc' },
    })

    if (!defaultStatus) {
      throw new ValidationError('No default status found. Please create a status first.')
    }

    // Parse CSV
    const rows = await parseCSV(file)
    
    // Validate rows
    const validation = validateCSVRows(rows)

    // Check for preview mode
    const preview = formData.get('preview') === 'true'
    if (preview) {
      return Response.json({
        valid: validation.valid.length,
        errorCount: validation.errors.length,
        preview: validation.valid.slice(0, 10), // Return first 10 valid rows
        validationErrors: validation.errors.slice(0, 10), // Return first 10 errors
      })
    }

    // Import leads
    const skipDuplicates = formData.get('skipDuplicates') !== 'false'
    const result = await importLeads(validation.valid, defaultStatus.id, skipDuplicates)

    return Response.json({
      success: true,
      ...result,
      validationErrors: validation.errors,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

