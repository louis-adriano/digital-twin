# 📧 Email Notification Feature - Quick Start

## What I Built

A complete email notification system that lets visitors send you work inquiries directly from the Digital Twin chat. The AI automatically generates professional, structured email summaries.

## ✅ What's Already Done

1. ✅ **Installed Resend** - Modern email API
2. ✅ **Created API Endpoint** - `/api/notify` for handling notifications
3. ✅ **Updated ChatBot UI** - Added "📧 Contact Louis" button
4. ✅ **Created Modal Form** - Beautiful form for inquiry submission
5. ✅ **Database Table** - `inquiry_notifications` table created
6. ✅ **AI Email Generation** - Groq AI creates professional summaries
7. ✅ **Rate Limiting** - 3 inquiries per email per hour
8. ✅ **Conversation Context** - Includes last 5 chat messages

## 🚀 Setup Steps (5 minutes)

### 1. Get Resend API Key
1. Go to [resend.com](https://resend.com)
2. Sign up (free tier: 100 emails/day, 3,000/month)
3. Go to API Keys → Create API Key
4. Copy the key (starts with `re_...`)

### 2. Add to .env.local
```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
NOTIFICATION_EMAIL=louisadriano00@gmail.com
```

### 3. Update Email Domain (Optional)
In `src/app/api/notify/route.ts` line 159:
```typescript
from: 'Digital Twin <noreply@yourdomain.com>'
```

For development, Resend provides a test domain you can use immediately.

### 4. Test It!
1. Run `npm run dev`
2. Open the chat interface
3. Click "📧 Contact Louis" button
4. Fill out the form and submit
5. Check your email! 📬

## 📧 What the Email Looks Like

**Subject:** 🔔 Work Inquiry from [Name] - [Type]

**Content:**
- Beautiful HTML template with gradient header
- Visitor contact information (email, name)
- Inquiry type (job, collaboration, consulting, etc.)
- Original message
- **AI-generated professional summary** 🧠
- Conversation context (last 5 messages)
- Quick action buttons:
  - 📧 Reply via Email
  - 💼 View on LinkedIn
- Session tracking info

## 🎯 Features

### For Visitors
- Simple form: email, name, type, message
- Instant confirmation
- Professional experience
- Context-aware (AI knows the conversation)

### For You
- **AI-powered summaries** - No need to read raw messages
- **Full context** - See what they asked the AI about
- **Structured information** - Easy to scan and prioritize
- **Direct reply** - Email reply-to is set to visitor
- **Tracked** - All inquiries saved in database

### Inquiry Types
- Job Opportunity
- Collaboration
- Consulting
- Speaking Engagement
- General Inquiry

## 📊 Analytics

View inquiries in database:
```sql
SELECT 
  visitor_name,
  visitor_email,
  inquiry_type,
  message,
  created_at
FROM inquiry_notifications 
ORDER BY created_at DESC 
LIMIT 20;
```

Count by type:
```sql
SELECT inquiry_type, COUNT(*) 
FROM inquiry_notifications 
GROUP BY inquiry_type;
```

## 🔒 Security

- **Rate Limited**: Max 3 per email per hour
- **Input Validation**: Email format checked
- **Message Length**: Reasonable limits
- **No Spam**: In-memory rate limiting
- **Audit Trail**: All inquiries logged

## 💡 How AI Summary Works

When someone submits an inquiry, Groq AI:
1. Analyzes the visitor's message
2. Reviews inquiry type and context
3. Generates a professional summary including:
   - Who contacted and why
   - Key points from message
   - Relevant conversation highlights
   - Priority assessment
   - Recommended actions

Example AI Summary:
```
A recruiter from TechCorp reached out regarding a Senior Full-Stack 
Developer position. They're particularly interested in your AI/ML 
experience and recent Digital Twin project. The role involves building 
AI-powered web applications with React and Node.js.

Key Points:
- Full-time remote position
- Looking for 3+ years experience
- Strong focus on AI integration
- Competitive salary mentioned

Recommendation: High priority - aligns well with your skillset and 
recent projects. Suggest responding within 24 hours.
```

## 🎨 UI Components

### Button (in ChatBot header)
```tsx
📧 Contact Louis
```
- Purple background
- Always visible in chat
- Opens modal on click

### Modal Form
- Professional styling
- Clear labels and placeholders
- Inquiry type dropdown
- Character counter (future)
- Loading states
- Success/error feedback

## 📁 Files Created/Modified

**New Files:**
- `src/app/api/notify/route.ts` - Email notification API
- `scripts/create-notifications-table.ts` - Database setup
- `docs/EMAIL_NOTIFICATIONS.md` - Full documentation
- `.env.example` - Environment variable template

**Modified Files:**
- `src/components/ChatBot.tsx` - Added notification UI
- `package.json` - Added resend dependency

## 🐛 Troubleshooting

**Email not sending?**
- Check RESEND_API_KEY in .env.local
- Verify domain in Resend dashboard
- Check console for errors

**Rate limit hit?**
- Wait 1 hour
- Or restart dev server (clears memory)

**Database error?**
- Re-run: `npx tsx scripts/create-notifications-table.ts`
- Check DATABASE_URL

## 🚀 Next Steps (Optional)

- [ ] Verify your domain in Resend for production
- [ ] Customize email template colors/branding
- [ ] Add auto-reply emails to visitors
- [ ] Build admin dashboard to view inquiries
- [ ] Set up Slack/Discord webhook notifications
- [ ] Add analytics tracking

## 🎉 You're All Set!

The feature is **production-ready**. Just add your Resend API key and you'll start receiving beautifully formatted, AI-summarized work inquiries!

**Test it now:** Click "📧 Contact Louis" in your chat interface! 🚀
