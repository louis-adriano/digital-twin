'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

export default function ChatBot() {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    email: '',
    name: '',
    inquiryType: 'job-opportunity',
    message: '',
  });
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Initialize session on component mount
  useEffect(() => {
    if (!sessionId && !sessionLoading) {
      initializeSession();
    }
  }, [sessionId, sessionLoading]);

  // Save messages to localStorage for backup
  useEffect(() => {
    if (sessionId && chatMessages.length > 0) {
      localStorage.setItem(`chat_messages_${sessionId}`, JSON.stringify(chatMessages));
    }
  }, [sessionId, chatMessages]);

  const initializeSession = useCallback(async () => {
    setSessionLoading(true);
    try {
      const savedSessionId = localStorage.getItem('chat_session_id');
      
      const response = await fetch('/api/chat/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: savedSessionId }),
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.sessionId);
        localStorage.setItem('chat_session_id', data.sessionId);
        
        // Load conversation history
        await loadChatHistory(data.sessionId);
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
    } finally {
      setSessionLoading(false);
    }
  }, []);

  const loadChatHistory = async (sid: string) => {
    try {
      const response = await fetch(`/api/chat/session?sessionId=${sid}`);
      if (response.ok) {
        const data = await response.json();
        if (data.messages && data.messages.length > 0) {
          setChatMessages(data.messages);
        }
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedMessage = inputMessage.trim();
    
    // Client-side validation
    if (!trimmedMessage || isLoading) return;
    
    if (trimmedMessage.length > 1000) {
      alert('Message too long (max 1000 characters)');
      return;
    }

    sendMessage(trimmedMessage);
  };

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now(),
      content: message,
      role: 'user',
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Add typing indicator
      const typingMessage: ChatMessage = {
        id: Date.now() + 1,
        content: '',
        role: 'assistant',
        timestamp: new Date(),
        isTyping: true,
      };
      setChatMessages(prev => [...prev, typingMessage]);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, sessionId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

              for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                // Check if the response contains the auto-send marker
                const hasAutoSendMarker = accumulatedContent.includes('[AUTO_SEND_INQUIRY]');
                
                // Remove the marker from the displayed content
                const cleanContent = accumulatedContent.replace('[AUTO_SEND_INQUIRY]', '').trim();
                
                // Remove typing indicator and add final message
                setChatMessages(prev => {
                  const filtered = prev.filter(msg => !msg.isTyping);
                  return [...filtered, {
                    id: Date.now() + 2,
                    content: cleanContent,
                    role: 'assistant' as const,
                    timestamp: new Date(),
                  }];
                });
                
                // If auto-send marker detected, trigger email notification automatically
                if (hasAutoSendMarker) {
                  console.log('🤖 Auto-send inquiry marker detected, sending email...');
                  handleAutoSendInquiry(message, cleanContent);
                }
                break;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  accumulatedContent += parsed.content;
                  // Update the typing message with accumulated content
                  setChatMessages(prev => 
                    prev.map(msg => 
                      msg.isTyping 
                        ? { ...msg, content: accumulatedContent + '▋' }
                        : msg
                    )
                  );
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove typing indicator if it exists
      setChatMessages(prev => prev.filter(msg => !msg.isTyping));
      setChatMessages(prev => [...prev, {
        id: Date.now() + 3,
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Please try again.'}`,
        role: 'assistant' as const,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoSendInquiry = async (userMessage: string, aiResponse: string) => {
    try {
      // Extract email from conversation history
      const allMessages = [...chatMessages, { content: userMessage, role: 'user' as const }];
      const conversationText = allMessages.map(msg => msg.content).join(' ');
      
      // Extract email using regex
      const emailMatch = conversationText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
      const visitorEmail = emailMatch ? emailMatch[0] : '';
      
      // Extract name - look for "I'm [name]" or "My name is [name]" patterns
      const nameMatch = conversationText.match(/(?:I'm|I am|my name is|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
      const visitorName = nameMatch ? nameMatch[1] : '';
      
      if (!visitorEmail) {
        console.error('Could not extract email from conversation');
        return;
      }

      // Get conversation context (last 10 messages for better context)
      const conversationContext = allMessages
        .slice(-10)
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n\n');

      const response = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitor_email: visitorEmail,
          visitor_name: visitorName,
          inquiry_type: 'ai-assisted-inquiry',
          message: userMessage,
          conversation_context: conversationContext,
          session_id: sessionId,
        }),
      });

      if (response.ok) {
        console.log('✅ Auto-inquiry sent successfully');
        // Add a confirmation message to chat
        setChatMessages(prev => [...prev, {
          id: Date.now() + 100,
          content: '✅ Email sent to Louis! He\'ll get back to you soon.',
          role: 'assistant' as const,
          timestamp: new Date(),
        }]);
      } else {
        const error = await response.json();
        console.error('Failed to auto-send inquiry:', error);
      }
    } catch (error) {
      console.error('Error in auto-send:', error);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!notificationForm.email || !notificationForm.message) {
      alert('Please fill in your email and message');
      return;
    }

    setIsSendingNotification(true);

    try {
      // Get conversation context (last 5 messages)
      const conversationContext = chatMessages
        .slice(-5)
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n\n');

      const response = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitor_email: notificationForm.email,
          visitor_name: notificationForm.name,
          inquiry_type: notificationForm.inquiryType,
          message: notificationForm.message,
          conversation_context: conversationContext,
          session_id: sessionId,
        }),
      });

      if (response.ok) {
        alert('✅ Your inquiry has been sent! Louis will get back to you soon.');
        setShowNotifyModal(false);
        setNotificationForm({
          email: '',
          name: '',
          inquiryType: 'job-opportunity',
          message: '',
        });
      } else {
        const error = await response.json();
        alert(`Failed to send inquiry: ${error.error}`);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send inquiry. Please try again or email directly.');
    } finally {
      setIsSendingNotification(false);
    }
  };

  return (
    <div className="bg-[#f5f1e8] rounded-xl shadow-2xl flex flex-col h-[600px] border border-border">
      {/* Chat Header */}
      <div className="px-5 py-4 bg-primary border-b border-primary-foreground/20">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <span className="text-xl">🤖</span>
            </div>
            <div>
              <h3 className="font-serif italic text-base text-primary-foreground font-light">Digital Twin</h3>
              <div className="flex items-center gap-2">
                {sessionId && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                    <span className="text-xs text-primary-foreground/80 font-sans">Online</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNotifyModal(true)}
              className="p-2 hover:bg-primary-foreground/10 rounded-lg transition-colors"
              title="Send work inquiry to Louis"
            >
              <svg className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>
            {chatMessages.length > 0 && (
              <button
                onClick={() => {
                  setChatMessages([]);
                  if (sessionId) {
                    localStorage.removeItem(`chat_messages_${sessionId}`);
                    localStorage.removeItem('chat_session_id');
                    setSessionId(null);
                  }
                }}
                className="p-2 hover:bg-primary-foreground/10 rounded-lg transition-colors"
                title="Clear conversation"
              >
                <svg className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-[#ebe6da]">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4"
            >
              <span className="text-3xl">👋</span>
            </motion.div>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-foreground font-serif italic text-lg mb-2"
            >
              Hello! I&apos;m Louis&apos;s Digital Twin
            </motion.p>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="text-sm text-muted-foreground font-sans max-w-xs"
            >
              Ask me about experience, skills, projects, or anything else!
            </motion.p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence initial={false}>
            {chatMessages.map((msg, index) => (
              <motion.div 
                key={msg.id || index}
                initial={{ 
                  opacity: 0, 
                  x: msg.role === 'user' ? 50 : -50,
                  scale: 0.8
                }}
                animate={{ 
                  opacity: 1, 
                  x: 0,
                  scale: 1
                }}
                exit={{ 
                  opacity: 0, 
                  scale: 0.8,
                  transition: { duration: 0.2 }
                }}
                transition={{ 
                  duration: 0.3,
                  ease: "easeOut"
                }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background border border-border'
                  }`}>
                    <span className="text-sm">{msg.role === 'user' ? '👤' : '🤖'}</span>
                  </div>
                  
                  {/* Message bubble */}
                  <div className="flex flex-col gap-1">
                    <div className={`px-4 py-2.5 rounded-2xl font-sans text-[0.95rem] leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground rounded-br-sm' 
                        : 'bg-background text-foreground border border-border rounded-bl-sm shadow-sm'
                    }`}>
                      {msg.isTyping && !msg.content ? (
                        <div className="flex gap-1.5 py-1">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      )}
                    </div>
                    <span className={`text-xs text-muted-foreground px-1 font-sans ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Chat Input */}
      <form onSubmit={handleChatSubmit} className="p-4 bg-background border-t border-border">
        <div className="flex gap-2 items-end">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 bg-[#ebe6da] border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-sans text-sm placeholder:text-muted-foreground"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={isLoading || !inputMessage.trim()}
            className="flex-shrink-0 w-11 h-11 bg-primary text-primary-foreground rounded-full hover:bg-[#3d6149] focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-md hover:shadow-lg disabled:hover:shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>

      {/* Notification Modal */}
      <AnimatePresence>
      {showNotifyModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowNotifyModal(false)}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">📧 Send Work Inquiry to Louis</h3>
              <button
                onClick={() => setShowNotifyModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Send a direct inquiry to Louis about job opportunities, collaborations, or consulting. 
              He&apos;ll receive an AI-generated summary with your conversation context.
            </p>

            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={notificationForm.email}
                  onChange={(e) => setNotificationForm({ ...notificationForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  value={notificationForm.name}
                  onChange={(e) => setNotificationForm({ ...notificationForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inquiry Type
                </label>
                <select
                  value={notificationForm.inquiryType}
                  onChange={(e) => setNotificationForm({ ...notificationForm, inquiryType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="job-opportunity">Job Opportunity</option>
                  <option value="collaboration">Collaboration</option>
                  <option value="consulting">Consulting</option>
                  <option value="speaking">Speaking Engagement</option>
                  <option value="general">General Inquiry</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={notificationForm.message}
                  onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 h-24 resize-none"
                  placeholder="Tell Louis about your inquiry..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNotifyModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  disabled={isSendingNotification}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                  disabled={isSendingNotification}
                >
                  {isSendingNotification ? 'Sending...' : 'Send Inquiry'}
                </button>
              </div>
            </form>

            <p className="text-xs text-gray-500 mt-4">
              💡 Your conversation history with the AI will be included to give Louis context.
            </p>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}