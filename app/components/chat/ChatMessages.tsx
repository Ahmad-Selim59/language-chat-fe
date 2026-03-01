'use client';

import { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
            className="flex-1 overflow-y-auto px-4 pt-4 flex flex-col space-y-4 min-h-0 custom-scrollbar bg-[#1a1a1a]"
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
                    className={`p-3 rounded-2xl w-fit max-w-[85%] md:max-w-[70%] shadow-sm ${msg.role === 'user'
                        ? 'bg-[#005c4b] self-end text-[#e9edef] rounded-tr-none'
                        : 'bg-[#202c33] self-start text-[#e9edef] rounded-tl-none'
                        }`}
                >
                    <div className="markdown-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}
                        </ReactMarkdown>
                    </div>
                </div>
            ))}
            <div ref={bottomRef} />
        </div>
    );
} 