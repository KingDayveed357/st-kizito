# St. Kizito Parish App - Deployment Guide

## Quick Deployment to Vercel

The St. Kizito Parish App is fully optimized for Vercel deployment.

### Prerequisites

- Vercel account (free tier available at vercel.com)
- GitHub account (or Git repository)
- Node.js 18+ installed locally

### One-Click Deployment

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: St. Kizito Parish App"
   git remote add origin https://github.com/yourusername/stkizito-parish-app.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Click "Deploy"
   - Done! Your app is live in < 1 minute

### Manual Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from project root
vercel

# For production
vercel --prod
```

## Environment Variables

### Local Development

Create `.env.local`:
```env
# Database (when connected)
DATABASE_URL=your_database_url

# Authentication (when implemented)
AUTH_SECRET=your_secret_key

# API endpoints
NEXT_PUBLIC_API_URL=http://localhost:3000

# Email (when integrated)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
```

### Vercel Dashboard

1. Go to **Settings > Environment Variables**
2. Add variables for each environment:
   - **Development**: For preview deployments
   - **Preview**: For pull request previews
   - **Production**: For main branch deployments

Add these when ready:
```
DATABASE_URL
AUTH_SECRET
API_SECRET
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASSWORD
STRIPE_SECRET_KEY
```

## Pre-Deployment Checklist

### Code Quality
- [ ] All TypeScript errors resolved
- [ ] No console errors in development
- [ ] Responsive design tested on mobile
- [ ] All links working
- [ ] Form validation working

### Security
- [ ] Remove hardcoded credentials
- [ ] Update demo login credentials
- [ ] Add CSRF protection (when auth implemented)
- [ ] Configure CORS properly
- [ ] Enable HTTPS (automatic on Vercel)

### Performance
- [ ] Images optimized
- [ ] No unused dependencies
- [ ] CSS minified (automatic)
- [ ] JavaScript bundled (automatic)
- [ ] Lighthouse score > 90

### Testing
- [ ] Landing page loads
- [ ] Login works with demo credentials
- [ ] All admin pages load
- [ ] Create/edit/delete operations work
- [ ] Modal dialogs function properly

## Deployment Steps

### 1. Prepare the Repository

```bash
# Install dependencies
pnpm install

# Build locally to test
pnpm build

# Start production server
pnpm start

# Verify at http://localhost:3000
```

### 2. Update Metadata

Edit `app/layout.tsx`:
```tsx
export const metadata: Metadata = {
  title: 'St. Kizito Parish App',
  description: 'Modern parish management platform',
  openGraph: {
    url: 'https://your-domain.com',
    siteName: 'St. Kizito Parish App',
    // Update other metadata
  },
}
```

### 3. Configure Domain

In Vercel Dashboard:
1. Go to **Settings > Domains**
2. Add your custom domain
3. Update DNS records (Vercel provides instructions)
4. Wait for SSL certificate (5-30 minutes)

### 4. Set Environment Variables

```bash
# Using Vercel CLI
vercel env add DATABASE_URL
vercel env add AUTH_SECRET
vercel env add API_SECRET

# Or add through Vercel Dashboard
```

### 5. Deploy

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Or push to main branch if connected to GitHub
git push origin main
```

### 6. Verify Deployment

- [ ] Site loads at https://your-domain.com
- [ ] All pages accessible
- [ ] CSS loaded correctly
- [ ] Images display properly
- [ ] Links working
- [ ] Forms submitting

## Database Integration (Post-Deployment)

### Option 1: Supabase

1. **Create Supabase Project**
   ```bash
   # Go to supabase.com
   # Create new project
   # Copy connection string
   ```

2. **Set Environment Variable**
   ```bash
   vercel env add DATABASE_URL
   # Paste Supabase connection string
   ```

3. **Create API Routes**
   ```typescript
   // app/api/announcements/route.ts
   import { createClient } from '@supabase/supabase-js'

   const supabase = createClient(
     process.env.SUPABASE_URL,
     process.env.SUPABASE_KEY
   )

   export async function GET() {
     const { data } = await supabase
       .from('announcements')
       .select('*')
     return Response.json(data)
   }
   ```

### Option 2: Neon

1. **Create Neon Database**
   - Go to neon.tech
   - Create new project
   - Copy connection string

2. **Set Environment Variable**
   ```bash
   vercel env add DATABASE_URL
   ```

3. **Use with Prisma**
   ```bash
   npm install @prisma/client prisma
   ```

## Authentication Integration (Post-Deployment)

### Option 1: Supabase Auth

1. **Enable Auth in Supabase**
   - Go to Authentication > Providers
   - Enable Email/Password

2. **Update Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_KEY
   ```

3. **Replace Mock Auth**
   ```typescript
   // Replace localStorage auth in pages
   import { createClient } from '@supabase/supabase-js'

   const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
   )

   async function login(email, password) {
     const { data, error } = await supabase.auth
       .signInWithPassword({ email, password })
     return data
   }
   ```

### Option 2: Auth.js

1. **Install Auth.js**
   ```bash
   npm install next-auth
   ```

2. **Create Auth Configuration**
   ```typescript
   // lib/auth.ts
   import { NextAuthOptions } from "next-auth"
   import CredentialsProvider from "next-auth/providers/credentials"

   export const authOptions: NextAuthOptions = {
     providers: [
       CredentialsProvider({
         credentials: {
           email: { type: "email" },
           password: { type: "password" }
         },
         async authorize(credentials) {
           // Verify against database
           return { id: "1", email: credentials?.email }
         }
       })
     ]
   }
   ```

## Monitoring & Analytics

### Error Tracking (Sentry)

```bash
npm install @sentry/nextjs

# In sentry.client.config.ts
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
})
```

### Analytics (Vercel Analytics)

```typescript
// Already included in layout.tsx
import { Analytics } from '@vercel/analytics/next'

export default function RootLayout() {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### Monitoring Uptime

- Vercel includes basic uptime monitoring
- For advanced monitoring, use:
  - UptimeRobot (uptime24x7.com)
  - Pingdom (pingdom.com)
  - LogRocket (logrocket.com)

## Performance Optimization

### Image Optimization

```typescript
// Use Next.js Image component
import Image from 'next/image'

<Image
  src="/hero-image.jpg"
  alt="Description"
  width={1200}
  height={600}
  priority
/>
```

### CSS Optimization

- Tailwind CSS already optimized
- Vercel automatically minifies CSS
- No additional action needed

### JavaScript Optimization

```typescript
// Use dynamic imports for large components
import dynamic from 'next/dynamic'

const AdminLayout = dynamic(
  () => import('@/components/layout/admin-layout'),
  { ssr: false }
)
```

## Security Configuration

### HTTPS

- Automatic on Vercel
- Certificates auto-renewed

### Headers

Create `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### CORS

Add to `next.config.mjs`:
```javascript
export default {
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.ALLOWED_ORIGIN || '*',
          },
        ],
      },
    ]
  },
}
```

## Rollback Procedure

If you need to rollback to a previous deployment:

1. **Via Vercel Dashboard**
   - Go to **Deployments**
   - Find previous deployment
   - Click **Promote to Production**

2. **Via Git**
   ```bash
   git revert HEAD
   git push origin main
   # Vercel automatically redeploys
   ```

## Monitoring Deployments

### View Deployment Status

```bash
vercel ls            # List all deployments
vercel inspect       # Inspect current deployment
vercel logs          # View deployment logs
```

### Real-time Logs

In Vercel Dashboard:
- Go to **Deployments**
- Click on deployment
- View **Logs** section

## Scaling Considerations

### When to Scale

- User load > 1,000 concurrent
- Database size > 10GB
- Response time > 2s

### Scaling Steps

1. **Upgrade Vercel Plan**
   - Move from Hobby to Pro
   - Unlock more resources

2. **Optimize Database**
   - Add indexing
   - Implement caching
   - Use read replicas

3. **Add CDN**
   - Vercel Edge already included
   - For assets: Cloudflare

4. **Load Testing**
   ```bash
   # Test with k6
   npm install -g k6
   k6 run load-test.js
   ```

## Troubleshooting

### Deployment Fails

```bash
# Check logs
vercel logs --follow

# Rebuild
vercel --force

# Check environment variables
vercel env ls
```

### Build Size Too Large

```bash
# Analyze bundle
npm install -g next-bundle-analyzer

# Check what's large
npm run build

# Remove unused dependencies
npm prune --production
```

### Slow Performance

1. **Check Lighthouse**
   - Vercel Dashboard > Analytics
   - Run Google Lighthouse

2. **Optimize Images**
   - Use next/image
   - Compress before upload

3. **Cache Strategy**
   - Update `next.config.mjs`
   - Add ISR (Incremental Static Regeneration)

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Community**: https://vercel.com/help

---

Your St. Kizito Parish App is ready for production deployment!
