import csv from 'csv-parser'
import { Readable } from 'stream'
import { prisma } from './prisma'
import { csvRowSchema } from './validators'
import { ValidationError } from './errors'
import { sanitizeInput, validateEmail, validatePhone } from './utils'

export interface CSVRow {
  Name: string
  Phone: string
  Email: string
  'Source Platform': string
  'Campaign Name': string
}

export interface ValidationResult {
  valid: CSVRow[]
  errors: Array<{ row: number; data: CSVRow; errors: string[] }>
}

export async function parseCSV(file: File | Buffer): Promise<CSVRow[]> {
  let buffer: Buffer
  if (file instanceof File) {
    const arrayBuffer = await file.arrayBuffer()
    buffer = Buffer.from(arrayBuffer)
  } else {
    buffer = file
  }
  
  const stream = Readable.from(buffer)
  const rows: CSVRow[] = []
  
  return new Promise((resolve, reject) => {
    stream
      .pipe(csv())
      .on('data', (row: CSVRow) => {
        rows.push(row)
      })
      .on('end', () => {
        resolve(rows)
      })
      .on('error', (error) => {
        reject(error)
      })
  })
}

export function validateCSVRows(rows: CSVRow[]): ValidationResult {
  const valid: CSVRow[] = []
  const errors: Array<{ row: number; data: CSVRow; errors: string[] }> = []

  rows.forEach((row, index) => {
    const rowErrors: string[] = []
    
    // Sanitize inputs
    const sanitizedRow: CSVRow = {
      Name: sanitizeInput(row.Name || ''),
      Phone: sanitizeInput(row.Phone || ''),
      Email: sanitizeInput(row.Email || ''),
      'Source Platform': sanitizeInput(row['Source Platform'] || ''),
      'Campaign Name': sanitizeInput(row['Campaign Name'] || ''),
    }

    // Validate required fields
    if (!sanitizedRow.Name) rowErrors.push('Name is required')
    if (!sanitizedRow.Phone) rowErrors.push('Phone is required')

    // Validate email format (only if provided)
    if (sanitizedRow.Email && sanitizedRow.Email.trim() !== '' && !validateEmail(sanitizedRow.Email)) {
      rowErrors.push('Invalid email format')
    }

    // Validate phone format
    if (sanitizedRow.Phone && !validatePhone(sanitizedRow.Phone)) {
      rowErrors.push('Invalid phone format')
    }

    // Try Zod validation
    try {
      csvRowSchema.parse(sanitizedRow)
      if (rowErrors.length === 0) {
        valid.push(sanitizedRow)
      } else {
        errors.push({ row: index + 1, data: sanitizedRow, errors: rowErrors })
      }
    } catch (error) {
      if (error instanceof Error) {
        rowErrors.push(error.message)
      }
      errors.push({ row: index + 1, data: sanitizedRow, errors: rowErrors })
    }
  })

  return { valid, errors }
}

export async function checkDuplicates(
  rows: CSVRow[],
  skipDuplicates: boolean = true
): Promise<{ unique: CSVRow[]; duplicates: CSVRow[] }> {
  const seen = new Set<string>()
  const unique: CSVRow[] = []
  const duplicates: CSVRow[] = []

  for (const row of rows) {
    const emailKey = row.Email && row.Email.trim() !== '' ? row.Email.toLowerCase() : ''
    const key = `${emailKey}_${row.Phone.replace(/\D/g, '')}`
    
    // Check database for existing leads
    const whereClause: Array<{ phone: string } | { email: string }> = [{ phone: row.Phone }]
    if (emailKey) {
      whereClause.push({ email: emailKey })
    }
    
    const existing = await prisma.lead.findFirst({
      where: {
        OR: whereClause,
      },
    })

    if (existing || seen.has(key)) {
      if (!skipDuplicates) {
        // Update existing lead
        if (existing) {
          await prisma.lead.update({
            where: { id: existing.id },
            data: {
              name: row.Name,
              phone: row.Phone,
              email: emailKey || '',
              sourcePlatform: row['Source Platform'],
              campaignName: row['Campaign Name'],
            },
          })
        }
      }
      duplicates.push(row)
    } else {
      seen.add(key)
      unique.push(row)
    }
  }

  return { unique, duplicates }
}

export async function importLeads(
  rows: CSVRow[],
  defaultStatusId: string,
  skipDuplicates: boolean = true
): Promise<{ imported: number; skipped: number; errors: number }> {
  const validation = validateCSVRows(rows)
  
  if (validation.valid.length === 0) {
    throw new ValidationError('No valid rows to import', validation.errors)
  }

  const duplicateCheck = await checkDuplicates(validation.valid, skipDuplicates)
  const rowsToImport = duplicateCheck.unique

  if (rowsToImport.length === 0) {
    return {
      imported: 0,
      skipped: validation.errors.length + duplicateCheck.duplicates.length,
      errors: validation.errors.length,
    }
  }

  // Batch insert using transaction
  const result = await prisma.$transaction(async (tx) => {
    const leads = await tx.lead.createMany({
      data: rowsToImport.map((row) => ({
        name: row.Name,
        phone: row.Phone,
        email: row.Email && row.Email.trim() !== '' ? row.Email.toLowerCase() : '',
        sourcePlatform: row['Source Platform'],
        campaignName: row['Campaign Name'],
        currentStatusId: defaultStatusId,
      })),
      skipDuplicates: true,
    })

    return leads.count
  })

  return {
    imported: result,
    skipped: validation.errors.length + duplicateCheck.duplicates.length,
    errors: validation.errors.length,
  }
}

