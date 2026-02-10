'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '../components/chat/Sidebar';
import ChatMessages from '../components/chat/ChatMessages';
import ChatInput from '../components/chat/ChatInput';
import ChatSettingsModal, { ChatSettings } from '../components/chat/ChatSettingsModal';

interface Session {
    session_id: string;
    title: string;
    settings?: ChatSettings;
}

function ChatWithParams() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState('');
    const [sessions, setSessions] = useState<Session[]>([]);
    const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [currentSettings, setCurrentSettings] = useState<ChatSettings | undefined>(undefined);
    const [isNewChat, setIsNewChat] = useState(false);

    const loadSession = useCallback(async (id: string, userId: string) => {
        setSessionId(id);
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/chat?session_id=${id}&user_id=${userId}`);
        const data = await res.json();
        setMessages(data);
        setShowSidebar(false);
    }, []);

    const fetchSessions = useCallback(async (userId: string) => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/sessions?user_id=${userId}`);
        const data = await res.json();
        
        if (data.sessions.length > 0) {
            setSessions(data.sessions);
            const firstSessionId = data.sessions[0].session_id;
            setSessionId(firstSessionId);
            loadSession(firstSessionId, userId);
            
            // Set settings if available
            if (data.sessions[0].settings) {
                setCurrentSettings(data.sessions[0].settings);
            }
        } else {
            setIsNewChat(true);
            setIsSettingsModalOpen(true);
        }
    }, [loadSession]);

    useEffect(() => {
        const fetchUserIdAndSessions = async () => {
            const res = await fetch('/api/get-cookie');
            const data = await res.json();
            if (data.userId) {
                setUserId(data.userId);
                fetchSessions(data.userId);
            } else {
                router.push('/');
            }
        };
        fetchUserIdAndSessions();
    }, [fetchSessions, router]);

    // Handle session parameter from URL
    useEffect(() => {
        const sessionParam = searchParams.get('session');
        if (sessionParam && userId && sessionParam !== sessionId) {
            loadSession(sessionParam, userId);
        }
    }, [searchParams, userId, loadSession, sessionId]);

    const startNewSession = async () => {
        setIsNewChat(true);
        setIsSettingsModalOpen(true);
    };

    const handleSaveSettings = async (settings: ChatSettings) => {
        if (isNewChat) {
            const newId = `${userId}-${Date.now()}`;
            const newSession: Session = { 
                session_id: newId, 
                title: 'New Chat',
                settings: settings
            };
            setSessions((prev) => [newSession, ...prev]);
            setSessionId(newId);
            setMessages([]);
            setCurrentSettings(settings);
            setIsNewChat(false);
        } else {
            setSessions(prev => prev.map(s => 
                s.session_id === sessionId ? { ...s, settings } : s
            ));
            setCurrentSettings(settings);
            
        }
        setIsSettingsModalOpen(false);
    };

    const sendMessage = async () => {
        if (!message.trim()) return;
        const userMessage = message;
        setMessage('');
        setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            // Send the message first
            const res = await fetch('/api/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    session_id: sessionId,
                    user_message: userMessage,
                    settings: currentSettings, 
                }),
            });

            const data = await res.json();
            const reply = data.llm_response;
            setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);

            // If this was the first message, update the title after the session is created
            if (messages.length === 0) {
                const currentSession = sessions.find(s => s.session_id === sessionId);
                if (currentSession) {
                    try {
                        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/title`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                session_id: sessionId, 
                                new_title: currentSession.title,
                                user_id: userId 
                            }),
                        });
                    } catch (error) {
                        console.error('Failed to update title after first message:', error);
                    }
                }
            }
        } catch (err) {
            console.error('Message send failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSessionDelete = (deletedSessionId: string) => {
        setSessions(prev => prev.filter(session => session.session_id !== deletedSessionId));
        if (deletedSessionId === sessionId) {
            const remainingSessions = sessions.filter(s => s.session_id !== deletedSessionId);
            if (remainingSessions.length > 0) {
                setSessionId(remainingSessions[0].session_id);
                loadSession(remainingSessions[0].session_id, userId!);
            } else {
                // Create a new default session if all sessions are deleted
                const newId = `${userId}-${Date.now()}`;
                const newSession = { session_id: newId, title: 'New Chat' };
                setSessions([newSession]);
                setSessionId(newId);
                setMessages([]);
            }
        }
    };

    const handleSessionRename = (sessionId: string, newTitle: string) => {
        setSessions(prev => 
            prev.map(session => 
                session.session_id === sessionId 
                    ? { ...session, title: newTitle }
                    : session
            )
        );
    };

    return (
        <main className="flex flex-col md:flex-row h-screen bg-gray-100">
                <Sidebar
                    sessions={sessions}
                    currentSessionId={sessionId}
                    onNewSession={startNewSession}
                    onSessionSelect={loadSession}
                    onSessionDelete={handleSessionDelete}
                    onSessionRename={handleSessionRename}
                    onSettingsClick={() => setIsSettingsModalOpen(true)}
                    userId={userId}
                    showSidebar={showSidebar}
                    setShowSidebar={setShowSidebar}
                    messages={messages}
                />

            <section
                className="flex flex-col h-full flex-1 pt-16 md:pt-0 relative"
                onClick={() => {
                    if (showSidebar) setShowSidebar(false);
                }}
            >
                <ChatMessages messages={messages} />
                <div className="relative z-0">
                    <ChatInput
                        message={message}
                        setMessage={setMessage}
                        sendMessage={sendMessage}
                        loading={loading}
                    />
                </div>
            </section>

            <ChatSettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                onSave={handleSaveSettings}
                initialSettings={currentSettings}
                isMandatory={isNewChat}
                title={isNewChat ? "Configure Your New Chat" : "Chat Settings"}
            />
        </main>
    );
}

export default function Chat() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        }>
            <ChatWithParams />
        </Suspense>
    );
}
