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

## Troubleshooting

### Database Connection Issues

If you're seeing "Can't reach database server" errors:

#### For Prisma Accelerate (db.prisma.io)

1. **Check if database is paused**: Free tier Prisma Accelerate databases pause after inactivity
   - Visit your [Prisma Dashboard](https://console.prisma.io/)
   - Check if your database is paused and resume it if needed

2. **Verify connection string**: 
   - Ensure your `DATABASE_URL` in `.env` matches the connection string from Prisma Dashboard
   - Connection string format: `postgres://user:password@db.prisma.io:5432/database?sslmode=require`

3. **Check IP whitelist**: If IP restrictions are enabled, ensure your IP is whitelisted

4. **Test connection**:
   ```bash
   psql "your-database-url-here"
   ```

#### For Local PostgreSQL

1. **Verify PostgreSQL is running**:
   ```bash
   # macOS
   brew services list | grep postgresql
   
   # Linux
   sudo systemctl status postgresql
   ```

2. **Check connection string format**:
   ```
   postgresql://username:password@localhost:5432/database_name
   ```

3. **Test connection**:
   ```bash
   psql -h localhost -U your_username -d your_database
   ```

4. **Common issues**:
   - Wrong port (default is 5432)
   - Firewall blocking port 5432
   - Incorrect credentials
   - Database doesn't exist (create it first)
   - Missing SSL parameters (add `?sslmode=require` if needed)

#### General Troubleshooting Steps

1. **Verify `.env` file exists** and contains `DATABASE_URL`
2. **Restart the development server** after changing `.env`
3. **Check network connectivity** (VPN, firewall, etc.)
4. **Review error messages** - they often contain specific connection details
5. **Check Prisma logs** - enable query logging in development to see connection attempts

#### Error Handling

The app includes automatic error handling for database connection issues:
- Connection errors are caught and displayed with helpful messages
- The app won't crash - it shows a "Database Unavailable" component
- Error messages include specific troubleshooting steps

If you continue to have issues:
1. Check the browser console for detailed error messages
2. Review server logs for connection attempts
3. Verify your database server is accessible from your network
4. Consider using a different database provider if Prisma Accelerate continues to have issues

## License

MIT
