// supabase/functions/weekly-stats-email/index.ts
// Weekly Stats Email - Sends relationship stats to users every Sunday
// Deploy: supabase functions deploy weekly-stats-email
// Schedule: Set up pg_cron to call this every Sunday at 9am

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

interface CoupleStats {
  couple_id: string
  user1_email: string
  user2_email: string
  user1_name: string
  user2_name: string
  current_streak: number
  games_this_week: number
  matches_this_week: number
  total_games: number
  total_matches: number
  sync_score: number
}

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    // Get all couples with email notifications enabled
    const { data: couples, error: couplesError } = await supabase
      .from('betterhalf_couples')
      .select(`
        id,
        user1_id,
        user2_id,
        betterhalf_users!betterhalf_couples_user1_id_fkey(email, display_name, email_notifications),
        betterhalf_users!betterhalf_couples_user2_id_fkey(email, display_name, email_notifications)
      `)
      .eq('status', 'active')
    
    if (couplesError) throw couplesError
    
    // Get stats for each couple
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    const emailsSent: string[] = []
    
    for (const couple of couples || []) {
      const user1 = couple.betterhalf_users as any
      const user2 = (couple as any).betterhalf_users as any
      
      // Skip if neither user wants emails
      if (!user1?.email_notifications && !user2?.email_notifications) continue
      
      // Get weekly games
      const { data: weeklyGames } = await supabase
        .from('betterhalf_games')
        .select('is_match')
        .eq('couple_id', couple.id)
        .gte('created_at', oneWeekAgo.toISOString())
        .eq('status', 'completed')
      
      // Get streak
      const { data: streak } = await supabase
        .from('betterhalf_streaks')
        .select('current_streak')
        .eq('couple_id', couple.id)
        .single()
      
      // Get total stats
      const { data: stats } = await supabase
        .from('betterhalf_couple_stats')
        .select('total_games, total_matches')
        .eq('couple_id', couple.id)
        .single()
      
      const gamesThisWeek = weeklyGames?.length || 0
      const matchesThisWeek = weeklyGames?.filter(g => g.is_match).length || 0
      const currentStreak = streak?.current_streak || 0
      const totalGames = stats?.total_games || 0
      const totalMatches = stats?.total_matches || 0
      const syncScore = totalGames > 0 ? Math.round((totalMatches / totalGames) * 100) : 0
      
      // Send email to each user who wants notifications
      const recipients = []
      if (user1?.email_notifications && user1?.email) {
        recipients.push({ email: user1.email, name: user1.display_name, partnerName: user2?.display_name })
      }
      if (user2?.email_notifications && user2?.email) {
        recipients.push({ email: user2.email, name: user2.display_name, partnerName: user1?.display_name })
      }
      
      for (const recipient of recipients) {
        const emailHtml = generateEmailHtml({
          name: recipient.name,
          partnerName: recipient.partnerName,
          gamesThisWeek,
          matchesThisWeek,
          currentStreak,
          syncScore,
          totalGames,
        })
        
        // Send via Resend
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Better Half <noreply@betterhalf.newbold.cloud>',
            to: recipient.email,
            subject: `💕 Your Weekly Sync with ${recipient.partnerName}`,
            html: emailHtml,
          }),
        })
        
        if (response.ok) {
          emailsSent.push(recipient.email)
        }
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent: emailsSent.length,
        recipients: emailsSent 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Weekly stats email error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

function generateEmailHtml(data: {
  name: string
  partnerName: string
  gamesThisWeek: number
  matchesThisWeek: number
  currentStreak: number
  syncScore: number
  totalGames: number
}): string {
  const matchRate = data.gamesThisWeek > 0 
    ? Math.round((data.matchesThisWeek / data.gamesThisWeek) * 100) 
    : 0
    
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Weekly Sync</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0F0F1A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <tr>
      <td style="text-align: center; padding: 40px 20px;">
        <h1 style="color: #FF6B6B; font-size: 28px; margin: 0;">💕 Better Half</h1>
        <p style="color: #888; font-size: 14px; margin-top: 8px;">Your Weekly Relationship Recap</p>
      </td>
    </tr>
    <tr>
      <td style="background: linear-gradient(135deg, #1E1E2E, #2A2A3E); border-radius: 16px; padding: 32px;">
        <p style="color: #FFFFFF; font-size: 18px; margin: 0 0 20px;">
          Hey ${data.name}! 👋
        </p>
        <p style="color: #AAAAAA; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
          Here's how you and ${data.partnerName} connected this week:
        </p>
        
        <!-- Stats Grid -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
          <tr>
            <td width="50%" style="padding: 12px; text-align: center; background: rgba(255,255,255,0.05); border-radius: 12px 0 0 0;">
              <p style="color: #FF6B6B; font-size: 32px; font-weight: bold; margin: 0;">${data.gamesThisWeek}</p>
              <p style="color: #888; font-size: 12px; margin: 4px 0 0; text-transform: uppercase;">Games Played</p>
            </td>
            <td width="50%" style="padding: 12px; text-align: center; background: rgba(255,255,255,0.05); border-radius: 0 12px 0 0;">
              <p style="color: #4ECDC4; font-size: 32px; font-weight: bold; margin: 0;">${data.matchesThisWeek}</p>
              <p style="color: #888; font-size: 12px; margin: 4px 0 0; text-transform: uppercase;">Matches</p>
            </td>
          </tr>
          <tr>
            <td width="50%" style="padding: 12px; text-align: center; background: rgba(255,255,255,0.05); border-radius: 0 0 0 12px;">
              <p style="color: #FFE66D; font-size: 32px; font-weight: bold; margin: 0;">🔥 ${data.currentStreak}</p>
              <p style="color: #888; font-size: 12px; margin: 4px 0 0; text-transform: uppercase;">Day Streak</p>
            </td>
            <td width="50%" style="padding: 12px; text-align: center; background: rgba(255,255,255,0.05); border-radius: 0 0 12px 0;">
              <p style="color: #FF6B6B; font-size: 32px; font-weight: bold; margin: 0;">${data.syncScore}%</p>
              <p style="color: #888; font-size: 12px; margin: 4px 0 0; text-transform: uppercase;">Sync Score</p>
            </td>
          </tr>
        </table>
        
        ${data.gamesThisWeek >= 7 ? `
        <div style="background: rgba(78, 205, 196, 0.1); border: 1px solid rgba(78, 205, 196, 0.3); border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 24px;">
          <p style="color: #4ECDC4; font-size: 16px; margin: 0;">
            🎉 You played every day this week! Keep the streak going!
          </p>
        </div>
        ` : data.gamesThisWeek === 0 ? `
        <div style="background: rgba(255, 107, 107, 0.1); border: 1px solid rgba(255, 107, 107, 0.3); border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 24px;">
          <p style="color: #FF6B6B; font-size: 16px; margin: 0;">
            We missed you this week! ${data.partnerName} is waiting to sync. 💕
          </p>
        </div>
        ` : ''}
        
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="text-align: center;">
              <a href="https://betterhalf.newbold.cloud" style="display: inline-block; background: linear-gradient(135deg, #FF6B6B, #FF8E8E); color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                Play Today's Question
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="text-align: center; padding: 24px 20px;">
        <p style="color: #666; font-size: 12px; margin: 0;">
          You're receiving this because you enabled weekly stats in Better Half.
          <br>
          <a href="https://betterhalf.newbold.cloud/settings/notifications" style="color: #888;">Unsubscribe</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}
