'use client';

import { useState, useRef } from 'react';
import { Menu, MessageSquare, Settings, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Session {
    session_id: string;
    title: string;
}

interface SidebarProps {
    sessions: Session[];
    currentSessionId: string;
    onNewSession: () => void;
    onSessionSelect: (sessionId: string, userId: string) => void;
    onSessionDelete: (sessionId: string) => void;
    onSessionRename: (sessionId: string, newTitle: string) => void;
    onSettingsClick: () => void;
    userId: string | null;
    showSidebar: boolean;
    setShowSidebar: (show: boolean) => void;
    messages: { role: string; content: string }[];
}

export default function Sidebar({
    sessions,
    currentSessionId,
    onNewSession,
    onSessionSelect,
    onSessionDelete,
    onSessionRename,
    onSettingsClick,
    userId,
    showSidebar,
    setShowSidebar,
    messages
}: SidebarProps) {
    const [showMenu, setShowMenu] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState<string | null>(null);
    const [editedTitle, setEditedTitle] = useState('');
    const menuRef = useRef<HTMLDivElement | null>(null);
    const router = useRouter();

    const handleLogout = async () => {
        try {
            const res = await fetch('/api/logout', { method: 'POST' });
            if (res.ok) {
                router.push('/');
            }
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const handleUpdateTitle = async (id: string) => {
        if (!editedTitle.trim()) {
            setEditingTitle(null);
            setEditedTitle('');
            return;
        }

        // If the session has no messages, handle it client-side
        if (messages.length === 0) {
            onSessionRename(id, editedTitle);
            setEditingTitle(null);
            setEditedTitle('');
            return;
        }

        // If the session has messages, update the backend
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/title`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: id,
                    new_title: editedTitle,
                    user_id: userId
                }),
            });

            if (res.ok) {
                onSessionRename(id, editedTitle);
                setEditingTitle(null);
                setEditedTitle('');
            } else {
                console.error('Failed to update session title');
                // Revert the title in the input
                const currentSession = sessions.find(s => s.session_id === id);
                if (currentSession) {
                    setEditedTitle(currentSession.title);
                }
            }
        } catch (error) {
            console.error('Error updating session title:', error);
            // Revert the title in the input
            const currentSession = sessions.find(s => s.session_id === id);
            if (currentSession) {
                setEditedTitle(currentSession.title);
            }
        }
    };

    const handleDeleteSession = async (id: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/chat?session_id=${id}`, {
                method: 'DELETE',
            });

            if (res.status === 200 || res.status === 404) {
                onSessionDelete(id);
                if (id === currentSessionId) {
                    const remainingSessions = sessions.filter((s) => s.session_id !== id);
                    if (remainingSessions.length > 0) {
                        onSessionSelect(remainingSessions[0].session_id, userId!);
                    }
                }
            }
        } catch (error) {
            console.error('Error deleting session:', error);
        }
    };

    return (
        <>
            {/* Mobile Hamburger */}
            <button
                className="fixed top-4 left-4 z-20 p-2 md:hidden bg-[#202123] shadow-md rounded-md border border-[#2a2b32] text-[#ececf1]"
                onClick={() => setShowSidebar(!showSidebar)}
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Sidebar */}
            <aside
                className={`fixed z-10 top-0 left-0 h-full w-64 bg-[#202123] border-r border-[#2a2b32] p-4 transition-transform duration-300 ease-in-out md:static md:translate-x-0 flex flex-col ${showSidebar ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex flex-col gap-2 mb-4">
                    <button
                        onClick={onNewSession}
                        className="w-full bg-[#10a37f] text-white py-2 rounded-lg hover:bg-[#13c18d] active:scale-95 transition flex items-center justify-center gap-2 font-semibold"
                    >
                        <MessageSquare className="w-4 h-4" />
                        New Chat
                    </button>
                    <button
                        onClick={onSettingsClick}
                        className="w-full bg-[#343541] text-[#ececf1] py-2 rounded-lg hover:bg-[#40414f] active:scale-95 transition flex items-center justify-center gap-2 font-semibold border border-[#4d4d4f]"
                    >
                        <Settings className="w-4 h-4" />
                        Chat Settings
                    </button>
                </div>
                <ul className="flex-1 overflow-y-auto">
                    {sessions.map((s) => (
                        <li
                            key={s.session_id}
                            className={`group p-2 rounded-lg flex justify-between items-center cursor-pointer hover:bg-[#343541] ${s.session_id === currentSessionId ? 'bg-[#343541] font-bold' : ''
                                } text-[#ececf1]`}
                            onClick={() => onSessionSelect(s.session_id, userId!)}
                        >
                            {editingTitle === s.session_id ? (
                                <input
                                    className="flex-1 text-sm px-1 py-0.5 border border-[#343541] rounded bg-[#23232a] text-[#ececf1]"
                                    value={editedTitle}
                                    onChange={(e) => setEditedTitle(e.target.value)}
                                    onBlur={() => handleUpdateTitle(s.session_id)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleUpdateTitle(s.session_id);
                                    }}
                                    autoFocus
                                />
                            ) : (
                                <>
                                    <span className="truncate max-w-[140px]">{s.title}</span>
                                    <div className="relative" ref={menuRef}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowMenu(showMenu === s.session_id ? null : s.session_id);
                                            }}
                                            className="text-[#a3a3a3] hover:text-[#ececf1] md:opacity-0 md:group-hover:opacity-100"
                                        >
                                            ⋮
                                        </button>
                                        {showMenu === s.session_id && (
                                            <div className="absolute right-0 mt-2 bg-[#23232a] shadow-lg rounded-md border border-[#2a2b32] z-10 w-32">
                                                <button
                                                    className="block w-full text-left px-4 py-2 text-sm hover:bg-[#343541] text-[#ececf1]"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditedTitle(s.title);
                                                        setEditingTitle(s.session_id);
                                                        setShowMenu(null);
                                                    }}
                                                >
                                                    Rename
                                                </button>
                                                <button
                                                    className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#343541]"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteSession(s.session_id);
                                                        setShowMenu(null);
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </li>
                    ))}
                </ul>

                <div className="mt-auto pt-4 border-t border-[#2a2b32]">
                    <button
                        onClick={handleLogout}
                        className="w-full bg-transparent text-red-400 py-2 rounded-lg hover:bg-red-400/10 active:scale-95 transition flex items-center justify-center gap-2 font-semibold"
                    >
                        <LogOut className="w-4 h-4" />
                        Log Out
                    </button>
                </div>
            </aside>
        </>
    );
} 