import { getSupabase, TABLES } from './supabase';

// Email types
export type EmailType = 
  | 'weekly_stats'
  | 'monthly_recap'
  | 'streak_milestone'
  | 'welcome'
  | 'partner_joined';

export interface WeeklyStatsData {
  userName: string;
  partnerName: string;
  gamesPlayed: number;
  matchesCount: number;
  syncScore: number;
  currentStreak: number;
  bestCategory: string;
  weekHighlight: string;
}

export interface MonthlyRecapData {
  userName: string;
  partnerName: string;
  monthName: string;
  totalGames: number;
  totalMatches: number;
  avgSyncScore: number;
  longestStreak: number;
  newAchievements: string[];
  topCategories: { name: string; score: number }[];
  milestones: string[];
}

// Email templates
export function generateWeeklyStatsEmail(data: WeeklyStatsData): { subject: string; html: string } {
  const subject = `💕 Your Weekly Connection Summary with ${data.partnerName}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #0F0F1A; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 30px 0; }
    .logo { font-size: 32px; }
    .title { color: #FF6B9D; font-size: 24px; margin: 10px 0; }
    .subtitle { color: #8E8EA0; font-size: 14px; }
    .card { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 24px; margin: 16px 0; }
    .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .stat { text-align: center; padding: 16px; background: rgba(255,255,255,0.05); border-radius: 12px; }
    .stat-value { font-size: 36px; font-weight: bold; color: #FF6B9D; }
    .stat-label { font-size: 12px; color: #8E8EA0; margin-top: 4px; }
    .highlight { background: linear-gradient(135deg, #FF6B9D 0%, #FF8E53 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .cta { display: inline-block; background: linear-gradient(135deg, #FF6B9D 0%, #FF8E53 100%); color: white; padding: 16px 32px; border-radius: 30px; text-decoration: none; font-weight: 600; margin: 20px 0; }
    .footer { text-align: center; color: #6B7280; font-size: 12px; padding: 20px 0; }
    p { color: #E5E7EB; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">💕</div>
      <h1 class="title">Better Half</h1>
      <p class="subtitle">Your Weekly Connection Summary</p>
    </div>
    
    <div class="card">
      <p>Hi ${data.userName}! 👋</p>
      <p>Here's how you and ${data.partnerName} connected this week:</p>
      
      <div class="stat-grid">
        <div class="stat">
          <div class="stat-value">${data.gamesPlayed}</div>
          <div class="stat-label">Games Played</div>
        </div>
        <div class="stat">
          <div class="stat-value">${data.matchesCount}</div>
          <div class="stat-label">Perfect Matches</div>
        </div>
        <div class="stat">
          <div class="stat-value">${data.syncScore}%</div>
          <div class="stat-label">Sync Score</div>
        </div>
        <div class="stat">
          <div class="stat-value">🔥 ${data.currentStreak}</div>
          <div class="stat-label">Day Streak</div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <h3 style="color: #FF6B9D; margin-top: 0;">✨ Week Highlight</h3>
      <p>${data.weekHighlight}</p>
      <p>Your strongest connection category: <span class="highlight">${data.bestCategory}</span></p>
    </div>
    
    <div style="text-align: center;">
      <a href="https://betterhalf.newbold.cloud" class="cta">Play Today's Game →</a>
    </div>
    
    <div class="footer">
      <p>Keep the connection strong! 💕</p>
      <p>Better Half · <a href="https://betterhalf.newbold.cloud/settings" style="color: #FF6B9D;">Manage Preferences</a></p>
    </div>
  </div>
</body>
</html>
`;

  return { subject, html };
}

export function generateMonthlyRecapEmail(data: MonthlyRecapData): { subject: string; html: string } {
  const subject = `📊 Your ${data.monthName} Relationship Recap`;
  
  const achievementsHtml = data.newAchievements.length > 0 
    ? data.newAchievements.map(a => `<li style="color: #E5E7EB;">🏆 ${a}</li>`).join('')
    : '<li style="color: #8E8EA0;">Keep playing to unlock achievements!</li>';
    
  const milestonesHtml = data.milestones.length > 0
    ? data.milestones.map(m => `<li style="color: #E5E7EB;">🎉 ${m}</li>`).join('')
    : '';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #0F0F1A; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 30px 0; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; margin-bottom: 20px; }
    .month-title { font-size: 28px; color: #FF6B9D; margin: 0; }
    .card { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 24px; margin: 16px 0; }
    .big-stat { text-align: center; padding: 24px; }
    .big-stat-value { font-size: 64px; font-weight: bold; background: linear-gradient(135deg, #FF6B9D 0%, #FF8E53 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .big-stat-label { font-size: 16px; color: #8E8EA0; }
    .stat-row { display: flex; justify-content: space-around; padding: 16px 0; border-top: 1px solid rgba(255,255,255,0.1); }
    .mini-stat { text-align: center; }
    .mini-stat-value { font-size: 24px; color: #FF6B9D; font-weight: bold; }
    .mini-stat-label { font-size: 11px; color: #8E8EA0; }
    ul { padding-left: 20px; }
    li { margin: 8px 0; }
    .cta { display: inline-block; background: linear-gradient(135deg, #FF6B9D 0%, #FF8E53 100%); color: white; padding: 16px 32px; border-radius: 30px; text-decoration: none; font-weight: 600; margin: 20px 0; }
    .footer { text-align: center; color: #6B7280; font-size: 12px; padding: 20px 0; }
    p { color: #E5E7EB; line-height: 1.6; }
    h3 { color: #FF6B9D; margin-top: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <p style="color: #8E8EA0; margin: 0;">📊 Monthly Recap</p>
      <h1 class="month-title">${data.monthName}</h1>
      <p style="color: #E5E7EB; margin: 5px 0;">You & ${data.partnerName}</p>
    </div>
    
    <div class="card">
      <div class="big-stat">
        <div class="big-stat-value">${data.avgSyncScore}%</div>
        <div class="big-stat-label">Average Sync Score</div>
      </div>
      <div class="stat-row">
        <div class="mini-stat">
          <div class="mini-stat-value">${data.totalGames}</div>
          <div class="mini-stat-label">GAMES PLAYED</div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-value">${data.totalMatches}</div>
          <div class="mini-stat-label">PERFECT MATCHES</div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-value">🔥 ${data.longestStreak}</div>
          <div class="mini-stat-label">BEST STREAK</div>
        </div>
      </div>
    </div>
    
    ${data.newAchievements.length > 0 ? `
    <div class="card">
      <h3>🏆 Achievements Unlocked</h3>
      <ul>${achievementsHtml}</ul>
    </div>
    ` : ''}
    
    ${data.milestones.length > 0 ? `
    <div class="card">
      <h3>🎉 Milestones Reached</h3>
      <ul>${milestonesHtml}</ul>
    </div>
    ` : ''}
    
    <div class="card">
      <h3>📈 Top Categories</h3>
      ${data.topCategories.map((cat, i) => `
        <div style="display: flex; align-items: center; margin: 12px 0;">
          <span style="color: #FF6B9D; width: 24px;">${i + 1}.</span>
          <span style="color: #E5E7EB; flex: 1;">${cat.name}</span>
          <span style="color: #FF6B9D; font-weight: bold;">${cat.score}%</span>
        </div>
      `).join('')}
    </div>
    
    <div style="text-align: center;">
      <p style="color: #E5E7EB;">Here's to another month of connection! 💕</p>
      <a href="https://betterhalf.newbold.cloud" class="cta">Continue Your Journey →</a>
    </div>
    
    <div class="footer">
      <p>Better Half · <a href="https://betterhalf.newbold.cloud/settings" style="color: #FF6B9D;">Manage Email Preferences</a></p>
    </div>
  </div>
</body>
</html>
`;

  return { subject, html };
}

// Get user's weekly stats from database
export async function getWeeklyStats(userId: string, coupleId: string): Promise<WeeklyStatsData | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  try {
    // Get user and partner info
    const { data: couple } = await supabase
      .from(TABLES.couples)
      .select(`
        partner_a_id,
        partner_b_id,
        partner_a:betterhalf_users!betterhalf_couples_partner_a_id_fkey(display_name),
        partner_b:betterhalf_users!betterhalf_couples_partner_b_id_fkey(display_name)
      `)
      .eq('id', coupleId)
      .single();

    if (!couple) return null;

    const isPartnerA = couple.partner_a_id === userId;
    const userName = isPartnerA ? couple.partner_a?.display_name : couple.partner_b?.display_name;
    const partnerName = isPartnerA ? couple.partner_b?.display_name : couple.partner_a?.display_name;

    // Get this week's games
    const { data: sessions } = await supabase
      .from(TABLES.daily_sessions)
      .select('*')
      .eq('couple_id', coupleId)
      .gte('created_at', oneWeekAgo.toISOString())
      .not('completed_at', 'is', null);

    const gamesPlayed = sessions?.length || 0;
    const matchesCount = sessions?.filter(s => s.is_match)?.length || 0;
    const syncScore = gamesPlayed > 0 ? Math.round((matchesCount / gamesPlayed) * 100) : 0;

    // Get current streak
    const { data: streak } = await supabase
      .from(TABLES.streaks)
      .select('current_streak')
      .eq('couple_id', coupleId)
      .single();

    // Generate highlight based on stats
    let weekHighlight = "Keep playing to build your connection!";
    if (syncScore >= 80) {
      weekHighlight = `Incredible sync! You two are truly in tune with each other. 💕`;
    } else if (syncScore >= 60) {
      weekHighlight = `Great week! Your connection is growing stronger every day.`;
    } else if (gamesPlayed >= 5) {
      weekHighlight = `Amazing dedication! ${gamesPlayed} games this week shows real commitment.`;
    }

    return {
      userName: userName || 'Friend',
      partnerName: partnerName || 'Partner',
      gamesPlayed,
      matchesCount,
      syncScore,
      currentStreak: streak?.current_streak || 0,
      bestCategory: 'Daily Life', // TODO: Calculate from actual data
      weekHighlight,
    };
  } catch (error) {
    console.error('[Email] Failed to get weekly stats:', error);
    return null;
  }
}

// Queue email for sending (uses Supabase Edge Function or external service)
export async function queueEmail(
  userId: string,
  email: string,
  type: EmailType,
  content: { subject: string; html: string }
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    // Store in email queue table for processing
    await supabase
      .from('betterhalf_email_queue')
      .insert({
        user_id: userId,
        email_address: email,
        email_type: type,
        subject: content.subject,
        html_content: content.html,
        status: 'pending',
        created_at: new Date().toISOString(),
      });
    return true;
  } catch (error) {
    console.error('[Email] Failed to queue email:', error);
    return false;
  }
}
