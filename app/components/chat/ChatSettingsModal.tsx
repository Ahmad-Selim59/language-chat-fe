'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export interface ChatSettings {
    targetLanguage: string;
    nativeLanguage: string;
    scriptPreference: 'target' | 'native';
    formality: 'very informal' | 'casual' | 'formal';
}

interface ChatSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (settings: ChatSettings) => void;
    initialSettings?: ChatSettings;
    title?: string;
    isMandatory?: boolean;
}

export default function ChatSettingsModal({
    isOpen,
    onClose,
    onSave,
    initialSettings,
    title = 'Chat Settings',
    isMandatory = false
}: ChatSettingsModalProps) {
    const [settings, setSettings] = useState<ChatSettings>(
        initialSettings || {
            targetLanguage: '',
            nativeLanguage: '',
            scriptPreference: 'target',
            formality: 'casual',
        }
    );

    useEffect(() => {
        if (initialSettings) {
            setSettings(initialSettings);
        }
    }, [initialSettings, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!settings.targetLanguage.trim() || !settings.nativeLanguage.trim()) {
            alert('Please enter both your target and native languages.');
            return;
        }
        onSave(settings);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-[#202123] w-full max-w-md rounded-xl shadow-2xl border border-[#2a2b32] overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-[#2a2b32]">
                    <h2 className="text-xl font-semibold text-[#ececf1]">{title}</h2>
                    {!isMandatory && (
                        <button 
                            onClick={onClose}
                            className="text-[#a3a3a3] hover:text-[#ececf1] transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[#ececf1] mb-2">
                                Language to Practice
                            </label>
                            <input
                                type="text"
                                value={settings.targetLanguage}
                                onChange={(e) => setSettings({ ...settings, targetLanguage: e.target.value })}
                                placeholder="e.g. Spanish, Japanese, Klingon..."
                                className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#343541] text-[#ececf1] rounded-lg focus:ring-2 focus:ring-[#10a37f] outline-none placeholder-[#565869]"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#ececf1] mb-2">
                                Your Native Language
                            </label>
                            <input
                                type="text"
                                value={settings.nativeLanguage}
                                onChange={(e) => setSettings({ ...settings, nativeLanguage: e.target.value })}
                                placeholder="e.g. English, French..."
                                className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#343541] text-[#ececf1] rounded-lg focus:ring-2 focus:ring-[#10a37f] outline-none placeholder-[#565869]"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#ececf1] mb-2">
                                Script Preference
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSettings({ ...settings, scriptPreference: 'target' })}
                                    className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                                        settings.scriptPreference === 'target'
                                            ? 'bg-[#10a37f] border-[#10a37f] text-white'
                                            : 'bg-[#1a1a1a] border-[#343541] text-[#a3a3a3] hover:border-[#10a37f]'
                                    }`}
                                >
                                    Target Script
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSettings({ ...settings, scriptPreference: 'native' })}
                                    className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                                        settings.scriptPreference === 'native'
                                            ? 'bg-[#10a37f] border-[#10a37f] text-white'
                                            : 'bg-[#1a1a1a] border-[#343541] text-[#a3a3a3] hover:border-[#10a37f]'
                                    }`}
                                >
                                    Native Script
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#ececf1] mb-2">
                                Formality Level
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['very informal', 'casual', 'formal'] as const).map((level) => (
                                    <button
                                        key={level}
                                        type="button"
                                        onClick={() => setSettings({ ...settings, formality: level })}
                                        className={`px-2 py-2 text-xs rounded-lg border transition-all capitalize ${
                                            settings.formality === level
                                                ? 'bg-[#10a37f] border-[#10a37f] text-white'
                                                : 'bg-[#1a1a1a] border-[#343541] text-[#a3a3a3] hover:border-[#10a37f]'
                                        }`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full bg-[#10a37f] text-white py-3 rounded-lg hover:bg-[#13c18d] transition-colors font-semibold shadow-lg active:scale-[0.98]"
                        >
                            Start Chatting
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
