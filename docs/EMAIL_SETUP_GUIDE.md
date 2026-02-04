# Better Half - Email Service Setup Guide 📧

## Overview
Weekly stats emails are sent every Sunday morning using:
- **Supabase Edge Functions** - Serverless function runtime
- **Resend** - Email delivery service (free tier: 3000 emails/month)
- **pg_cron** - PostgreSQL scheduler for automated delivery

## Setup Steps

### Step 1: Create Resend Account
1. Go to https://resend.com/signup
2. Create free account
3. Verify your domain: `betterhalf.newbold.cloud`
4. Get your API key from Dashboard > API Keys

### Step 2: Add Domain DNS Records
Add these DNS records to your domain:

| Type | Name | Value |
|------|------|-------|
| TXT | @ | `v=spf1 include:_spf.resend.com ~all` |
| CNAME | resend._domainkey | `...resend.com` |

### Step 3: Set Supabase Secrets
```bash
# Add Resend API key as secret
supabase secrets set RESEND_API_KEY=re_xxxxx

# Deploy the function
supabase functions deploy weekly-stats-email
```

### Step 4: Schedule Weekly Emails
Run this SQL in Supabase SQL Editor:

```sql
-- Enable pg_cron extension (if not already)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule weekly email every Sunday at 9:00 AM UTC
SELECT cron.schedule(
  'weekly-stats-email',
  '0 9 * * 0', -- Every Sunday at 9 AM
  $$
  SELECT
    net.http_post(
      url := 'https://wektbfkzbxvtxsremnnk.supabase.co/functions/v1/weekly-stats-email',
      headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
      body := '{}'::jsonb
    );
  $$
);
```

### Step 5: Test the Function
```bash
# Manual test
curl -X POST \
  'https://wektbfkzbxvtxsremnnk.supabase.co/functions/v1/weekly-stats-email' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'
```

## Email Template Features
- 💕 Beautiful dark theme matching app design
- 📊 Weekly stats: games played, matches, streak
- 🔥 Streak celebration or gentle reminder
- 📱 Mobile-responsive design
- 🔗 Deep link to play today's game

## Database Column Added
```sql
-- Users can toggle email notifications
ALTER TABLE betterhalf_users 
ADD COLUMN email_notifications BOOLEAN DEFAULT true;
```

## Settings Integration
Add to Settings > Notifications screen:
- Toggle for "Weekly Stats Email"
- Preview next email date
- Send test email button

## Cost Estimate
- Resend Free Tier: 3,000 emails/month
- At 100 couples = 800 emails/month = FREE ✅

---
*Edge Function: `supabase/functions/weekly-stats-email/index.ts`*
