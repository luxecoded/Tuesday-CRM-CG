// @ts-nocheck
import nodemailer from "npm:nodemailer@6"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, body, pdfBase64, filename } = await req.json()

    if (!to) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: to' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // All SMTP config comes from secrets — swap these to change provider
    const transporter = nodemailer.createTransport({
      host: Deno.env.get('SMTP_HOST'),
      port: parseInt(Deno.env.get('SMTP_PORT') ?? '587'),
      secure: Deno.env.get('SMTP_PORT') === '465',
      auth: {
        user: Deno.env.get('SMTP_USER'),
        pass: Deno.env.get('SMTP_PASS'),
      },
    })

    const fromName = Deno.env.get('SMTP_FROM_NAME') ?? 'Elite Windows'
    const fromAddr = Deno.env.get('SMTP_USER') ?? ''

    await transporter.sendMail({
      from: `"${fromName}" <${fromAddr}>`,
      to,
      subject: subject || `${fromName} — Document`,
      text: body || '',
      html: body ? body.replace(/\n/g, '<br>') : '',
      ...(pdfBase64 && filename ? {
        attachments: [{
          filename,
          content: pdfBase64,
          encoding: 'base64',
          contentType: 'application/pdf',
        }],
      } : {}),
    })

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('send-pdf-email error:', err)
    return new Response(
      JSON.stringify({ error: err.message ?? 'Failed to send email' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
