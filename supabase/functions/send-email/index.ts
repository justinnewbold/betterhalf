// Supabase Edge Function: send-email
// Deploy via Supabase Dashboard > Edge Functions
// This function processes the email queue and sends emails via Resend/SendGrid

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Email service configuration (using Resend as example)
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = 'Better Half <noreply@betterhalf.newbold.cloud>'

interface EmailRequest {
  to: string
  subject: string
  html: string
}

async function sendEmail(email: EmailRequest): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured')
    return false
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email.to,
        subject: email.subject,
        html: email.html,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Email send failed:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get pending emails from queue
    const { data: emails, error } = await supabase
      .from('betterhalf_email_queue')
      .select('*')
      .eq('status', 'pending')
      .limit(10)

    if (error) throw error

    const results = {
      processed: 0,
      success: 0,
      failed: 0,
    }

    for (const email of emails || []) {
      results.processed++

      const success = await sendEmail({
        to: email.email_address,
        subject: email.subject,
        html: email.html_content,
      })

      // Update email status
      await supabase
        .from('betterhalf_email_queue')
        .update({
          status: success ? 'sent' : 'failed',
          sent_at: success ? new Date().toISOString() : null,
          error_message: success ? null : 'Send failed',
        })
        .eq('id', email.id)

      if (success) {
        results.success++
      } else {
        results.failed++
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
