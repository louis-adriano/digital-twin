import { config } from 'dotenv';
config({ path: '.env.local' });

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import Groq from 'groq-sdk';
import { Client } from 'pg';

const resend = new Resend(process.env.RESEND_API_KEY);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

const getDbClient = () => new Client({
  connectionString: process.env.DATABASE_URL,
});

// Simple rate limiting for notifications (prevent spam)
const NOTIFICATION_LIMIT = new Map<string, number[]>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      visitor_email,
      visitor_name,
      inquiry_type,
      message,
      conversation_context,
      session_id
    } = body;

    // Validate required fields
    if (!visitor_email || !message) {
      return NextResponse.json(
        { error: 'visitor_email and message are required' },
        { status: 400 }
      );
    }

    // Rate limiting: max 3 notifications per email per hour
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour
    const maxNotifications = 3;

    if (!NOTIFICATION_LIMIT.has(visitor_email)) {
      NOTIFICATION_LIMIT.set(visitor_email, []);
    }

    const notifications = NOTIFICATION_LIMIT.get(visitor_email)!;
    const validNotifications = notifications.filter((time: number) => now - time < windowMs);
    
    if (validNotifications.length >= maxNotifications) {
      return NextResponse.json(
        { error: 'Too many notification requests. Please wait before sending another inquiry.' },
        { status: 429 }
      );
    }

    validNotifications.push(now);
    NOTIFICATION_LIMIT.set(visitor_email, validNotifications);

    console.log('📧 Generating professional inquiry notification...');

    // Use LLM to generate a structured, professional email summary
    const emailGeneration = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an email composer for professional work inquiries. Generate a clear, structured summary email that Louis Adriano will receive about someone who contacted his Digital Twin AI.

The email should follow this structure:
1. Brief introduction of who contacted
2. Type of inquiry (job opportunity, collaboration, consulting, etc.)
3. Key points from their message
4. Any relevant conversation context
5. Recommended action or response priority

Keep it professional, concise, and actionable. Format in plain text with clear sections.`
        },
        {
          role: 'user',
          content: `Generate an email notification with this information:

Visitor Email: ${visitor_email}
Visitor Name: ${visitor_name || 'Not provided'}
Inquiry Type: ${inquiry_type || 'General inquiry'}
Message: ${message}
${conversation_context ? `\nConversation Context:\n${conversation_context}` : ''}`
        }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.5,
      max_tokens: 500,
    });

    const generatedEmailContent = emailGeneration.choices[0]?.message?.content || '';

    // Construct the final email with structured format
    const emailSubject = `🔔 Work Inquiry from ${visitor_name || visitor_email} - ${inquiry_type || 'Digital Twin'}`;
    
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 0;
      opacity: 0.8;
      font-size: 14px;
    }
    .content {
      padding: 40px 30px;
    }
    .section {
      margin-bottom: 32px;
      padding-bottom: 32px;
      border-bottom: 1px solid #e5e5e5;
    }
    .section:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #000;
      margin: 0 0 16px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-size: 12px;
    }
    .info-grid {
      display: table;
      width: 100%;
    }
    .info-row {
      display: table-row;
    }
    .info-label {
      display: table-cell;
      padding: 10px 0;
      font-weight: 600;
      color: #666;
      width: 120px;
      font-size: 14px;
    }
    .info-value {
      display: table-cell;
      padding: 10px 0;
      color: #1a1a1a;
      font-size: 14px;
    }
    .message-box {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      border-left: 3px solid #000;
      font-size: 15px;
      line-height: 1.7;
      color: #1a1a1a;
    }
    .ai-summary {
      background: #f0f9ff;
      padding: 24px;
      border-radius: 8px;
      border-left: 3px solid #0ea5e9;
      font-size: 15px;
      line-height: 1.7;
    }
    .conversation {
      background: #fafafa;
      padding: 20px;
      border-radius: 8px;
      font-size: 13px;
      max-height: 300px;
      overflow-y: auto;
      font-family: 'Courier New', monospace;
      color: #444;
      white-space: pre-wrap;
    }
    .footer {
      background: #fafafa;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e5e5;
    }
    .footer p {
      margin: 0;
      color: #666;
      font-size: 13px;
    }
    .reply-btn {
      display: inline-block;
      background: #000;
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin-top: 16px;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .inquiry-type {
      display: inline-block;
      background: #000;
      color: white;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Work Inquiry</h1>
      <p>Via Digital Twin AI Portfolio</p>
    </div>
    
    <div class="content">
      <div class="section">
        <div class="section-title">Contact Details</div>
        <div class="info-grid">
          <div class="info-row">
            <div class="info-label">Name</div>
            <div class="info-value"><strong>${visitor_name || 'Not provided'}</strong></div>
          </div>
          <div class="info-row">
            <div class="info-label">Email</div>
            <div class="info-value">${visitor_email}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Inquiry Type</div>
            <div class="info-value"><span class="inquiry-type">${inquiry_type?.replace('-', ' ') || 'General'}</span></div>
          </div>
          <div class="info-row">
            <div class="info-label">Date</div>
            <div class="info-value">${new Date().toLocaleString('en-AU', { 
              timeZone: 'Australia/Sydney',
              dateStyle: 'full',
              timeStyle: 'short'
            })}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Original Message</div>
        <div class="message-box">${message}</div>
      </div>

      <div class="section">
        <div class="section-title">AI Summary</div>
        <div class="ai-summary">${generatedEmailContent}</div>
      </div>

      ${conversation_context ? `
      <div class="section">
        <div class="section-title">Conversation Context</div>
        <div class="conversation">${conversation_context}</div>
      </div>
      ` : ''}
    </div>

    <div class="footer">
      <p>Reply directly to this email to contact ${visitor_name || 'the visitor'}</p>
      <p style="margin-top: 8px; opacity: 0.7;">Automated inquiry from Digital Twin AI • Powered by Groq</p>
    </div>
  </div>
</body>
</html>
`;

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: 'Digital Twin <onboarding@resend.dev>', // Resend development email (change to your verified domain in production)
      to: process.env.NOTIFICATION_EMAIL || 'louisadriano00@gmail.com',
      subject: emailSubject,
      html: emailHtml,
      replyTo: visitor_email, // Allow direct reply to visitor
    });

    console.log('✅ Notification email sent:', emailResponse);

    // Log notification in database for tracking
    try {
      const client = getDbClient();
      await client.connect();
      
      await client.query(`
        INSERT INTO inquiry_notifications 
        (session_id, visitor_email, visitor_name, inquiry_type, message, email_sent_at, resend_id)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6)
      `, [
        session_id || null,
        visitor_email,
        visitor_name || null,
        inquiry_type || 'general',
        message,
        emailResponse.data?.id || null
      ]);
      
      await client.end();
      console.log('📝 Notification logged to database');
    } catch (dbError) {
      console.error('Error logging notification:', dbError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      email_id: emailResponse.data?.id
    });

  } catch (error) {
    console.error('❌ Notification error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
