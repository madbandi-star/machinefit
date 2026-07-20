import { useEffect, type ReactNode } from 'react';
import { QueryProvider } from './QueryProvider';
import { I18nProvider } from './I18nProvider';
import { ThemeProvider } from './ThemeProvider';
import { Toast } from '@/components/feedback/Toast/Toast';
import { API_BASE_URL } from '@/services/http/axios-client';
import { useSettingsStore } from '@/store/settings.store';
import { speechManager } from '@/utils/speechManager';
import { normalizeVoiceCoachVoice } from '@/utils/voiceCoach';
import '@/i18n';

function SpeechManagerBootstrap() {
  const voiceCoachVoice = useSettingsStore((s) => s.voiceCoachVoice);

  useEffect(() => {
    const gender = normalizeVoiceCoachVoice(voiceCoachVoice);
    void speechManager.init(gender).then(() => {
      speechManager.setGender(gender);
    });
  }, []);

  useEffect(() => {
    speechManager.setGender(normalizeVoiceCoachVoice(voiceCoachVoice));
  }, [voiceCoachVoice]);

  return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Render free instances still sleep; this one-shot ping just reduces cold-start pain.
    void fetch(`${API_BASE_URL}/health`, { method: 'GET' }).catch(() => undefined);
  }, []);

  return (
    <QueryProvider>
      <I18nProvider>
        <ThemeProvider>
          <SpeechManagerBootstrap />
          {children}
          <Toast />
        </ThemeProvider>
      </I18nProvider>
    </QueryProvider>
  );
}
