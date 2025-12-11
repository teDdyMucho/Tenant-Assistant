import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface ChatBubbleProps {
  from: 'user' | 'ai';
  text: string;
  onOptionClick?: (value: string) => void;
  selectedOption?: string;
}

export default function ChatBubble({
  from,
  text,
  onOptionClick,
  selectedOption,
}: ChatBubbleProps) {
  const isUser = from === 'user';
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isDiagnosisSummary =
    !isUser && text.toLowerCase().includes('diagnosis summary');

  useEffect(() => {
    const handleSpeechEnd = () => {
      setIsSpeaking(false);
    };

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.addEventListener('voiceschanged', handleSpeechEnd);
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', handleSpeechEnd);
      };
    }
  }, []);

  const handleSpeak = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }

    if (isSpeaking) {
      // Stop speech if currently speaking
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      // Start speech
      window.speechSynthesis.cancel(); // Cancel any existing speech first

      // Remove emojis and common formatting characters from the spoken text
      // so TTS does not read them aloud (e.g. markdown-style **bold**).
      const cleanedText = text
        .replace(/\p{Extended_Pictographic}/gu, '')
        .replace(/[\*`_~]/g, '');

      const utterance = new SpeechSynthesisUtterance(cleanedText);
      utterance.lang = 'en-US';
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`relative max-w-[75%] px-4 py-3 rounded-2xl shadow-sm ${
          isUser
            ? 'bg-blue-500 text-white rounded-br-md'
            : 'bg-gray-200 text-gray-800 rounded-bl-md'
        }`}
      >
        {isUser || isDiagnosisSummary || !onOptionClick ? (
          <p
            className={`text-sm leading-relaxed whitespace-pre-line ${
              isUser ? 'text-right' : 'text-left'
            }`}
          >
            {text}
          </p>
        ) : (
          <div className="space-y-1">
            {text.split('\n').map((line, idx) => {
              const trimmed = line.trim();
              const match = trimmed.match(/^(\d+)[\).]\s*(.*)$/);

              if (!match) {
                return (
                  <p key={idx} className="text-sm leading-relaxed text-left">
                    {line}
                  </p>
                );
              }

              const [, num, rest] = match;
              const isSelected = selectedOption === num;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onOptionClick?.(num)}
                  className={`w-full text-left text-sm leading-relaxed px-3 py-2 rounded-xl cursor-pointer mt-1 transition-colors ${
                    isSelected
                      ? 'bg-gray-300 text-gray-700'
                      : 'bg-white/80 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  {`${num}. ${rest}`}
                </button>
              );
            })}
          </div>
        )}

        {!isUser && (
          <button
            type="button"
            onClick={handleSpeak}
            className="absolute -top-2 -right-2 h-7 w-7 flex items-center justify-center rounded-full bg-black/70 text-white hover:bg-black focus:outline-none transition-colors"
            aria-label={isSpeaking ? "Stop message audio" : "Play message audio"}
          >
            {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        )}

        {!isUser && text.includes('Diagnosis Summary') && (
          <button
            type="button"
            onClick={() => {
              if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).catch((err) => {
                  console.error('Failed to copy diagnosis summary', err);
                });
              }
            }}
            className="absolute bottom-2 right-2 text-xs px-2 py-1 rounded-full bg-black/70 text-white hover:bg-black"
          >
            Copy
          </button>
        )}
      </div>
    </div>
  );
}
