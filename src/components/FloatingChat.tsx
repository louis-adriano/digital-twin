'use client';

import { useState, useEffect, useRef } from 'react';

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
  }, [isChatOpen]);

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
                  setChatMessages(prev => 
                    prev.map(msg => 
                      msg.isTyping 
                        ? { ...msg, content: accumulatedContent + '▋' }
                        : msg
                    )
                  );
                }
              } catch (e) {
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

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Large Centered Chat Window */}
      {isChatOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm z-40">
          <div className="w-full max-w-4xl h-[80vh] bg-background border border-border shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-300">
            {/* Chat Header */}
            <div className="flex justify-between items-center p-6 border-b border-border bg-card flex-shrink-0">
              <div>
                <h3 className="font-serif text-2xl font-semibold text-foreground">Ask My Digital Twin</h3>
                <p className="text-sm text-muted-foreground font-sans mt-1">Chat with AI about my background</p>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
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
                    <h4 className="font-serif text-xl text-foreground mb-2">Hello! I'm Louis's Digital Twin</h4>
                    <p className="text-muted-foreground font-sans">Ask me anything about my experience, skills, or projects!</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                    {[
                      "What's your experience with React?",
                      "Tell me about your AI projects",
                      "What are your strongest skills?",
                      "How did you get into web development?"
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
                          {msg.role === 'user' ? 'You' : 'Digital Twin'}
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
    </div>
  );
}