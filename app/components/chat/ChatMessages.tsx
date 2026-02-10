'use client';

import { useRef, useEffect } from 'react';

interface Message {
    role: string;
    content: string;
}

interface ChatMessagesProps {
    messages: Message[];
    keyboardHeight?: number;
}

export default function ChatMessages({ messages, keyboardHeight = 0 }: ChatMessagesProps) {
    const bottomRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div
            className="flex-1 overflow-y-auto px-4 pt-4 space-y-4 min-h-0 custom-scrollbar bg-[#1a1a1a]"
            style={{
                paddingBottom: keyboardHeight > 0 ? `${Math.min(keyboardHeight + 80, window.innerHeight * 0.5)}px` : '80px'
            }}
        >
            {messages.length === 0 && (
                <div className="text-[#a3a3a3] text-center mt-10">Start a new conversation!</div>
            )}
            {messages.map((msg, i) => (
                <div
                    key={i}
                    className={`p-3 rounded-lg max-w-[100%] ${
                        msg.role === 'user'
                            ? 'bg-[#343541] self-end text-right text-[#ececf1]'
                            : 'bg-[#23232a] self-start text-left text-[#ececf1]'
                    }`}
                >
                    {typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}
                </div>
            ))}
            <div ref={bottomRef} />
        </div>
    );
} 