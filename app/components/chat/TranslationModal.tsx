import { X } from 'lucide-react';

interface TranslationModalProps {
    isOpen: boolean;
    onClose: () => void;
    translation: string;
    isLoading: boolean;
}

export default function TranslationModal({ isOpen, onClose, translation, isLoading }: TranslationModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-[#202123] rounded-xl w-full max-w-lg border border-[#2a2b32] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b border-[#2a2b32] bg-[#23232a]">
                    <h2 className="text-lg font-semibold text-[#ececf1]">Translation</h2>
                    <button
                        onClick={onClose}
                        className="text-[#a3a3a3] hover:text-[#ececf1] transition-colors p-1"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#10a37f]"></div>
                        </div>
                    ) : (
                        <div className="text-[#ececf1] whitespace-pre-wrap leading-relaxed">
                            {translation}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
