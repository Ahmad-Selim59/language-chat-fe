import { useRef, useEffect } from 'react';

interface ChatInputProps {
    message: string;
    setMessage: (message: string) => void;
    sendMessage: () => void;
    loading: boolean;
    keyboardHeight?: number;
}

export default function ChatInput({
    message,
    setMessage,
    sendMessage,
    loading,
    keyboardHeight = 0
}: ChatInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [message]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div
            className="flex items-end space-x-2 px-4 py-3 border-t border-[#2a2b32] bg-[#1a1a1a] w-full shrink-0 z-10 transition-all duration-200"
        >
            <div className="flex-1 bg-[#23232a] rounded-2xl border border-[#343541] focus-within:border-[#10a37f] transition-colors overflow-hidden">
                <textarea
                    ref={textareaRef}
                    rows={1}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-transparent text-[#e9edef] px-4 py-[10px] resize-none focus:outline-none placeholder-[#a3a3a3] max-h-[200px] custom-scrollbar"
                    style={{
                        height: 'auto',
                        display: 'block'
                    }}
                    placeholder="Type your message..."
                    disabled={loading}
                />
            </div>
            <button
                onClick={sendMessage}
                className="bg-[#10a37f] text-white p-2.5 rounded-full hover:bg-[#13c18d] transition-all disabled:opacity-50 flex items-center justify-center min-w-[44px] min-h-[44px]"
                disabled={loading || !message.trim()}
            >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                    <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z" />
                </svg>
            </button>
        </div>
    );
} 