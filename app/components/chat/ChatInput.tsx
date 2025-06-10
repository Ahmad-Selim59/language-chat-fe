'use client';

interface ChatInputProps {
    message: string;
    setMessage: (message: string) => void;
    sendMessage: () => void;
    loading: boolean;
    keyboardHeight: number;
}

export default function ChatInput({
    message,
    setMessage,
    sendMessage,
    loading,
    keyboardHeight
}: ChatInputProps) {
    return (
        <div
            className="flex space-x-2 px-4 py-4 border-t border-[#2a2b32] bg-[#1a1a1a] md:static fixed left-0 right-0 z-10 transition-all duration-200"
            style={{
                bottom: keyboardHeight > 0 ? `${keyboardHeight}px` : '0px'
            }}
        >
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1 border border-[#343541] bg-[#23232a] text-[#ececf1] rounded-lg px-4 py-2 placeholder-[#a3a3a3]"
                placeholder="Type your message..."
                disabled={loading}
            />
            <button
                onClick={sendMessage}
                className="bg-[#10a37f] text-white px-4 py-2 rounded-lg hover:bg-[#13c18d] transition font-semibold"
                disabled={loading}
            >
                Send
            </button>
        </div>
    );
} 