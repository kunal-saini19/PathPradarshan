# Vercel Deployment Guide

## Prerequisites
- Vercel account (https://vercel.com)
- PostgreSQL database (e.g., from Neon, Supabase, Railway, or AWS RDS)
- GitHub repository with this project

## Step 1: Setup PostgreSQL Database

Choose one of:

### Option A: Neon (Recommended)
1. Go to https://neon.tech
2. Create account and new project
3. Copy the connection string (DATABASE_URL)
4. Format: `postgresql://user:password@host/dbname?sslmode=require`

### Option B: Supabase
1. Go to https://supabase.com
2. Create new project
3. Go to Settings → Database → Connection string
4. Copy PostgreSQL connection string

### Option C: Railway
1. Go to https://railway.app
2. Create new project and add PostgreSQL database
3. Copy DATABASE_URL from variables

## Step 2: Prepare Environment Variables

You'll need these secrets for Vercel:

```
# Database (REQUIRED)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Email (if notifications enabled)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_FROM=App Name <your-email@gmail.com>
SMTP_PASS=your-app-password

# Razorpay (for payments)
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# AI APIs
ANTHROPIC_API_KEY=your_anthropic_key
GROQ_API_KEY=your_groq_key

# Blockchain (optional, for testnet)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your-key
POLYGON_AMOY_RPC_URL=https://polygon-amoy.infura.io/v3/your-key
ADMIN_PRIVATE_KEY=0xyour_private_key
NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS=0xyour_contract
NEXT_PUBLIC_CHAIN_RPC_URL=https://sepolia.infura.io/v3/your-key
```

## Step 3: Deploy to Vercel

### Via Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure project name
5. In Environment Variables section, add all the variables from Step 2
6. **Important**: Select the PostgreSQL DATABASE_URL as a secret (recommended)
7. Click "Deploy"

### After Initial Deployment
1. Vercel will build and deploy your app
2. First deployment runs: `npm run vercel-build`
3. Prisma client generates and DATABASE_URL is applied
4. Schema is synced with `prisma db push` during build

## Step 4: Verify Deployment

1. Check deployment URL in Vercel dashboard
2. Test critical endpoints:
   - `https://your-domain.vercel.app/` (homepage)
   - `https://your-domain.vercel.app/api/users` (API endpoint)
3. Check function logs in Vercel dashboard for errors

## Step 5: Database Migration

First deployment will auto-generate schema. To sync your existing schema:

```bash
# Run locally first to verify
npx prisma db push
```

## Environment Variable Reference

| Variable | Purpose | Required | Example |
|----------|---------|----------|---------|
| DATABASE_URL | PostgreSQL connection | Yes | postgresql://... |
| NEXT_PUBLIC_API_BASE_URL | API endpoint | No | /api |
| NEXT_PUBLIC_APP_URL | App URL | No | Auto-set from VERCEL_URL |
| SMTP_* | Email notifications | No | Gmail SMTP config |
| RAZORPAY_* | Payment processing | No | Razorpay sandbox keys |
| ANTHROPIC_API_KEY | Claude AI access | No | sk-ant-... |
| GROQ_API_KEY | Groq LLM access | No | gsk_... |
| SEPOLIA_RPC_URL | Ethereum testnet | No | Infura endpoint |
| ADMIN_PRIVATE_KEY | Contract deployment | No | 0x... |

## Important Notes

⚠️ **Security**:
- Never commit `.env.local` or any secrets to GitHub
- Use Vercel's secure environment variables
- Mark sensitive variables as secret in Vercel dashboard
- Rotate API keys regularly

⚠️ **Database**:
- Keep PostgreSQL connection string secure
- Whitelist Vercel IP addresses if using IP restrictions
- Regular backups recommended for production DB

⚠️ **Build Issues**:
- If build fails, check Function Logs in Vercel dashboard
- Ensure DATABASE_URL is set before deployment
- Prisma client regeneration happens automatically post-install

## Troubleshooting

### "DATABASE_URL not found" error
- Verify DATABASE_URL is set in Vercel Environment Variables
- Check that it's available to all environments (dev, preview, production)

### Build timeout
- Increase build timeout in Project Settings
- Optimize Prisma schema complexity if needed

### Prisma migration issues
- Connect to Vercel database using: `DATABASE_URL="..." npx prisma studio`
- Reset if needed: `DATABASE_URL="..." npx prisma db push --force-reset`

## Redeployment

To redeploy after code changes:
```bash
git push origin main
```
Vercel automatically redeploys when you push to your production branch.

## Local Testing Before Deployment

```bash
# Build locally to verify
npm run build

# Test build output
npm run start

# Check environment variables
echo $DATABASE_URL
```

---

For more info: https://vercel.com/docs/framework-guides/nextjs
