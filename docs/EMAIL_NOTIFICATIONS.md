# Email Notification System Setup

## Overview
The Digital Twin now includes an AI-powered email notification system that allows visitors to send work inquiries directly to Louis. The AI automatically generates a professional, structured summary of the inquiry.

## Features
- 📧 **Direct Work Inquiries**: Visitors can submit job opportunities, collaboration requests, or consulting inquiries
- 🧠 **AI-Generated Summaries**: Groq AI creates professional email summaries with context
- 💬 **Conversation Context**: Last 5 chat messages are included for full context
- 🎨 **Beautiful HTML Emails**: Professional, responsive email templates
- 📊 **Database Tracking**: All inquiries are logged for analytics
- ⚡ **Rate Limiting**: Prevents spam (max 3 notifications per email per hour)

## Setup Instructions

### 1. Install Dependencies
Already installed: `resend`

### 2. Get Resend API Key
1. Sign up at [resend.com](https://resend.com)
2. Verify your domain (or use their test domain for development)
3. Create an API key in the dashboard

### 3. Add Environment Variables
Add to your `.env.local`:

```env
# Resend Email API
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx

# Your notification email (where inquiries will be sent)
NOTIFICATION_EMAIL=louisadriano00@gmail.com
```

### 4. Create Database Table
Run the setup script:

```bash
npx tsx scripts/create-notifications-table.ts
```

This creates the `inquiry_notifications` table with:
- visitor contact information
- inquiry type and message
- conversation context
- email tracking (resend_id)
- timestamps and indexes

### 5. Update Email Domain
In `src/app/api/notify/route.ts`, line 159, update the `from` email:

```typescript
from: 'Digital Twin <noreply@yourdomain.com>', // Update with your verified domain
```

For development, Resend provides a test domain you can use.

## How It Works

### User Flow
1. **User chats with AI** → Asks questions about your background
2. **User clicks "Contact Louis"** → Opens notification modal
3. **User fills form** → Email, name, inquiry type, message
4. **Submits inquiry** → Sends to `/api/notify` endpoint

### Backend Process
1. **Rate Limiting Check** → Prevents spam (3 per hour per email)
2. **AI Summary Generation** → Groq AI creates professional email summary
3. **Email Composition** → Beautiful HTML email with all details
4. **Send via Resend** → Delivers to your NOTIFICATION_EMAIL
5. **Database Logging** → Tracks inquiry for analytics

### Email Content Includes
- Visitor contact information (email, name)
- Inquiry type (job, collaboration, consulting, etc.)
- Original message from visitor
- **AI-generated professional summary** (key points, priority, recommendations)
- Conversation context (last 5 messages)
- Quick action buttons (Reply via Email, LinkedIn)
- Session tracking info

## Email Template Preview

```
┌─────────────────────────────────────┐
│ 🤖 Digital Twin Work Inquiry        │
│ New message from your AI portfolio  │
├─────────────────────────────────────┤
│                                     │
│ 📋 Inquiry Details                  │
│ From: John Doe                      │
│ Email: john@company.com             │
│ Type: Job Opportunity               │
│                                     │
│ 💬 Original Message                 │
│ "We're looking for a full-stack..." │
│                                     │
│ 🧠 AI-Generated Summary             │
│ [Professional analysis and context] │
│                                     │
│ 💭 Conversation Context             │
│ [Last 5 chat messages]              │
│                                     │
│ [📧 Reply via Email] [💼 LinkedIn]  │
└─────────────────────────────────────┘
```

## API Endpoint

**POST** `/api/notify`

**Request Body:**
```json
{
  "visitor_email": "john@company.com",
  "visitor_name": "John Doe",
  "inquiry_type": "job-opportunity",
  "message": "Your inquiry message...",
  "conversation_context": "user: ... assistant: ...",
  "session_id": "uuid-session-id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification sent successfully",
  "email_id": "resend-email-id"
}
```

## Inquiry Types
- `job-opportunity` - Full-time/part-time positions
- `collaboration` - Project partnerships
- `consulting` - Technical consulting requests
- `speaking` - Conference/event speaking
- `general` - Other professional inquiries

## Database Schema

```sql
CREATE TABLE inquiry_notifications (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255),
  visitor_email VARCHAR(255) NOT NULL,
  visitor_name VARCHAR(255),
  inquiry_type VARCHAR(100),
  message TEXT NOT NULL,
  conversation_context TEXT,
  email_sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resend_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Testing

### Test the Notification Feature
1. Start your dev server: `npm run dev`
2. Open the chat interface
3. Click "📧 Contact Louis" button
4. Fill out the form:
   - Email: test@example.com
   - Name: Test User
   - Type: Job Opportunity
   - Message: "Testing the notification system"
5. Click "Send Inquiry"
6. Check your NOTIFICATION_EMAIL inbox

### Development Mode
For development, you can:
- Use Resend's test mode (emails won't actually send but you can see the payload)
- Use your verified domain for testing
- Check console logs for email generation details

## Rate Limiting
- **3 notifications per email per hour**
- Prevents spam and abuse
- Resets after 1 hour window
- Returns 429 status if exceeded

## Analytics Queries

### View all inquiries
```sql
SELECT * FROM inquiry_notifications 
ORDER BY created_at DESC 
LIMIT 20;
```

### Count by inquiry type
```sql
SELECT inquiry_type, COUNT(*) 
FROM inquiry_notifications 
GROUP BY inquiry_type 
ORDER BY COUNT(*) DESC;
```

### Recent inquiries
```sql
SELECT visitor_name, visitor_email, inquiry_type, created_at
FROM inquiry_notifications 
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

## Troubleshooting

### Email not sending
1. Check RESEND_API_KEY is set correctly
2. Verify domain is verified in Resend dashboard
3. Check console logs for errors
4. Verify NOTIFICATION_EMAIL is set

### Database errors
1. Run `npx tsx scripts/create-notifications-table.ts`
2. Check DATABASE_URL is correct
3. Verify table exists: `SELECT * FROM inquiry_notifications LIMIT 1;`

### Rate limit issues
- Wait 1 hour for rate limit to reset
- Or clear in-memory rate limit by restarting server

## Future Enhancements
- [ ] Email templates for different inquiry types
- [ ] Slack/Discord webhook integration
- [ ] Dashboard to view all inquiries
- [ ] Auto-response emails to visitors
- [ ] Analytics and reporting
- [ ] CRM integration

## Security Notes
- Email addresses are not validated beyond basic format
- Rate limiting prevents abuse
- Conversation context is limited to last 5 messages
- No sensitive data should be in chat messages
- Database logs all inquiries for audit trail

---

**Ready to receive work inquiries!** 🚀
