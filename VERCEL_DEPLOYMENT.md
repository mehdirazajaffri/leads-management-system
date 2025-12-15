# Vercel Deployment Guide

This guide will help you deploy the Leads Management System to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. A PostgreSQL database (recommended: Vercel Postgres, Neon, or Supabase)
3. Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Prepare Your Repository

Make sure your code is pushed to a Git repository:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

## Step 2: Deploy via Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com)** and sign in
2. **Click "Add New Project"**
3. **Import your Git repository**
4. **Configure the project:**
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

## Step 3: Set Environment Variables

In the Vercel project settings, add these environment variables:

### Required Environment Variables

```
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-secret-key-here-min-32-characters
NODE_ENV=production
```

### Optional Environment Variables

```
CREATE_SAMPLE_AGENT=false
```

### How to Get NEXTAUTH_SECRET

Generate a secure secret:

```bash
openssl rand -base64 32
```

Or use an online generator: https://generate-secret.vercel.app/32

## Step 4: Database Setup

### Option A: Vercel Postgres (Recommended)

1. In your Vercel project, go to **Storage** tab
2. Click **Create Database** → **Postgres**
3. Copy the `POSTGRES_URL` and use it as your `DATABASE_URL`
4. Run migrations:

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Link your project
vercel link

# Run Prisma migrations
npx prisma migrate deploy
```

### Option B: External Database (Neon, Supabase, etc.)

1. Create a PostgreSQL database on your provider
2. Get the connection string
3. Add it as `DATABASE_URL` in Vercel environment variables
4. Make sure to include `?sslmode=require` for SSL connections
5. Run migrations:

```bash
npx prisma migrate deploy
```

## Step 5: Run Database Migrations

After setting up your database, run migrations:

```bash
# Using Vercel CLI
vercel env pull .env.local
npx prisma migrate deploy

# Or using your database connection string directly
DATABASE_URL="your-connection-string" npx prisma migrate deploy
```

## Step 6: Seed the Database (Optional)

To create initial admin user and statuses:

```bash
# Using Vercel CLI
vercel env pull .env.local
npm run db:seed

# Or directly
DATABASE_URL="your-connection-string" npm run db:seed
```

**Note:** The seed script creates:
- Default statuses (New, Contacted, Qualified, Converted, Not Converted)
- Admin user (email: `admin@example.com`, password: `admin123` - **CHANGE THIS!**)

## Step 7: Deploy

1. **Push your code** to trigger automatic deployment, or
2. **Click "Deploy"** in the Vercel dashboard

Vercel will automatically:
- Install dependencies
- Run `npm run build`
- Deploy your application

## Step 8: Verify Deployment

1. Visit your deployment URL (e.g., `https://your-app.vercel.app`)
2. Test the login with your admin credentials
3. Check that the database connection is working

## Troubleshooting

### Build Errors

If you encounter build errors:

1. **Check build logs** in Vercel dashboard
2. **Verify environment variables** are set correctly
3. **Ensure Prisma Client is generated:**
   ```bash
   npx prisma generate
   ```

### Database Connection Issues

1. **Verify DATABASE_URL** is correct and includes SSL parameters
2. **Check database is accessible** from Vercel's IP ranges
3. **Verify SSL mode** is set to `require` in connection string

### Authentication Issues

1. **Verify NEXTAUTH_URL** matches your deployment URL
2. **Check NEXTAUTH_SECRET** is set and at least 32 characters
3. **Clear browser cookies** and try again

## Post-Deployment Checklist

- [ ] Database migrations completed
- [ ] Environment variables set
- [ ] Admin user created (via seed or manually)
- [ ] Login functionality working
- [ ] Database connection stable
- [ ] All pages loading correctly
- [ ] API routes functioning

## Continuous Deployment

Vercel automatically deploys when you push to your main branch. For other branches:

1. Push to a branch
2. Vercel creates a preview deployment
3. Test the preview
4. Merge to main for production deployment

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)

