'use client';

import { useState, useEffect, useRef } from 'react';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

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
        body: JSON.stringify({ message }),
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

  return (
    <div className="bg-white rounded-lg shadow-lg flex flex-col h-[600px]">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Ask My Digital Twin</h3>
        <p className="text-sm text-gray-600">Chat with AI about my background</p>
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
    </div>
  );
}