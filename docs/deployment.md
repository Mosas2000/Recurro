# Deployment Guide

## Prerequisites

- Vercel account
- GitHub repository
- Leather or Xverse wallet (for testing)
- STX/sBTC testnet tokens

## Environment Setup

### Required Environment Variables

Create these environment variables in your Vercel project:

```env
STACKS_NETWORK=testnet
STACKS_API_URL=https://api.testnet.hiro.so
NEXT_PUBLIC_STACKS_NETWORK=testnet
NEXT_PUBLIC_STACKS_API_URL=https://api.testnet.hiro.so
```

For production (mainnet):

```env
STACKS_NETWORK=mainnet
STACKS_API_URL=https://api.hiro.so
NEXT_PUBLIC_STACKS_NETWORK=mainnet
NEXT_PUBLIC_STACKS_API_URL=https://api.hiro.so
```

## Deployment Steps

### 1. Deploy to Vercel

#### Via GitHub Integration

1. Push your code to GitHub:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. Visit [Vercel Dashboard](https://vercel.com/dashboard)

3. Click "Add New Project"

4. Import your GitHub repository

5. Configure project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: .next

6. Add environment variables from the section above

7. Click "Deploy"

#### Via Vercel CLI

```bash
npm install -g vercel

cd recurro

vercel

vercel --prod
```

### 2. Configure Custom Domain (Optional)

1. In Vercel Dashboard → Settings → Domains

2. Add your custom domain:
```
recurro.app
```

3. Configure DNS records:
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

4. Wait for DNS propagation (can take 24-48 hours)

### 3. Test Deployment

Visit your deployment URL and test:

1. Landing page loads correctly
2. Wallet connection works
3. Dashboard is accessible
4. Demo page functions properly
5. API routes respond

### 4. Monitor Deployment

In Vercel Dashboard:
- View deployment logs
- Monitor function execution
- Track error rates
- Check performance metrics

## Post-Deployment Configuration

### API Rate Limiting

Add rate limiting to protect API routes:

```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'),
});
```

### Error Monitoring

Set up Sentry for error tracking:

```bash
npm install @sentry/nextjs

npx @sentry/wizard@latest -i nextjs
```

### Analytics

Add analytics tracking:

```bash
npm install @vercel/analytics

// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

## Database Migration

### Current: In-Memory Storage

Development uses in-memory Map storage. Data is lost on server restart.

### Production: PostgreSQL

For production, migrate to PostgreSQL:

1. Create Vercel Postgres database:
```bash
vercel postgres create
```

2. Install Postgres client:
```bash
npm install @vercel/postgres
```

3. Update schema:
```typescript
// lib/db/postgres.ts
import { sql } from '@vercel/postgres';

export async function createSubscription(data) {
  const result = await sql`
    INSERT INTO subscriptions (
      id, creator_address, subscriber_address,
      amount, currency, interval, status,
      next_payment_date, created_at
    ) VALUES (
      ${data.id}, ${data.creatorAddress}, ${data.subscriberAddress},
      ${data.amount}, ${data.currency}, ${data.interval}, ${data.status},
      ${data.nextPaymentDate}, ${data.createdAt}
    )
    RETURNING *
  `;
  return result.rows[0];
}
```

4. Run migrations:
```bash
vercel env pull .env.local

npm run db:migrate
```

## Mainnet Deployment Checklist

Before deploying to mainnet:

- [ ] Complete smart contract audit
- [ ] Test all flows on testnet
- [ ] Set up error monitoring (Sentry)
- [ ] Configure analytics
- [ ] Enable rate limiting
- [ ] Set up database backups
- [ ] Document emergency procedures
- [ ] Test wallet connections (Leather + Xverse)
- [ ] Verify payment processing
- [ ] Load test API endpoints
- [ ] Set up status page
- [ ] Configure alerts for critical errors

## Rollback Procedure

If deployment has issues:

1. Revert to previous deployment:
```bash
vercel rollback
```

2. Or redeploy specific commit:
```bash
vercel --prod --force
```

3. Check deployment logs:
```bash
vercel logs
```

## Performance Optimization

### Enable Edge Caching

```typescript
// app/api/subscriptions/route.ts
export const runtime = 'edge';
export const revalidate = 60;
```

### Image Optimization

Use Next.js Image component:

```tsx
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Recurro"
  width={200}
  height={50}
  priority
/>
```

### Bundle Analysis

```bash
npm install @next/bundle-analyzer

ANALYZE=true npm run build
```

## Monitoring

### Health Check Endpoint

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: 'ok',
    timestamp: Date.now(),
    version: '1.0.0'
  });
}
```

### Uptime Monitoring

Use services like:
- UptimeRobot
- Pingdom
- Better Uptime

## Security Hardening

### Content Security Policy

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval'"
          }
        ]
      }
    ];
  }
};
```

### API Security

- Enable CORS for specific origins
- Add request signature verification
- Implement API authentication
- Rate limit all endpoints

## Backup Strategy

### Database Backups

```bash
vercel postgres backup create

vercel postgres backup list

vercel postgres backup restore <backup-id>
```

### Code Backups

- GitHub repository is source of truth
- Tag releases: `git tag v1.0.0`
- Archive important branches

## Support

For deployment issues:
- Check Vercel logs
- Review [Vercel Documentation](https://vercel.com/docs)
- Contact support via [Vercel Support](https://vercel.com/support)
