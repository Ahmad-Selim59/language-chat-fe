import { supabase } from './supabase';
import { ChatSettings } from '@/app/components/chat/ChatSettingsModal';

export async function getUserSettings(): Promise<ChatSettings | null> {
    const { data, error } = await supabase
        .from('user_settings')
        .select('settings')
        .single();

    if (error || !data) return null;
    return data.settings as ChatSettings;
}

export async function saveUserSettings(settings: ChatSettings): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
        .from('user_settings')
        .upsert(
            { user_id: user.id, settings, updated_at: new Date().toISOString() },
            { onConflict: 'user_id' }
        );
}
