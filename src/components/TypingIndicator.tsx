export default function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="relative max-w-[75%] px-4 py-3 rounded-2xl shadow-sm bg-gray-200 text-gray-800 rounded-bl-md">
        <div className="flex items-center gap-1">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
        </div>
      </div>
    </div>
  );
}
