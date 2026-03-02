'use client';

import { useState, useRef, useEffect } from 'react';
import { Menu, MessageSquare, Settings, LogOut, X } from 'lucide-react';

interface Session {
    session_id: string;
    title: string;
}

interface SidebarProps {
    sessions: Session[];
    currentSessionId: string;
    onNewSession: () => void;
    onSessionSelect: (sessionId: string, userId?: string) => void;
    onSessionDelete: (sessionId: string) => void;
    onSessionRename: (sessionId: string, newTitle: string) => void;
    onSettingsClick: () => void;
    onLogout: () => void;
    token: string | null;
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
    onLogout,
    token,
    showSidebar,
    setShowSidebar,
    messages
}: SidebarProps) {
    const [showMenu, setShowMenu] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState<string | null>(null);
    const [editedTitle, setEditedTitle] = useState('');
    const menuRef = useRef<HTMLDivElement | null>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (showMenu && menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    const handleLogout = () => onLogout();

    const handleUpdateTitle = async (id: string) => {
        if (!editedTitle.trim()) { setEditingTitle(null); setEditedTitle(''); return; }

        if (messages.length === 0) {
            onSessionRename(id, editedTitle);
            setEditingTitle(null);
            setEditedTitle('');
            return;
        }

        try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/title`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ session_id: id, new_title: editedTitle }),
            });

            if (res.ok) {
                onSessionRename(id, editedTitle);
                setEditingTitle(null);
                setEditedTitle('');
            } else {
                const currentSession = sessions.find(s => s.session_id === id);
                if (currentSession) setEditedTitle(currentSession.title);
            }
        } catch (error) {
            console.error('Error updating session title:', error);
            const currentSession = sessions.find(s => s.session_id === id);
            if (currentSession) setEditedTitle(currentSession.title);
        }
    };

    const handleDeleteSession = async (id: string) => {
        try {
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/chat?session_id=${id}`, {
                method: 'DELETE',
                headers
            });

            if (res.status === 200 || res.status === 404) {
                onSessionDelete(id);
                if (id === currentSessionId) {
                    const remainingSessions = sessions.filter((s) => s.session_id !== id);
                    if (remainingSessions.length > 0) {
                        onSessionSelect(remainingSessions[0].session_id);
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
            {!showSidebar && (
                <button
                    className="fixed top-4 left-4 z-20 p-2 md:hidden bg-[#202123] shadow-md rounded-md border border-[#2a2b32] text-[#ececf1]"
                    onClick={() => setShowSidebar(true)}
                >
                    <Menu className="w-5 h-5" />
                </button>
            )}

            {/* Sidebar */}
            <aside
                className={`fixed z-30 top-0 left-0 h-full w-72 bg-[#202123] border-r border-[#2a2b32] p-3 transition-transform duration-300 ease-in-out md:static md:translate-x-0 flex flex-col ${showSidebar ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex items-center justify-between mb-4 md:hidden">
                    <div className="text-xs font-semibold text-[#8e8ea0] uppercase tracking-wider">Menu</div>
                    <button
                        onClick={() => setShowSidebar(false)}
                        className="p-2 text-[#a3a3a3] hover:text-[#ececf1]"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex flex-col gap-2 mb-6">
                    <button
                        onClick={onNewSession}
                        className="w-full bg-[#10a37f] text-white py-2.5 rounded-lg hover:bg-[#13c18d] active:scale-[0.98] transition flex items-center justify-center gap-2 font-medium text-sm border border-transparent shadow-sm"
                    >
                        <MessageSquare className="w-4 h-4" />
                        New Chat
                    </button>
                    <button
                        onClick={onSettingsClick}
                        className="w-full bg-[#343541] text-[#ececf1] py-2.5 rounded-lg hover:bg-[#40414f] active:scale-[0.98] transition flex items-center justify-center gap-2 font-medium text-sm border border-[#4d4d4f]"
                    >
                        <Settings className="w-4 h-4" />
                        Settings
                    </button>
                </div>

                <div className="text-[11px] font-semibold text-[#8e8ea0] px-3 mb-2 uppercase tracking-wider">
                    Recent Messages
                </div>

                <ul className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                    {sessions.map((s) => (
                        <li
                            key={s.session_id}
                            className={`group p-3 rounded-lg flex justify-between items-center cursor-pointer transition-colors duration-200 ${s.session_id === currentSessionId
                                ? 'bg-[#343541] text-white'
                                : 'text-[#ececf1] hover:bg-[#2a2b32]'
                                }`}
                            onClick={() => onSessionSelect(s.session_id)}
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <MessageSquare className={`w-4 h-4 shrink-0 ${s.session_id === currentSessionId ? 'text-white' : 'text-[#8e8ea0]'}`} />
                                {editingTitle === s.session_id ? (
                                    <input
                                        className="w-full text-sm px-1 py-0.5 border border-[#10a37f] rounded bg-[#1a1a1a] text-white outline-none"
                                        value={editedTitle}
                                        onChange={(e) => setEditedTitle(e.target.value)}
                                        onBlur={() => handleUpdateTitle(s.session_id)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleUpdateTitle(s.session_id);
                                            if (e.key === 'Escape') {
                                                setEditingTitle(null);
                                                setEditedTitle('');
                                            }
                                        }}
                                        autoFocus
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                ) : (
                                    <span className="text-sm truncate font-normal">{s.title || 'New Chat'}</span>
                                )}
                            </div>

                            {editingTitle !== s.session_id && (
                                <div className="relative shrink-0 ml-1" ref={showMenu === s.session_id ? menuRef : null}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowMenu(showMenu === s.session_id ? null : s.session_id);
                                        }}
                                        className={`p-1 rounded hover:bg-[#444654] transition-opacity opacity-100 text-[#8e8ea0] hover:text-[#ececf1]`}
                                    >
                                        <span className="text-lg leading-none">...</span>
                                    </button>
                                    {showMenu === s.session_id && (
                                        <div className="absolute right-0 mt-2 bg-[#1a1a1a] shadow-xl rounded-md border border-[#2a2b32] z-50 w-36 overflow-hidden">
                                            <button
                                                className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs hover:bg-[#2a2a2e] text-[#ececf1] transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditedTitle(s.title);
                                                    setEditingTitle(s.session_id);
                                                    setShowMenu(null);
                                                }}
                                            >
                                                <span>Rename</span>
                                            </button>
                                            <button
                                                className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-[#2a2a2e] transition-colors border-t border-[#2a2b32]"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteSession(s.session_id);
                                                    setShowMenu(null);
                                                }}
                                            >
                                                <span>Delete Chat</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>

                <div className="mt-auto pt-4 border-t border-[#2a2b32]">
                    <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-lg hover:bg-[#2a2b32] cursor-pointer transition-colors group">
                        <div className="w-8 h-8 rounded-full bg-[#10a37f] flex items-center justify-center text-white text-xs font-bold shrink-0">
                            U
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">User Account</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#ececf1] hover:bg-[#2a2b32] transition-colors"
                    >
                        <LogOut className="w-4 h-4 text-[#8e8ea0] group-hover:text-[#ececf1]" />
                        <span>Log Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
} 