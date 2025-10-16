'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

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
                // Remove typing indicator and add final message
                setChatMessages(prev => {
                  const filtered = prev.filter(msg => !msg.isTyping);
                  return [...filtered, {
                    id: Date.now() + 2,
                    content: accumulatedContent,
                    role: 'assistant' as const,
                    timestamp: new Date(),
                  }];
                });
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
    <div className="bg-white rounded-lg shadow-lg flex flex-col h-[600px]">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Ask My Digital Twin</h3>
            <div className="flex items-center space-x-2">
              <p className="text-sm text-gray-600">Chat with AI about my background</p>
              {sessionId && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Connected</span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowNotifyModal(true)}
              className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors flex items-center space-x-1"
              title="Send work inquiry to Louis"
            >
              <span>📧</span>
              <span>Contact Louis</span>
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
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 text-sm"
                title="Clear conversation"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {chatMessages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p className="mb-2">👋 Hello!</p>
            <p className="text-sm">Ask me about my experience, skills, or projects!</p>
          </div>
        ) : (
          <>
            {chatMessages.map((msg, index) => (
              <div key={msg.id || index} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-900 shadow-sm border'
                }`}>
                  <div className="text-xs font-semibold mb-1 opacity-75">
                    {msg.role === 'user' ? 'You' : 'Digital Twin'}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">
                    {msg.isTyping && !msg.content ? 'Thinking...' : msg.content}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Chat Input */}
      <form onSubmit={handleChatSubmit} className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask about my background..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={isLoading || !inputMessage.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>

      {/* Notification Modal */}
      {showNotifyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
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
              He'll receive an AI-generated summary with your conversation context.
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
          </div>
        </div>
      )}
    </div>
  );
}