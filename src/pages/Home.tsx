import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import ChatBubble from '../components/ChatBubble';
import ChatInput from '../components/ChatInput';

interface AiOption {
  value: string;
  label: string;
}

interface Message {
  id: number;
  from: 'user' | 'ai';
  text: string;
  options?: AiOption[];
}

const getOrCreateSessionId = () => {
  const existing = localStorage.getItem('tenant_session_id');
  if (existing) return existing;

  const newId = `sess_${Math.random().toString(36).slice(2)}_${Date.now()}`;
  localStorage.setItem('tenant_session_id', newId);
  return newId;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      from: 'ai',
      text: 'Welcome! I am your Tenant Assistant. How can I help you today?',
    },
  ]);
  const [messageIdCounter, setMessageIdCounter] = useState(2);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [selectedOptions, setSelectedOptions] = useState<Record<number, string>>({});

  const parseAiOptions = (text: string): AiOption[] => {
    const lower = text.toLowerCase();

    // Never turn Diagnosis Summary messages into clickable bubbles
    if (lower.includes('diagnosis summary')) {
      return [];
    }

    const asksToSelect = /please\s+(select|choose)/i.test(text);
    const hasQuestion = text.includes('?');

    // Only parse when it's clearly a question/choice prompt
    if (!asksToSelect && !hasQuestion) {
      return [];
    }

    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => /^\d+[\).]/.test(line))
      .map((line) => {
        const match = line.match(/^(\d+)[\).]\s*(.*)$/);
        if (!match) return null;
        const [, value, label] = match;
        return {
          value,
          label: label || value,
        };
      })
      .filter((opt): opt is AiOption => opt !== null);
  };

  useEffect(() => {
    const storedPhone = localStorage.getItem('tenant_phone');
    if (!storedPhone) {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    const userId = messageIdCounter;
    const aiId = messageIdCounter + 1;

    const userMessage: Message = {
      id: userId,
      from: 'user',
      text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessageIdCounter((prev) => prev + 2);

    let aiText: string | null = null;

    try {
      const tenantName = localStorage.getItem('tenant_name');
      const tenantPhone = localStorage.getItem('tenant_phone');
      const tenantUnitId = localStorage.getItem('tenant_unit_id');
      const sessionId = getOrCreateSessionId();

      const payload: any = {
        message: text,
        fullName: tenantName,
        phoneNumber: tenantPhone,
        sessionId,
      };

      // Include unit_id if available
      if (tenantUnitId) {
        payload.unitId = tenantUnitId;
        console.log('Including unit_id in webhook payload:', tenantUnitId);
      } else {
        console.warn('No unit_id found in localStorage');
      }

      console.log('Webhook payload:', payload);

      const response = await fetch(
        'https://primary-production-320b8.up.railway.app/webhook/48eb8ab2-d760-41f9-bb01-35bf4eda8028/chat',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error('Webhook request failed');
      }

      const data = await response.json().catch(() => null);

      // Normalize potential error responses from webhook
      let isErrorResponse = false;

      if (data) {
        if (Array.isArray(data) && data.length > 0) {
          const first = data[0] as any;
          if (first && (first.Error === 'Error' || first.error === 'Error')) {
            isErrorResponse = true;
          }
        } else if (
          (data as any).Error === 'Error' ||
          (data as any).error === 'Error'
        ) {
          isErrorResponse = true;
        }
      }

      if (isErrorResponse) {
        aiText =
          'It looks like you are not using your registered tenant email. Please log in with your tenant email and try again.';
      } else {
        aiText =
          (data &&
            ((data as any).output ||
              (data as any).reply ||
              (data as any).message ||
              (data as any).text)) ||
          null;
      }
    } catch (error) {
      console.error('Failed to get response from chat webhook', error);
    }

    if (!aiText) {
      aiText = 'Sorry, I was unable to get a response. Please try again.';
    }

    const aiMessage: Message = {
      id: aiId,
      from: 'ai',
      text: aiText,
      options: parseAiOptions(aiText),
    };

    setMessages((prev) => [...prev, aiMessage]);
  };

  const handleOptionClick = (messageId: number, value: string) => {
    // remember which option was chosen for this AI message
    setSelectedOptions((prev) => ({ ...prev, [messageId]: value }));

    // Treat clicking an option as sending that value as the user's message
    void handleSendMessage(value);
  };

  const handleLogout = () => {
    localStorage.removeItem('tenant_name');
    localStorage.removeItem('tenant_phone');
    navigate('/login');
  };

  const tenantName = localStorage.getItem('tenant_name');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-black shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/img/logo_icon.png"
              alt="Tenant Assistant logo"
              className="h-10 w-10 object-contain"
            />
            <div className="flex flex-col">
              <h1 className="text-xl font-semibold text-white">
                Tenant Assistant
              </h1>
              {tenantName && (
                <p className="text-xs text-gray-300 mt-1">
                  Welcome, {tenantName}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-200 hover:text-red-400 transition-colors"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
        style={{ maxHeight: 'calc(100vh - 140px)' }}
      >
        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            from={message.from}
            text={message.text}
            selectedOption={
              message.from === 'ai' ? selectedOptions[message.id] : undefined
            }
            onOptionClick={
              message.from === 'ai' && message.options && message.options.length
                ? (value) => handleOptionClick(message.id, value)
                : undefined
            }
          />
        ))}
      </div>

      <ChatInput onSend={handleSendMessage} />
    </div>
  );
}
