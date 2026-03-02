'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '../components/chat/Sidebar';
import ChatMessages from '../components/chat/ChatMessages';
import ChatInput from '../components/chat/ChatInput';
import ChatSettingsModal, { ChatSettings } from '../components/chat/ChatSettingsModal';
import TranslationModal from '../components/chat/TranslationModal';
import { getUserSettings, saveUserSettings } from '@/lib/userSettings';

interface Session {
    session_id: string;
    title: string;
    settings?: ChatSettings;
}

/** Helper: get the current JWT access token */
async function getToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
}

function ChatWithParams() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState('');
    const [sessions, setSessions] = useState<Session[]>([]);
    const [messages, setMessages] = useState<{ id?: number; role: string; content: string }[]>([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [currentSettings, setCurrentSettings] = useState<ChatSettings | undefined>(undefined);
    const [isNewChat, setIsNewChat] = useState(false);

    const [translationModalOpen, setTranslationModalOpen] = useState(false);
    const [translationData, setTranslationData] = useState<string>('');
    const [isTranslating, setIsTranslating] = useState(false);

    const authHeaders = useCallback((token: string) => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    }), []);

    const loadSession = useCallback(async (id: string) => {
        const tok = await getToken();
        if (!tok) return;
        setSessionId(id);
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/chat?session_id=${id}`, {
            headers: { 'Authorization': `Bearer ${tok}` },
        });
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
        setShowSidebar(false);
    }, []);

    const fetchSessions = useCallback(async (_userId?: string, shouldLoad: boolean = true) => {
        const tok = await getToken();
        if (!tok) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/sessions`, {
                headers: { 'Authorization': `Bearer ${tok}` },
            });
            if (!res.ok) return; // backend not yet updated for JWT – silently ignore
            const data = await res.json();
            if (data.sessions && data.sessions.length > 0) {
                setSessions(data.sessions);
                if (shouldLoad) {
                    const firstSessionId = data.sessions[0].session_id;
                    setSessionId(firstSessionId);
                    loadSession(firstSessionId);
                }
            }
        } catch {
            // Network error – ignore silently
        }
    }, [loadSession]);

    // Auth check and initial data load on mount
    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push('/'); return; }
            setToken(session.access_token);

            // Load settings from DB
            const dbSettings = await getUserSettings();
            setCurrentSettings(dbSettings ?? undefined);

            // If no settings saved at all, prompt user to configure
            if (!dbSettings) {
                setIsNewChat(true);
                setIsSettingsModalOpen(true);
            }

            // Load sessions regardless
            fetchSessions();
        };
        init();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) router.push('/');
            else setToken(session.access_token);
        });
        return () => subscription.unsubscribe();
    }, [fetchSessions, router]);

    // Handle session URL param
    useEffect(() => {
        const sessionParam = searchParams.get('session');
        if (sessionParam && token && sessionParam !== sessionId) {
            loadSession(sessionParam);
        }
    }, [searchParams, token, loadSession, sessionId]);

    const startNewSession = async () => {
        setIsNewChat(true);
        // currentSettings is already loaded from DB on mount
        setIsSettingsModalOpen(true);
    };

    const handleSaveSettings = async (settings: ChatSettings) => {
        // Persist to Supabase DB
        await saveUserSettings(settings);

        if (isNewChat) {
            const newId = `user-${Date.now()}`;
            setSessions((prev) => [{ session_id: newId, title: 'New Chat', settings }, ...prev]);
            setSessionId(newId);
            setMessages([]);
            setCurrentSettings(settings);
            setIsNewChat(false);
        } else {
            setSessions(prev => prev.map(s => s.session_id === sessionId ? { ...s, settings } : s));
            setCurrentSettings(settings);
        }
        setIsSettingsModalOpen(false);
    };

    const sendMessage = async () => {
        if (!message.trim()) return;

        let settingsToSend = currentSettings;
        if (!settingsToSend) {
            // Try loading from DB as last resort
            const dbSettings = await getUserSettings();
            if (dbSettings) {
                settingsToSend = dbSettings;
                setCurrentSettings(dbSettings);
            } else {
                setIsNewChat(true);
                setIsSettingsModalOpen(true);
                return;
            }
        }

        const tok = await getToken();
        if (!tok) { router.push('/'); return; }

        const userMessage = message;
        setMessage('');
        setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/chat`, {
                method: 'POST',
                headers: authHeaders(tok),
                body: JSON.stringify({
                    session_id: sessionId,
                    user_message: userMessage,
                    settings: settingsToSend,
                }),
            });

            const data = await res.json();
            const reply = data.llm_response;
            const isFirstMessage = messages.length === 0;

            setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);

            if (isFirstMessage) {
                setTimeout(() => fetchSessions(undefined, false), 4000);
            }
        } catch (err) {
            console.error('Message send failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSessionDelete = (deletedSessionId: string) => {
        setSessions(prev => prev.filter(s => s.session_id !== deletedSessionId));
        if (deletedSessionId === sessionId) {
            const remaining = sessions.filter(s => s.session_id !== deletedSessionId);
            if (remaining.length > 0) {
                setSessionId(remaining[0].session_id);
                loadSession(remaining[0].session_id);
            } else {
                const newId = `user-${Date.now()}`;
                setSessions([{ session_id: newId, title: 'New Chat' }]);
                setSessionId(newId);
                setMessages([]);
            }
        }
    };

    const handleSessionRename = (sid: string, newTitle: string) => {
        setSessions(prev => prev.map(s => s.session_id === sid ? { ...s, title: newTitle } : s));
    };

    const handleTranslate = async (index: number) => {
        const nativeLang = currentSettings?.nativeLanguage;
        if (!nativeLang) {
            alert('Please set your native language in Chat Settings first!');
            setIsSettingsModalOpen(true);
            return;
        }

        const tok = await getToken();
        if (!tok) { router.push('/'); return; }

        setIsTranslating(true);
        setTranslationModalOpen(true);
        setTranslationData('');

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/translate?session_id=${sessionId}&message_id=${index}&native_language=${encodeURIComponent(nativeLang)}`,
                { headers: { 'Authorization': `Bearer ${tok}` } }
            );
            if (!res.ok) throw new Error('Failed to translate');
            const data = await res.json();
            if (typeof data.translation === 'string') {
                setTranslationData(data.translation);
            } else if (typeof data === 'string') {
                setTranslationData(data);
            } else {
                setTranslationData(JSON.stringify(data, null, 2));
            }
        } catch (error) {
            setTranslationData('Failed to fetch translation.');
            console.error(error);
        } finally {
            setIsTranslating(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    return (
        <main className="flex flex-col md:flex-row h-[100dvh] w-full bg-[#1a1a1a] relative overflow-hidden overscroll-none">
            <Sidebar
                sessions={sessions}
                currentSessionId={sessionId}
                onNewSession={startNewSession}
                onSessionSelect={loadSession}
                onSessionDelete={handleSessionDelete}
                onSessionRename={handleSessionRename}
                onSettingsClick={() => setIsSettingsModalOpen(true)}
                onLogout={handleLogout}
                token={token}
                showSidebar={showSidebar}
                setShowSidebar={setShowSidebar}
                messages={messages}
            />

            <section
                className="flex flex-col h-full flex-1 min-h-0 min-w-0 relative"
                onClick={() => { if (showSidebar) setShowSidebar(false); }}
            >
                <ChatMessages messages={messages} onTranslate={handleTranslate} />
                <div className="relative z-0 shrink-0">
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
                isMandatory={isNewChat && sessions.length === 0}
                title={isNewChat ? 'Configure Your New Chat' : 'Chat Settings'}
            />

            <TranslationModal
                isOpen={translationModalOpen}
                onClose={() => setTranslationModalOpen(false)}
                translation={translationData}
                isLoading={isTranslating}
            />
        </main>
    );
}

export default function Chat() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-[100dvh] w-full bg-[#1a1a1a]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        }>
            <ChatWithParams />
        </Suspense>
    );
}
