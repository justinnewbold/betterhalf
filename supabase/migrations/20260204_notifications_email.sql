-- Migration: Add notification and email support tables
-- Run this in Supabase SQL Editor

-- Email Queue Table
CREATE TABLE IF NOT EXISTS betterhalf_email_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES betterhalf_users(id) ON DELETE CASCADE,
  email_address text NOT NULL,
  email_type text NOT NULL CHECK (email_type IN ('weekly_stats', 'monthly_recap', 'streak_milestone', 'welcome', 'partner_joined')),
  subject text NOT NULL,
  html_content text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz,
  error_message text
);

-- Notification Queue Table (for push notifications)
CREATE TABLE IF NOT EXISTS betterhalf_notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES betterhalf_users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  data jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz
);

-- Add notification columns to users table if not exists
ALTER TABLE betterhalf_users 
ADD COLUMN IF NOT EXISTS push_token text,
ADD COLUMN IF NOT EXISTS push_token_updated_at timestamptz,
ADD COLUMN IF NOT EXISTS notification_settings jsonb DEFAULT '{"dailyReminder": true, "dailyReminderTime": {"hour": 19, "minute": 0}, "partnerActivity": true, "streakWarnings": true, "achievements": true, "friendRequests": true, "weeklyStats": true}'::jsonb;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON betterhalf_email_queue(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_notifications_status ON betterhalf_notifications(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_notifications_user ON betterhalf_notifications(user_id);

-- RLS Policies for email queue (service role only)
ALTER TABLE betterhalf_email_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access to email_queue" ON betterhalf_email_queue
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for notifications
ALTER TABLE betterhalf_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON betterhalf_notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to notifications" ON betterhalf_notifications
  FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON betterhalf_email_queue TO service_role;
GRANT ALL ON betterhalf_notifications TO service_role;
GRANT SELECT ON betterhalf_notifications TO authenticated;
