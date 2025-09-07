'use client';

import { useState } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Handle chat submission
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || chatLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: inputMessage };
    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputMessage }),
      });

      if (!response.ok) {
        throw new Error('Failed to get chat response');
      }

      const data = await response.json();
      const assistantMessage: ChatMessage = { role: 'assistant', content: data.response };
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: ChatMessage = { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Digital Twin Chat</h1>
      
      {/* Chat Interface */}
      <div style={{ 
        border: '1px solid #ccc', 
        borderRadius: '10px', 
        flex: 1,
        display: 'flex', 
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 120px)'
      }}>
        {/* Chat Messages */}
        <div style={{ 
          flex: 1, 
          padding: '20px', 
          overflowY: 'auto', 
          backgroundColor: '#f9f9f9' 
        }}>
          {chatMessages.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#666', 
              fontSize: '18px',
              marginTop: '50px'
            }}>
              <p>👋 Hello! I'm your digital twin assistant.</p>
              <p>Ask me anything about my professional background, skills, or projects!</p>
            </div>
          ) : (
            chatMessages.map((msg, index) => (
              <div key={index} style={{ 
                marginBottom: '15px', 
                padding: '12px', 
                borderRadius: '10px',
                backgroundColor: msg.role === 'user' ? '#007cba' : '#ffffff',
                color: msg.role === 'user' ? 'white' : 'black',
                marginLeft: msg.role === 'user' ? '20%' : '0',
                marginRight: msg.role === 'user' ? '0' : '20%',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
                  {msg.role === 'user' ? 'You' : 'Digital Twin'}
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
              </div>
            ))
          )}
          {chatLoading && (
            <div style={{ 
              padding: '12px', 
              fontStyle: 'italic', 
              color: '#666',
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              marginRight: '20%',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
                Digital Twin
              </div>
              Thinking...
            </div>
          )}
        </div>

        {/* Chat Input */}
        <form onSubmit={handleChatSubmit} style={{ 
          padding: '20px', 
          borderTop: '1px solid #ccc',
          display: 'flex',
          gap: '10px',
          backgroundColor: 'white',
          borderBottomLeftRadius: '10px',
          borderBottomRightRadius: '10px'
        }}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask about my experience, skills, projects..."
            style={{ 
              flex: 1, 
              padding: '12px', 
              border: '1px solid #ccc', 
              borderRadius: '25px',
              fontSize: '16px',
              outline: 'none'
            }}
            disabled={chatLoading}
          />
          <button 
            type="submit" 
            disabled={chatLoading || !inputMessage.trim()}
            style={{ 
              padding: '12px 24px', 
              backgroundColor: '#007cba', 
              color: 'white', 
              border: 'none', 
              borderRadius: '25px',
              cursor: chatLoading ? 'not-allowed' : 'pointer',
              opacity: chatLoading || !inputMessage.trim() ? 0.6 : 1,
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
