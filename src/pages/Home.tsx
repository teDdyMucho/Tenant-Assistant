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

const createNewSessionId = () => {
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
  const [sessionId] = useState(() => createNewSessionId());

  // Log current localStorage data on component mount for debugging
  useEffect(() => {
    console.log('=== Home Page Mounted - Current localStorage Data ===');
    console.log('tenant_name:', localStorage.getItem('tenant_name'));
    console.log('tenant_phone:', localStorage.getItem('tenant_phone'));
    console.log('tenant_email:', localStorage.getItem('tenant_email'));
    console.log('tenant_user_id:', localStorage.getItem('tenant_user_id'));
    console.log('tenant_unit_id:', localStorage.getItem('tenant_unit_id'));
    console.log('tenant_id:', localStorage.getItem('tenant_id'));
    console.log('tenant_tenant_id:', localStorage.getItem('tenant_tenant_id'));
    console.log('property_id:', localStorage.getItem('property_id'));
    console.log('occupancy_id:', localStorage.getItem('occupancy_id'));
    console.log('sessionId:', sessionId);
    console.log('===================================================');
  }, [sessionId]);

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
      // Always fetch fresh data from localStorage
      const tenantName = localStorage.getItem('tenant_name');
      const tenantPhone = localStorage.getItem('tenant_phone');
      const tenantEmail = localStorage.getItem('tenant_email');
      const tenantUserId = localStorage.getItem('tenant_user_id');
      const tenantUnitId = localStorage.getItem('tenant_unit_id');
      const tenantId = localStorage.getItem('tenant_id');
      const tenantTenantId = localStorage.getItem('tenant_tenant_id');
      const propertyId = localStorage.getItem('property_id');
      const occupancyId = localStorage.getItem('occupancy_id');

      const payload: any = {
        message: text,
        fullName: tenantName,
        phoneNumber: tenantPhone,
        sessionId,
      };

      // Include email if available
      if (tenantEmail) {
        payload.email = tenantEmail;
        console.log('Including email in webhook payload:', tenantEmail);
      }

      // Include UserId if available
      if (tenantUserId) {
        payload.UserId = tenantUserId;
        console.log('Including UserId in webhook payload:', tenantUserId);
      } else {
        console.warn('No UserId found in localStorage');
      }

      // Include unit_id if available
      if (tenantUnitId) {
        payload.unitId = tenantUnitId;
        console.log('Including unit_id in webhook payload:', tenantUnitId);
      } else {
        console.warn('No unit_id found in localStorage');
      }

      // Include tenant_id if available
      if (tenantId) {
        payload.tenantId = tenantId;
        console.log('Including tenant_id in webhook payload:', tenantId);
      } else {
        console.warn('No tenant_id found in localStorage');
      }

      // Include tenant_tenant_id if available
      if (tenantTenantId) {
        payload.tenantTenantId = tenantTenantId;
        console.log('Including tenant_tenant_id in webhook payload:', tenantTenantId);
      }

      // Include property_id if available
      if (propertyId) {
        payload.propertyId = propertyId;
        console.log('Including property_id in webhook payload:', propertyId);
      } else {
        console.warn('No property_id found in localStorage');
      }

      // Include occupancy_id if available
      if (occupancyId) {
        payload.occupancyId = occupancyId;
        console.log('Including occupancy_id in webhook payload:', occupancyId);
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
    // Clear all user data from localStorage
    localStorage.removeItem('tenant_name');
    localStorage.removeItem('tenant_phone');
    localStorage.removeItem('tenant_email');
    localStorage.removeItem('tenant_user_id');
    localStorage.removeItem('tenant_unit_id');
    localStorage.removeItem('tenant_id');
    localStorage.removeItem('tenant_tenant_id');
    localStorage.removeItem('tenant_fname');
    localStorage.removeItem('tenant_lname');
    localStorage.removeItem('tenant_address');
    localStorage.removeItem('tenant_type');
    localStorage.removeItem('property_id');
    localStorage.removeItem('occupancy_id');
    localStorage.removeItem('tenant_session_id');
    console.log('All user data cleared from localStorage');
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
