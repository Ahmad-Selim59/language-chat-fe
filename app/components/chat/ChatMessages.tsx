'use client';

import { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Languages } from 'lucide-react';

interface Message {
    role: string;
    content: string;
}

interface ChatMessagesProps {
    messages: Message[];
    onTranslate?: (index: number) => void;
}

export default function ChatMessages({ messages, onTranslate }: ChatMessagesProps) {
    const bottomRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div
            className="flex-1 overflow-y-auto px-4 py-4 flex flex-col space-y-4 min-h-0 custom-scrollbar bg-[#1a1a1a]"
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
                    {msg.role !== 'user' && onTranslate && (
                        <div className="flex justify-end mt-2">
                            <button
                                onClick={() => onTranslate(i)}
                                className="text-[#a3a3a3] hover:text-[#ececf1] transition-colors flex items-center gap-1 text-xs"
                                title="Translate message"
                            >
                                <Languages className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            ))}
            <div ref={bottomRef} />
        </div>
    );
} 