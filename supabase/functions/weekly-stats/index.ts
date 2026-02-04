// Supabase Edge Function: weekly-stats
// Triggered by Supabase cron job every Sunday at 10am
// Generates and queues weekly stats emails for all active couples

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get all active couples with users who have weekly stats enabled
    const { data: couples, error: couplesError } = await supabase
      .from('betterhalf_couples')
      .select(`
        id,
        partner_a_id,
        partner_b_id,
        partner_a:betterhalf_users!betterhalf_couples_partner_a_id_fkey(id, email, display_name, notification_settings),
        partner_b:betterhalf_users!betterhalf_couples_partner_b_id_fkey(id, email, display_name, notification_settings)
      `)
      .eq('status', 'active')
      .not('partner_b_id', 'is', null)

    if (couplesError) throw couplesError

    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    let emailsQueued = 0

    for (const couple of couples || []) {
      // Get week's game data
      const { data: sessions } = await supabase
        .from('betterhalf_daily_sessions')
        .select('*')
        .eq('couple_id', couple.id)
        .gte('created_at', oneWeekAgo.toISOString())
        .not('completed_at', 'is', null)

      const { data: streak } = await supabase
        .from('betterhalf_streaks')
        .select('current_streak')
        .eq('couple_id', couple.id)
        .single()

      const gamesPlayed = sessions?.length || 0
      const matchesCount = sessions?.filter(s => s.is_match)?.length || 0
      const syncScore = gamesPlayed > 0 ? Math.round((matchesCount / gamesPlayed) * 100) : 0

      // Generate highlight
      let weekHighlight = "Keep playing to build your connection!"
      if (syncScore >= 80) weekHighlight = "Incredible sync! You two are truly in tune. 💕"
      else if (syncScore >= 60) weekHighlight = "Great week! Your connection is growing stronger."
      else if (gamesPlayed >= 5) weekHighlight = `Amazing dedication! ${gamesPlayed} games this week.`

      // Queue email for each partner if they have weekly stats enabled
      const partners = [couple.partner_a, couple.partner_b].filter(Boolean)
      
      for (const partner of partners) {
        const settings = partner.notification_settings || {}
        if (settings.weeklyStats === false) continue

        const otherPartner = partners.find(p => p.id !== partner.id)
        
        const emailHtml = generateWeeklyEmail({
          userName: partner.display_name || 'Friend',
          partnerName: otherPartner?.display_name || 'Partner',
          gamesPlayed,
          matchesCount,
          syncScore,
          currentStreak: streak?.current_streak || 0,
          bestCategory: 'Daily Life',
          weekHighlight,
        })

        await supabase.from('betterhalf_email_queue').insert({
          user_id: partner.id,
          email_address: partner.email,
          email_type: 'weekly_stats',
          subject: `💕 Your Weekly Connection Summary`,
          html_content: emailHtml,
          status: 'pending',
          created_at: new Date().toISOString(),
        })

        emailsQueued++
      }
    }

    return new Response(
      JSON.stringify({ success: true, emailsQueued }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateWeeklyEmail(data: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, sans-serif; margin: 0; padding: 0; background: #0F0F1A; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 30px 0; }
    .title { color: #FF6B9D; font-size: 24px; }
    .card { background: linear-gradient(135deg, #1a1a2e, #16213e); border-radius: 16px; padding: 24px; margin: 16px 0; }
    .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .stat { text-align: center; padding: 16px; background: rgba(255,255,255,0.05); border-radius: 12px; }
    .stat-value { font-size: 36px; font-weight: bold; color: #FF6B9D; }
    .stat-label { font-size: 12px; color: #8E8EA0; }
    .cta { display: inline-block; background: linear-gradient(135deg, #FF6B9D, #FF8E53); color: white; padding: 16px 32px; border-radius: 30px; text-decoration: none; font-weight: 600; }
    p { color: #E5E7EB; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-size: 32px;">💕</div>
      <h1 class="title">Better Half</h1>
    </div>
    <div class="card">
      <p>Hi ${data.userName}! Here's how you and ${data.partnerName} connected this week:</p>
      <div class="stat-grid">
        <div class="stat"><div class="stat-value">${data.gamesPlayed}</div><div class="stat-label">Games Played</div></div>
        <div class="stat"><div class="stat-value">${data.matchesCount}</div><div class="stat-label">Perfect Matches</div></div>
        <div class="stat"><div class="stat-value">${data.syncScore}%</div><div class="stat-label">Sync Score</div></div>
        <div class="stat"><div class="stat-value">🔥 ${data.currentStreak}</div><div class="stat-label">Day Streak</div></div>
      </div>
    </div>
    <div class="card">
      <h3 style="color: #FF6B9D; margin-top: 0;">✨ Week Highlight</h3>
      <p>${data.weekHighlight}</p>
    </div>
    <div style="text-align: center;"><a href="https://betterhalf.newbold.cloud" class="cta">Play Today's Game →</a></div>
  </div>
</body>
</html>`
}
