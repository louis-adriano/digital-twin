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

export default function FloatingChat() {
  const [isChatOpen, setIsChatOpen] = useState(false);
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
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: "smooth",
        block: "end"
      });
    }
  };

  // Effect to scroll when messages change
  useEffect(() => {
    if (chatMessages.length > 0) {
      // Small delay to ensure DOM is updated
      setTimeout(scrollToBottom, 100);
    }
  }, [chatMessages]);

  // Effect to scroll when chat opens
  useEffect(() => {
    if (isChatOpen && chatMessages.length > 0) {
      setTimeout(scrollToBottom, 200);
    }
  }, [isChatOpen, chatMessages.length]);

  // Initialize or restore session when chat opens
  useEffect(() => {
    if (isChatOpen && !sessionId && !sessionLoading) {
      initializeSession();
    }
  }, [isChatOpen, sessionId, sessionLoading]);

  // Save messages to localStorage for backup
  useEffect(() => {
    if (sessionId && chatMessages.length > 0) {
      localStorage.setItem(`chat_messages_${sessionId}`, JSON.stringify(chatMessages));
    }
  }, [sessionId, chatMessages]);

  const initializeSession = useCallback(async () => {
    setSessionLoading(true);
    try {
      // Try to restore from localStorage first
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

  // Extract contact info from conversation
  const extractContactInfo = (latestMessage: string, messages: ChatMessage[]) => {
    const extracted: Partial<typeof notificationForm> = {};
    
    // Get ALL messages (both user and AI) for context
    const allMessages = messages.map(msg => msg.content).join(' ');
    const userMessages = messages
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content)
      .join(' ');
    
    console.log('Extracting info from:', { userMessages, latestMessage });
    
    // Extract email (look for email pattern in all messages)
    const emailMatch = allMessages.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    if (emailMatch) {
      extracted.email = emailMatch[0];
      console.log('Found email:', extracted.email);
    }
    
    // Extract name (look for "I'm [name]", "My name is [name]", or standalone names)
    const namePatterns = [
      /(?:i'm|i am|my name is|name's|this is|call me)\s+([a-z]+(?:\s+[a-z]+)?)/i,
      /^([a-z]+)(?:\s+[a-z]+)?(?:,|\s+here)/i,
      /\b([a-z]+\s+[a-z]+)\s*,\s*[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
    ];
    
    // Also check for standalone names (when user just types their name as a message)
    const individualMessages = messages.filter(msg => msg.role === 'user').map(msg => msg.content.trim());
    for (const msg of individualMessages) {
      // Check if message is just a name (2-4 words, letters only, short message)
      if (msg.length < 50 && /^[a-z]+(\s+[a-z]+){1,3}$/i.test(msg)) {
        const match = namePatterns[0].exec(userMessages);
        if (!match) {
          // This looks like a standalone name
          extracted.name = msg
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
          console.log('Found standalone name:', extracted.name);
          break;
        }
      }
    }
    
    // Try pattern matching if we haven't found a name yet
    if (!extracted.name) {
      for (const pattern of namePatterns) {
        const match = userMessages.match(pattern);
        if (match) {
          // Capitalize each word in the name
          extracted.name = match[1].trim()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
          console.log('Found name:', extracted.name);
          break;
        }
      }
    }
    
    // Determine inquiry type from keywords
    const lowerMessages = userMessages.toLowerCase();
    if (lowerMessages.includes('hire') || lowerMessages.includes('hiring') || lowerMessages.includes('job') || lowerMessages.includes('position')) {
      extracted.inquiryType = 'job-opportunity';
    } else if (lowerMessages.includes('freelance') || lowerMessages.includes('contract')) {
      extracted.inquiryType = 'freelance-project';
    } else if (lowerMessages.includes('collaborate') || lowerMessages.includes('collaboration') || lowerMessages.includes('partnership') || lowerMessages.includes('work together') || lowerMessages.includes('work with')) {
      extracted.inquiryType = 'collaboration';
    } else if (lowerMessages.includes('consult') || lowerMessages.includes('consulting') || lowerMessages.includes('advice')) {
      extracted.inquiryType = 'consulting';
    }
    
    // Extract project description - get the most relevant parts
    const sentences = userMessages.split(/[.!?]/).map(s => s.trim()).filter(Boolean);
    const relevantSentences = sentences.filter(sentence => {
      const lower = sentence.toLowerCase();
      return lower.includes('project') || lower.includes('build') || 
             lower.includes('need') || lower.includes('looking for') ||
             lower.includes('want') || lower.includes('app') ||
             lower.includes('website') || lower.includes('system');
    });
    
    if (relevantSentences.length > 0) {
      extracted.message = relevantSentences.join('. ') + '.';
      console.log('Found message:', extracted.message);
    } else {
      // Fallback: use the user's last few messages
      extracted.message = messages
        .filter(msg => msg.role === 'user')
        .slice(-3)
        .map(msg => msg.content)
        .join('. ');
    }
    
    console.log('Extracted info:', extracted);
    return extracted;
  };

  const loadChatHistory = async (sid: string) => {
    try {
      const response = await fetch(`/api/chat/session?sessionId=${sid}`);
      if (response.ok) {
        const data = await response.json();
        if (data.messages && data.messages.length > 0) {
          setChatMessages(data.messages);
        } else {
          // Fallback to localStorage if no server history
          const saved = localStorage.getItem(`chat_messages_${sid}`);
          if (saved) {
            const savedMessages = JSON.parse(saved);
            setChatMessages(savedMessages);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
      // Fallback to localStorage
      const saved = localStorage.getItem(`chat_messages_${sid}`);
      if (saved) {
        const savedMessages = JSON.parse(saved);
        setChatMessages(savedMessages);
      }
    }
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
        headers: { 'Content-Type': 'application/json' },
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
                // Check if AI wants to auto-send inquiry
                const shouldAutoSend = accumulatedContent.includes('[AUTO_SEND_INQUIRY]');
                const cleanedContent = accumulatedContent.replace('[AUTO_SEND_INQUIRY]', '').trim();
                
                setChatMessages(prev => {
                  const filtered = prev.filter(msg => !msg.isTyping);
                  return [...filtered, {
                    id: Date.now() + 2,
                    content: cleanedContent,
                    role: 'assistant' as const,
                    timestamp: new Date(),
                  }];
                });
                
                // Auto-send inquiry in background without showing form
                if (shouldAutoSend) {
                  setTimeout(async () => {
                    try {
                      // Get the complete message history including current messages
                      const allMessages = [...chatMessages, {
                        id: Date.now() + 2,
                        content: cleanedContent,
                        role: 'assistant' as const,
                        timestamp: new Date(),
                      }];
                      
                      // Extract info from conversation
                      const extractedInfo = extractContactInfo(cleanedContent, allMessages);
                      
                      console.log('Auto-sending inquiry with:', extractedInfo);
                      
                      // Get conversation context
                      const conversationContext = allMessages
                        .slice(-10)
                        .map(msg => `${msg.role}: ${msg.content}`)
                        .join('\n\n');

                      // Send email automatically in background
                      const response = await fetch('/api/notify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          visitor_email: extractedInfo.email || 'not-provided@temp.com',
                          visitor_name: extractedInfo.name || 'Anonymous',
                          inquiry_type: extractedInfo.inquiryType || 'general',
                          message: extractedInfo.message || 'Contact inquiry from chat',
                          conversation_context: conversationContext,
                          session_id: sessionId,
                        }),
                      });

                      if (response.ok) {
                        // Add a success message to chat
                        setChatMessages(prev => [...prev, {
                          id: Date.now() + 100,
                          content: '✅ Perfect! I\'ve sent your inquiry to Louis. He\'ll get back to you soon at ' + (extractedInfo.email || 'your email') + '!',
                          role: 'assistant' as const,
                          timestamp: new Date(),
                        }]);
                      } else {
                        setChatMessages(prev => [...prev, {
                          id: Date.now() + 100,
                          content: '⚠️ I had trouble sending the email automatically. Could you try using the Contact button above?',
                          role: 'assistant' as const,
                          timestamp: new Date(),
                        }]);
                      }
                    } catch (error) {
                      console.error('Auto-send error:', error);
                      setChatMessages(prev => [...prev, {
                        id: Date.now() + 100,
                        content: '⚠️ I encountered an issue sending the inquiry. Please use the Contact button to send it manually.',
                        role: 'assistant' as const,
                        timestamp: new Date(),
                      }]);
                    }
                  }, 1000);
                }
                break;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  accumulatedContent += parsed.content;
                  // Don't update messages during streaming - wait for [DONE]
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = inputMessage.trim();
    if (!trimmedMessage || isLoading) return;
    if (trimmedMessage.length > 1000) {
      alert('Message too long (max 1000 characters)');
      return;
    }
    sendMessage(trimmedMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
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
    <>
      {/* Floating Chat Button - Fixed bottom right */}
      <AnimatePresence>
      {!isChatOpen && (
        <motion.div
          className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50 flex items-center gap-2 sm:gap-3"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ 
              opacity: [0, 0, 0, 1, 1, 0],
              x: [10, 10, 10, 0, 0, 10]
            }}
            transition={{
              duration: 3.6,
              times: [0, 0.17, 0.19, 0.25, 0.9, 1],
              repeat: Infinity,
              repeatDelay: 26.4
            }}
            className="relative bg-background border border-border px-2 py-1 sm:px-3 sm:py-1.5 rounded-2xl shadow-lg whitespace-nowrap"
          >
            <span className="text-[0.65rem] sm:text-xs font-sans text-foreground">Got a question?</span>
            {/* Chat bubble tail */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[7px] w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[8px] border-l-border" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[6px] w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[7px] border-l-background" />
          </motion.div>

          {/* Button */}
          <motion.button
            animate={{ 
              y: [0, -10, 0],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              repeatDelay: 29.4,
              ease: "easeInOut"
            }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            data-chat-trigger="true"
            onClick={() => setIsChatOpen(true)}
            className="bg-primary text-primary-foreground w-12 h-12 sm:w-16 sm:h-16 rounded-full shadow-2xl flex items-center justify-center text-2xl"
            title="Chat with my AI twin"
          >
            <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </motion.button>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Large Centered Chat Window */}
      <AnimatePresence>
      {isChatOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 flex items-center justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-sm z-[100]"
          onClick={() => setIsChatOpen(false)}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl h-full sm:h-[80vh] bg-background border-0 sm:border border-border shadow-2xl flex flex-col"
          >
            {/* Chat Header */}
            <div className="flex justify-between items-center px-4 py-4 sm:px-6 sm:py-5 bg-gradient-to-r from-primary to-[#3d6149] flex-shrink-0">
              <div>
                <h3 className="font-serif italic text-lg sm:text-xl font-light text-primary-foreground">Ask Cloud</h3>
                <div className="flex items-center gap-2 mt-1">
                  <motion.div 
                    initial={{ backgroundColor: '#ef4444' }}
                    animate={{ backgroundColor: sessionId ? '#4ade80' : '#ef4444' }}
                    transition={{ duration: 0.5 }}
                    className="w-2 h-2 rounded-full shadow-lg"
                    style={{ 
                      boxShadow: sessionId ? '0 0 10px rgba(74, 222, 128, 0.5)' : '0 0 10px rgba(239, 68, 68, 0.5)'
                    }}
                  />
                  <span className="text-xs sm:text-sm text-primary-foreground/80 font-sans">Chat with AI about Louis&apos; work</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-2 hover:bg-primary-foreground/10 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Chat Messages */}
            <div 
              ref={chatContainerRef}
              className="flex-1 p-4 sm:p-6 overflow-y-auto bg-[#ebe6da] min-h-0"
              style={{ scrollBehavior: 'smooth' }}
            >
              {chatMessages.length === 0 ? (
                <div className="text-center py-8 sm:py-16">
                  <div className="mb-6 sm:mb-8">
                    <motion.div 
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                      <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </motion.div>
                    <motion.h4 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                      className="font-serif italic text-xl sm:text-2xl text-foreground mb-2 font-light"
                    >
                      Hello! I&apos;m Cloud
                    </motion.h4>
                    <motion.p 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                      className="text-muted-foreground font-sans"
                    >
                      Louis&apos; AI assistant - Ask me anything about his experience, skills, or projects!
                    </motion.p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 max-w-2xl mx-auto">
                    {[
                      "What's your experience with React?",
                      "Tell me about your AI projects",
                      "I'd like to work with you",
                      "What are your strongest skills?"
                    ].map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setInputMessage(suggestion);
                          sendMessage(suggestion);
                        }}
                        className="p-2 sm:p-3 text-left text-xs sm:text-sm border border-border hover:border-primary hover:bg-background transition-all font-sans rounded-lg"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence initial={false} mode="popLayout">
                  {chatMessages.map((msg, index) => (
                    <motion.div 
                      key={msg.id || index}
                      initial={{ 
                        opacity: 0, 
                        y: 20,
                        scale: 0.95
                      }}
                      animate={{ 
                        opacity: 1, 
                        y: 0,
                        scale: 1
                      }}
                      transition={{ 
                        duration: 0.4,
                        ease: [0.25, 0.46, 0.45, 0.94]
                      }}
                      layout
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%]`}>
                        {/* Message bubble */}
                        <div className="flex flex-col gap-1.5">
                          <div className={`px-4 py-3 rounded-2xl font-sans text-[0.92rem] sm:text-[0.95rem] leading-relaxed shadow-md ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground rounded-br-sm'
                              : 'bg-background text-foreground rounded-bl-sm'
                          }`}>
                            {msg.isTyping && !msg.content ? (
                              <div className="flex gap-1.5 py-1">
                                <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                              </div>
                            ) : (
                              <div className="whitespace-pre-wrap">{msg.content}</div>
                            )}
                          </div>
                          <span className={`text-xs text-muted-foreground px-2 font-sans ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  </AnimatePresence>
                  <div ref={messagesEndRef} className="h-1" />
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-3 sm:p-5 border-t border-border bg-background flex-shrink-0">
              <form onSubmit={handleSubmit}>
                <div className="flex gap-2 sm:gap-3 items-end">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 sm:px-4 sm:py-3 border border-border rounded-2xl bg-[#ebe6da] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-sans resize-none text-sm sm:text-base"
                    rows={1}
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !inputMessage.trim()}
                    className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-primary text-primary-foreground rounded-full hover:bg-[#3d6149] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100 disabled:hover:shadow-lg"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 font-sans">Press Enter to send, Shift+Enter for new line</p>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Notification Modal */}
      <AnimatePresence>
      {showNotifyModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-background/90 backdrop-blur-md flex items-center justify-center z-[110] p-2 sm:p-4"
          onClick={() => setShowNotifyModal(false)}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="bg-background max-w-lg w-full border border-border shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto"
          >
            <div className="bg-primary p-5 sm:p-8 text-primary-foreground">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <h3 className="font-serif italic text-2xl sm:text-3xl font-light">Get in Touch</h3>
                  </div>
                  <p className="text-primary-foreground opacity-85 font-sans text-sm">Send a direct inquiry to Louis</p>
                </div>
                <button
                  onClick={() => setShowNotifyModal(false)}
                  className="text-primary-foreground opacity-70 hover:opacity-100 transition-colors p-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-8">
              <div className="bg-secondary border-l-4 border-primary p-4 mb-6">
                <p className="text-sm text-foreground font-sans leading-relaxed opacity-80">
                  ✨ Louis will receive an AI-generated summary with our conversation context
                </p>
              </div>

              <form onSubmit={handleSendNotification} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 font-sans">
                    Email Address <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={notificationForm.email}
                    onChange={(e) => setNotificationForm({ ...notificationForm, email: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-[4px] bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-sans transition-all"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 font-sans">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={notificationForm.name}
                    onChange={(e) => setNotificationForm({ ...notificationForm, name: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-[4px] bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-sans transition-all"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 font-sans">
                    Inquiry Type
                  </label>
                  <select
                    value={notificationForm.inquiryType}
                    onChange={(e) => setNotificationForm({ ...notificationForm, inquiryType: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-[4px] bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-sans transition-all"
                  >
                    <option value="job-opportunity">Job Opportunity</option>
                    <option value="collaboration">Collaboration</option>
                    <option value="consulting">Consulting</option>
                    <option value="freelance-project">Freelance Project</option>
                    <option value="general">General Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 font-sans">
                    Message <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    required
                    value={notificationForm.message}
                    onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-[4px] bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent h-32 resize-none font-sans transition-all"
                    placeholder="Tell Louis about your project or inquiry..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNotifyModal(false)}
                    className="flex-1 px-6 py-3 border-2 border-foreground text-foreground hover:bg-foreground hover:text-background transition-all font-sans font-medium rounded-[30px]"
                    disabled={isSendingNotification}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-primary text-primary-foreground hover:bg-[#3d6149] transition-all font-sans font-medium rounded-[30px] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    disabled={isSendingNotification}
                  >
                    {isSendingNotification ? (
                      <span className="flex items-center justify-center space-x-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Sending...</span>
                      </span>
                    ) : 'Send Inquiry'}
                  </button>
                </div>
              </form>

              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-xs text-muted-foreground font-sans flex items-start space-x-2">
                  <span className="text-sm">💡</span>
                  <span>Your conversation history will be included to provide Louis with full context.</span>
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </>
  );
}