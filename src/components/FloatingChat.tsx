'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

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
    
    // Extract name (look for "I'm [name]", "My name is [name]", or just capitalized names)
    const namePatterns = [
      /(?:i'm|i am|my name is|name's|this is|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
      /^([A-Z][a-z]+)(?:\s+[A-Z][a-z]+)?(?:,|\s+here)/i,
    ];
    
    for (const pattern of namePatterns) {
      const match = userMessages.match(pattern);
      if (match) {
        extracted.name = match[1].trim();
        console.log('Found name:', extracted.name);
        break;
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
                      // Extract info from conversation
                      const extractedInfo = extractContactInfo(cleanedContent, chatMessages);
                      
                      console.log('Auto-sending inquiry with:', extractedInfo);
                      
                      // Get conversation context
                      const conversationContext = chatMessages
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
    <div className="fixed bottom-6 right-6 z-50">
      {/* Large Centered Chat Window */}
      {isChatOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm z-40">
          <div className="w-full max-w-4xl h-[80vh] bg-background border border-border shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-300">
            {/* Chat Header */}
            <div className="flex justify-between items-center p-6 border-b border-border bg-card flex-shrink-0">
              <div>
                <h3 className="font-serif text-2xl font-semibold text-foreground">Ask Cloud</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-sm text-muted-foreground font-sans">Chat with AI about Louis' work</p>
                  {sessionId && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Connected</span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
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
                    className="text-muted-foreground hover:text-foreground transition-colors p-1.5 text-sm"
                    title="Clear conversation"
                  >
                    🗑️
                  </button>
                )}
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Chat Messages */}
            <div 
              ref={chatContainerRef}
              className="flex-1 p-6 overflow-y-auto bg-background min-h-0"
              style={{ scrollBehavior: 'smooth' }}
            >
              {chatMessages.length === 0 ? (
                <div className="text-center py-16">
                  <div className="mb-8">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">👋</span>
                    </div>
                    <h4 className="font-serif text-xl text-foreground mb-2">Hello! I&apos;m Cloud</h4>
                    <p className="text-muted-foreground font-sans">Louis&apos; AI assistant - Ask me anything about his experience, skills, or projects!</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
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
                          // Auto-send the suggestion
                          sendMessage(suggestion);
                        }}
                        className="p-3 text-left text-sm border border-border hover:border-foreground hover:bg-card transition-colors font-sans"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {chatMessages.map((msg, index) => (
                    <div key={msg.id || index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-5 py-4 font-sans shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-foreground text-background rounded-[20px] rounded-br-[4px] ml-12' 
                          : 'bg-card text-foreground border border-border rounded-[20px] rounded-bl-[4px] mr-12'
                      }`}>
                        <div className={`text-[10px] font-medium mb-2 opacity-60 uppercase tracking-wider ${
                          msg.role === 'user' ? 'text-background/70' : 'text-muted-foreground'
                        }`}>
                          {msg.role === 'user' ? 'You' : 'Cloud'}
                        </div>
                        <div className="whitespace-pre-wrap leading-relaxed text-sm">
                          {msg.isTyping && !msg.content ? (
                            <div className="flex items-center space-x-1">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                              </div>
                              <span className="ml-2 opacity-60">Thinking...</span>
                            </div>
                          ) : msg.content}
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Invisible div to scroll to */}
                  <div ref={messagesEndRef} className="h-1" />
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-6 border-t border-border bg-card flex-shrink-0">
              <form onSubmit={handleSubmit}>
                <div className="flex space-x-4">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me about my experience, skills, projects, or anything else..."
                    className="flex-1 px-4 py-3 border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground focus:border-transparent font-sans resize-none"
                    rows={2}
                    disabled={isLoading}
                  />
                  <button 
                    type="submit" 
                    disabled={isLoading || !inputMessage.trim()}
                    className="bg-foreground text-background hover:bg-secondary disabled:bg-muted disabled:cursor-not-allowed px-6 py-3 font-sans font-medium transition-colors self-end"
                  >
                    {isLoading ? 'Sending...' : 'Send'}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 font-sans">Press Enter to send, Shift+Enter for new line</p>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Floating Chat Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="w-14 h-14 bg-foreground text-background shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
        style={{ borderRadius: '50%' }}
      >
        {isChatOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg
            className="w-6 h-6 transition-transform duration-300 group-hover:scale-110"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        )}
      </button>

      {/* Notification Modal */}
      {showNotifyModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="bg-gradient-to-br from-gray-900 to-black p-8 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">💬</span>
                    <h3 className="font-serif text-3xl font-bold">Get in Touch</h3>
                  </div>
                  <p className="text-gray-300 font-sans text-sm">Send a direct inquiry to Louis</p>
                </div>
                <button
                  onClick={() => setShowNotifyModal(false)}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                <p className="text-sm text-blue-900 font-sans leading-relaxed">
                  ✨ Louis will receive an AI-generated summary with our conversation context
                </p>
              </div>

              <form onSubmit={handleSendNotification} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 font-sans">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={notificationForm.email}
                    onChange={(e) => setNotificationForm({ ...notificationForm, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans transition-all"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 font-sans">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={notificationForm.name}
                    onChange={(e) => setNotificationForm({ ...notificationForm, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans transition-all"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 font-sans">
                    Inquiry Type
                  </label>
                  <select
                    value={notificationForm.inquiryType}
                    onChange={(e) => setNotificationForm({ ...notificationForm, inquiryType: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans transition-all"
                  >
                    <option value="job-opportunity">💼 Job Opportunity</option>
                    <option value="collaboration">🤝 Collaboration</option>
                    <option value="consulting">💡 Consulting</option>
                    <option value="freelance-project">🚀 Freelance Project</option>
                    <option value="general">📬 General Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 font-sans">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={notificationForm.message}
                    onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none font-sans transition-all"
                    placeholder="Tell Louis about your project or inquiry..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNotifyModal(false)}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all font-sans font-semibold rounded-lg"
                    disabled={isSendingNotification}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition-all font-sans font-semibold rounded-lg shadow-lg shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
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

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-600 font-sans flex items-start space-x-2">
                  <span className="text-sm">💡</span>
                  <span>Your conversation history will be included to provide Louis with full context.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}