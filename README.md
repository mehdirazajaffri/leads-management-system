# Leads Management System

A comprehensive leads management system built with Next.js 14, Prisma, PostgreSQL, and NextAuth.js.

## Features

### Admin Features
- **Lead Management**: Upload CSV files, view, filter, and manage leads
- **Bulk Operations**: Assign leads to agents, update statuses, archive leads
- **Agent Management**: Create, edit, and manage agent accounts
- **Analytics Dashboard**: View conversion rates, source platform performance, and campaign metrics
- **System Settings**: Manage lead statuses and system configuration

### Agent Features
- **Assigned Leads**: View and manage assigned leads
- **Lead Details**: Update lead status, add notes, view activity history
- **Callback Management**: Schedule and manage callbacks for leads

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5
- **Styling**: Tailwind CSS
- **Validation**: Zod

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd leads-management-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and update the following:
- `DATABASE_URL`: Your PostgreSQL connection string
- `NEXTAUTH_SECRET`: **REQUIRED** - Generate with `openssl rand -base64 32`
  ```bash
  openssl rand -base64 32
  ```
  Copy the output and add it to your `.env` file as `NEXTAUTH_SECRET=your-generated-secret`
- `NEXTAUTH_URL`: Your application URL (e.g., `http://localhost:3000`)
- `ADMIN_EMAIL` and `ADMIN_PASSWORD`: Admin credentials for seeding (optional, defaults provided)

4. Set up the database:
```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Seed the database
npm run db:seed
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Default Credentials

After seeding, you can log in with:
- **Email**: `admin@example.com` (or the value in `ADMIN_EMAIL`)
- **Password**: `admin123` (or the value in `ADMIN_PASSWORD`)

## Project Structure

```
leads-management-system/
├── app/
│   ├── (admin)/          # Admin routes
│   ├── (agent)/          # Agent routes
│   ├── api/              # API routes
│   ├── login/            # Login page
│   └── layout.tsx        # Root layout
├── components/
│   ├── layouts/          # Layout components
│   └── features/         # Feature components
├── lib/
│   ├── prisma.ts         # Prisma client
│   ├── auth.ts           # NextAuth configuration
│   ├── validators.ts     # Zod schemas
│   ├── errors.ts         # Error handling
│   ├── csv-processor.ts  # CSV processing
│   ├── analytics.ts      # Analytics functions
│   └── activity-logger.ts # Activity logging
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts          # Database seed script
└── middleware.ts         # Route protection
```

## Database Schema

The system uses the following main models:
- **User**: Admin and Agent accounts
- **Lead**: Lead information
- **Status**: Lead statuses (Attempted Contact, Converted, etc.)
- **ActivityLog**: Activity history for leads
- **Callback**: Scheduled callbacks
- **Note**: Lead notes (optional)

## API Routes

### Admin Routes
- `POST /api/admin/leads/upload` - Upload CSV file
- `POST /api/admin/leads/assign` - Bulk assign leads
- `PATCH /api/admin/leads/bulk` - Bulk update leads
- `DELETE /api/admin/leads/bulk` - Archive leads
- `GET /api/admin/leads/export` - Export leads to CSV
- `GET /api/admin/agents` - List agents
- `POST /api/admin/agents` - Create agent
- `PATCH /api/admin/agents` - Update agent
- `DELETE /api/admin/agents` - Delete agent
- `GET /api/admin/settings` - Get settings
- `POST /api/admin/settings` - Create status
- `PATCH /api/admin/settings` - Update status
- `DELETE /api/admin/settings` - Delete status

### Agent Routes
- `GET /api/agent/leads/[id]` - Get lead details
- `PATCH /api/agent/leads/[id]` - Update lead status
- `GET /api/agent/callbacks` - Get callbacks
- `POST /api/agent/callbacks` - Create callback
- `PATCH /api/agent/callbacks` - Update callback
- `DELETE /api/agent/callbacks` - Delete callback

## CSV Upload Format

The CSV file should have the following columns:
- `Name` (required)
- `Phone` (required)
- `Email` (required, valid email format)
- `Source Platform` (required)
- `Campaign Name` (required)

## Development

### Database Migrations

```bash
# Create a new migration
npm run db:migrate

# Apply migrations
npm run db:push
```

### Seeding

```bash
# Seed the database
npm run db:seed

# Clear and reseed (development only)
CLEAR_DB=true npm run db:seed
```

## Security Considerations

- All API routes are protected with authentication
- Role-based access control (Admin vs Agent)
- Password hashing with bcryptjs
- Input validation with Zod
- SQL injection prevention via Prisma
- XSS prevention with input sanitization

## Performance Optimizations

- Database indexes on frequently queried fields
- Pagination for large datasets
- Efficient Prisma queries
- Server-side rendering with React Server Components

## License

MIT
