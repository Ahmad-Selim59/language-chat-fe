'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Square, Loader2, Volume2, X } from 'lucide-react';
import { ChatSettings } from './ChatSettingsModal';

interface OralChatProps {
    token: string | null;
    currentSettings?: ChatSettings;
}

export default function OralChatInterface({ token, currentSettings }: OralChatProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [status, setStatus] = useState<'idle' | 'recording' | 'processing'>('idle');
    const [transcript, setTranscript] = useState<{ role: string, content: string }[]>([]);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const wsRef = useRef<WebSocket | null>(null);
    const historyRef = useRef<{ role: string, content: string }[]>([]);
    const transcriptEndRef = useRef<HTMLDivElement>(null);

    const settingsToSend = currentSettings || {
        nativeLanguage: "English",
        targetLanguage: "Spanish",
        scriptPreference: "target",
        formality: "casual",
        gender: "male",
        dialect: "NA"
    };

    const connect = useCallback(() => {
        if (!token) return;

        if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
            wsRef.current.close();
        }

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
        const wsUrl = backendUrl.replace('http', 'ws');
        const ws = new WebSocket(`${wsUrl}/ws/oral-chat/oral-ephemeral`);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('Oral WebSocket connecting and authenticating');
            ws.send(JSON.stringify({ type: 'auth', token }));
            setErrorMsg(null);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.error) {
                    console.warn('WS Error:', data.error);
                    setStatus(prev => prev === 'processing' ? 'idle' : prev);
                    return;
                }

                if (data.type === "user_transcription") {
                    const newUserMsg = { role: 'user', content: data.content };
                    setTranscript(prev => [...prev, newUserMsg]);
                    historyRef.current = [...historyRef.current, newUserMsg];
                    // Keep status as 'processing' while AI thinks
                    
                    if (transcriptEndRef.current) {
                        transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
                    }
                    return;
                }

                if (data.type === "assistant_response") {
                    const newAiMsg = { role: 'assistant', content: data.content };
                    setTranscript(prev => [...prev, newAiMsg]);
                    historyRef.current = [...historyRef.current, newAiMsg];

                    if (data.audio) {
                        try {
                            const audioCode = `data:audio/wav;base64,${data.audio}`;
                            const audio = new Audio(audioCode);
                            audio.play().catch(e => console.warn("Audio playback failed", e));
                        } catch (e) {
                            console.warn("Failed to play audio", e);
                        }
                    }
                    setStatus('idle');
                    
                    if (transcriptEndRef.current) {
                        transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            } catch (e) {
                console.error("Failed to parse websocket message", e);
                setStatus(prev => prev === 'processing' ? 'idle' : prev);
            }
        };

        ws.onclose = (event) => {
            console.log('Oral WebSocket disconnected', event.code, event.reason);
            setStatus(prev => prev === 'processing' ? 'idle' : prev);
            if (event.code !== 1000 && event.code !== 1008 && event.code !== 1005) {
                setErrorMsg('Voice chat connection lost. Please try conversing again.');
            }
        };

        ws.onerror = (error) => {
            // Use console.warn instead of console.error to avoid triggering the Next.js dev overlay
            // on intentional unmount aborts, which bubble up as generic WebSocket errors.
            console.warn('WebSocket encountered an issue (can be safely ignored if intentional):', error);
            setStatus(prev => prev === 'processing' ? 'idle' : prev);
        };
    }, [token]);

    useEffect(() => {
        connect();

        return () => {
            if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
                wsRef.current.close();
            }
        };
    }, [connect]);

    // Auto-scroll to bottom of transcript
    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    const startRecording = async () => {
        try {
            // Reconnect if the socket was dropped
            if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED || wsRef.current.readyState === WebSocket.CLOSING) {
                console.log("WebSocket is closed. Attempting to reconnect...");
                connect();
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : 'audio/webm';
            
            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                setStatus('processing');
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const arrayBuffer = await blob.arrayBuffer();
                
                // Convert to base64 safely
                const buffer = new Uint8Array(arrayBuffer);
                let binary = '';
                for (let i = 0; i < buffer.byteLength; i++) {
                    binary += String.fromCharCode(buffer[i]);
                }
                const base64Audio = btoa(binary);

                // We add a tiny delay to ensure the reconnection (if fired) has time to auth,
                // but usually the user speaks for at least a few seconds anyway, so it should be OPEN.
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({
                        audio_base64: base64Audio,
                        history: historyRef.current,
                        settings: settingsToSend
                    }));
                } else if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
                    // Try to wait a tiny bit and send if still connecting
                    wsRef.current.addEventListener('open', () => {
                        wsRef.current?.send(JSON.stringify({
                            audio_base64: base64Audio,
                            history: historyRef.current,
                            settings: settingsToSend
                        }));
                    }, { once: true });
                } else {
                    console.error("WebSocket is not open");
                    setStatus('idle');
                    setErrorMsg("Failed to send audio. The connection was lost.");
                }

                // Release microphone
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setStatus('recording');
        } catch (err) {
            console.error("Microphone error", err);
            setErrorMsg("Could not access microphone. Please check permissions.");
            setStatus('idle');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#1a1a1a] text-white relative">
            {/* Error Toast */}
            {errorMsg && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-3 z-50 backdrop-blur-sm animate-in fade-in slide-in-from-top-4">
                    <span className="text-sm font-medium">{errorMsg}</span>
                    <button 
                        onClick={() => setErrorMsg(null)} 
                        className="p-1 hover:bg-red-500/20 rounded transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="flex-none p-4 border-b border-[#2a2b32] bg-[#202123] shadow-sm flex items-center justify-center">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-[#10a37f]" />
                    Oral Conversation Mode
                </h2>
            </div>

            {/* Live Transcript Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {transcript.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-[#8e8ea0]">
                        <div className="bg-[#2a2b32] p-4 rounded-full mb-4 inline-flex items-center justify-center">
                            <Mic className="w-8 h-8 text-[#565869]" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">Start Speaking!</h3>
                        <p className="max-w-md mx-auto">
                            Press the microphone button below to start recording. We&apos;ll instantly transcribe what you say and reply back using AI voice.
                        </p>
                    </div>
                ) : (
                    transcript.map((msg, idx) => (
                        <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-4 max-w-[80%] rounded-2xl text-[15px] leading-relaxed relative 
                                ${msg.role === 'user'
                                    ? 'bg-[#10a37f] text-white rounded-br-sm shadow-md'
                                    : 'bg-[#2a2b32] text-[#ececf1] rounded-bl-sm shadow-md border border-[#343541]'
                                }`}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="text-xs font-semibold uppercase tracking-wider text-[#8e8ea0] mb-1.5 flex items-center gap-1.5">
                                        <Volume2 className="w-3 h-3" /> Language Buddy
                                    </div>
                                )}
                                {msg.content}
                            </div>
                        </div>
                    ))
                )}
                {/* Invisible element to anchor scroll to bottom */}
                <div ref={transcriptEndRef} />
            </div>

            {/* Controls Area */}
            <div className="flex-none p-6 border-t border-[#2a2b32] bg-[#202123] flex flex-col items-center justify-center pb-8 gap-4">
                
                {status === 'processing' ? (
                    <div className="flex flex-col items-center gap-3 text-[#10a37f]">
                        <Loader2 className="w-10 h-10 animate-spin" />
                        <span className="text-sm font-medium animate-pulse">Processing Audio...</span>
                    </div>
                ) : status === 'recording' ? (
                    <div className="flex flex-col items-center gap-3">
                        <button
                            onClick={stopRecording}
                            className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 transition-all outline-none shadow-lg shadow-red-500/20 flex flex-col items-center justify-center text-white ring-4 ring-red-500/30"
                        >
                            <Square className="w-8 h-8 fill-current" />
                        </button>
                        <div className="flex items-center gap-2 text-red-500 font-medium">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                            Recording...
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <button
                            onClick={startRecording}
                            className="w-20 h-20 rounded-full bg-[#10a37f] hover:bg-[#13c18d] active:scale-95 transition-all outline-none shadow-lg shadow-[#10a37f]/20 flex flex-col items-center justify-center text-white ring-4 ring-[#10a37f]/30"
                        >
                            <Mic className="w-8 h-8" />
                        </button>
                        <span className="text-[#8e8ea0] text-sm font-medium">Tap to Speak</span>
                    </div>
                )}
            </div>
        </div>
    );
}
