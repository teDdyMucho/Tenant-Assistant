import { useState, useEffect } from 'react';
import { Volume2, VolumeX, ExternalLink } from 'lucide-react';

interface ChatBubbleProps {
  from: 'user' | 'ai';
  text: string;
  onOptionClick?: (value: string) => void;
  selectedOption?: string;
}

interface DocumentInfo {
  name: string;
  url: string;
}

// Function to parse document information from text
const parseDocumentInfo = (text: string): DocumentInfo | null => {
  // Look for document name pattern: **Document Name:** followed by filename
  const nameMatch = text.match(/\*\*Document Name:\*\*\s*([^\n]+)/i);
  
  // Look for Document URL pattern with [Download Lease Document] or similar
  let urlMatch = text.match(/\*\*Document URL:\*\*\s*\[([^\]]+)\]\s*\((https?:\/\/[^)]+)\)/i);
  
  // Alternative: Look for [Download URL] pattern
  if (!urlMatch) {
    urlMatch = text.match(/\*\*\[Download URL\]\*\*[^(]*\((https?:\/\/[^)]+)\)/i);
  }
  
  // Look for any URL in parentheses after a markdown link
  if (!urlMatch) {
    urlMatch = text.match(/\[([^\]]+)\]\s*\((https?:\/\/[^)]+)\)/i);
  }
  
  // Look for standalone URLs starting with https://
  if (!urlMatch) {
    const standaloneUrl = text.match(/(https?:\/\/[^\s\n)]+)/i);
    if (standaloneUrl) {
      urlMatch = [standaloneUrl[0], 'Download Document', standaloneUrl[1]] as RegExpMatchArray;
    }
  }
  
  if (nameMatch && urlMatch) {
    return {
      name: nameMatch[1].trim(),
      url: urlMatch[2] ? urlMatch[2].trim() : urlMatch[1].trim()
    };
  }
  
  return null;
};

// Helper function to parse bold markdown and return React nodes
const parseBoldText = (text: string, keyPrefix: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  const boldPattern = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match;
  
  while ((match = boldPattern.exec(text)) !== null) {
    // Add text before the bold
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    // Add the bold text
    parts.push(<strong key={`${keyPrefix}-bold-${match.index}`}>{match[1]}</strong>);
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts.length > 0 ? parts : [text];
};

// Function to render text with clickable links and document names
const renderTextWithLinks = (text: string): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  const lines = text.split('\n');
  
  // First pass: extract document URL if it exists
  let documentUrl: string | null = null;
  lines.forEach((line) => {
    const urlMatch = line.match(/\*\*Document URL\*\*:\s*\[([^\]]+)\]\s*\((https?:\/\/[^)]+)\)/i);
    if (urlMatch) {
      documentUrl = urlMatch[2];
    }
  });
  
  // Second pass: render lines with clickable document names
  lines.forEach((line, lineIndex) => {
    // Skip the Document URL line entirely
    if (line.match(/\*\*Document URL\*\*:/i)) {
      return;
    }
    
    // Check for "Lease Counter Signed Date:" pattern
    const dateMatch = line.match(/^Lease Counter Signed Date:\s*(.+)$/i);
    if (dateMatch) {
      parts.push(
        <span key={lineIndex}>
          <strong>Lease Counter Signed Date:</strong> {dateMatch[1].trim()}
          {'\n'}
        </span>
      );
      return;
    }
    
    // Check for "Document Name:" pattern
    const docNameMatch = line.match(/^Document Name:\s*(.+)$/i);
    if (docNameMatch) {
      parts.push(
        <span key={lineIndex}>
          <strong>Document Name:</strong> {docNameMatch[1].trim()}
          {'\n'}
        </span>
      );
      return;
    }
    
    // Check for "URL:" pattern with a link
    const urlLineMatch = line.match(/^URL:\s*(.+)$/i);
    if (urlLineMatch) {
      const urlContent = urlLineMatch[1].trim();
      // Check if it's a markdown link
      const linkMatch = urlContent.match(/\[([^\]]+)\]\s*\((https?:\/\/[^)]+)\)/);
      if (linkMatch) {
        parts.push(
          <span key={lineIndex}>
            <strong>URL:</strong>{' '}
            <a
              href={linkMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
            >
              {linkMatch[1]}
              <ExternalLink size={12} className="inline" />
            </a>
            {'\n'}
          </span>
        );
        return;
      }
    }
    
    // Check if this line contains a Document Name with markdown formatting and we have a URL
    const nameMatch = line.match(/^-\s*\*\*Document Name\*\*:\s*(.+)$/i);
    if (nameMatch && documentUrl) {
      const fileName = nameMatch[1].trim();
      parts.push(
        <span key={lineIndex}>
          - <strong>Document Name:</strong>{' '}
          <a
            href={documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
          >
            {fileName}
            <ExternalLink size={12} className="inline" />
          </a>
          {'\n'}
        </span>
      );
      return;
    }
    
    // Handle regular markdown links: [text](url)
    const linkPattern = /\[([^\]]+)\]\s*\((https?:\/\/[^)]+)\)/g;
    let lastIndex = 0;
    let match;
    const lineParts: React.ReactNode[] = [];
    
    while ((match = linkPattern.exec(line)) !== null) {
      // Add text before the link (with bold parsing)
      if (match.index > lastIndex) {
        const textBefore = line.substring(lastIndex, match.index);
        lineParts.push(...parseBoldText(textBefore, `${lineIndex}-before-${lastIndex}`));
      }
      
      // Add the clickable link
      const linkText = match[1];
      const url = match[2];
      lineParts.push(
        <a
          key={`${lineIndex}-${match.index}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
        >
          {linkText}
          <ExternalLink size={12} className="inline" />
        </a>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text from the line (with bold parsing)
    if (lastIndex < line.length) {
      const remainingText = line.substring(lastIndex);
      lineParts.push(...parseBoldText(remainingText, `${lineIndex}-after-${lastIndex}`));
    }
    
    // If we found links in this line, use the parts, otherwise parse the whole line for bold
    if (lineParts.length > 0) {
      parts.push(<span key={lineIndex}>{lineParts}{'\n'}</span>);
    } else {
      // Parse the entire line for bold text
      const boldParsed = parseBoldText(line, `${lineIndex}`);
      parts.push(<span key={lineIndex}>{boldParsed}{'\n'}</span>);
    }
  });

  return parts.length > 0 ? parts : text;
};

// Component to render clickable document link
const DocumentLink = ({ document }: { document: DocumentInfo }) => (
  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
    <div className="flex items-center gap-2">
      <ExternalLink size={16} className="text-blue-600 flex-shrink-0" />
      <a
        href={document.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline font-medium text-sm break-all"
      >
        {document.name}
      </a>
    </div>
    <p className="text-xs text-gray-600 mt-1">Click to download document</p>
  </div>
);

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
  
  // Parse document information from the text
  const documentInfo = !isUser ? parseDocumentInfo(text) : null;

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
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`relative max-w-[75%] px-3 py-2 rounded-2xl shadow-sm ${
          isUser
            ? 'bg-blue-500 text-white rounded-br-md'
            : 'bg-gray-200 text-gray-800 rounded-bl-md'
        }`}
      >
        {isUser || isDiagnosisSummary || !onOptionClick ? (
          <div>
            <div
              className={`text-sm leading-snug whitespace-pre-line break-words text-left`}
            >
              {renderTextWithLinks(text)}
            </div>
            {/* Render document link if document information is found */}
            {documentInfo && <DocumentLink document={documentInfo} />}
          </div>
        ) : (
          <div className="space-y-1">
            {text.split('\n').map((line, idx) => {
              const trimmed = line.trim();
              const match = trimmed.match(/^(\d+)[\).]\s*(.*)$/);

              if (!match) {
                return (
                  <div key={idx} className="text-sm leading-snug break-words text-left">
                    {renderTextWithLinks(line)}
                  </div>
                );
              }

              const [, num, rest] = match;
              const isSelected = selectedOption === num;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onOptionClick?.(num)}
                  className={`w-full text-left text-sm leading-snug px-2.5 py-1.5 rounded-xl cursor-pointer mt-0.5 transition-colors ${
                    isSelected
                      ? 'bg-gray-300 text-gray-700'
                      : 'bg-white/80 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  {`${num}. ${rest}`}
                </button>
              );
            })}
            {/* Render document link for option-based messages too */}
            {documentInfo && <DocumentLink document={documentInfo} />}
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
