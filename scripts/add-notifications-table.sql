-- Add inquiry_notifications table for tracking work inquiries
CREATE TABLE IF NOT EXISTS inquiry_notifications (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255),
  visitor_email VARCHAR(255) NOT NULL,
  visitor_name VARCHAR(255),
  inquiry_type VARCHAR(100),
  message TEXT NOT NULL,
  conversation_context TEXT,
  email_sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resend_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for efficient querying
  INDEX idx_session_id (session_id),
  INDEX idx_visitor_email (visitor_email),
  INDEX idx_email_sent_at (email_sent_at)
);

-- Add comment for documentation
COMMENT ON TABLE inquiry_notifications IS 'Tracks work inquiries sent from the Digital Twin AI to Louis';
