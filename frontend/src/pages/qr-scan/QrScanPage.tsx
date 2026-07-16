import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { qrApi } from '@/api';
import { machineDetailPath, parseMachineCodeFromQrPayload } from '@/utils/qr';
import '@/styles/phase4.css';

async function navigateToMachine(
  payload: string,
  navigate: ReturnType<typeof useNavigate>
): Promise<void> {
  const machineCode = parseMachineCodeFromQrPayload(payload);
  if (machineCode) {
    navigate(machineDetailPath(machineCode));
    return;
  }

  const res = await qrApi.resolve(payload);
  navigate(machineDetailPath(res.data.data.machineCode));
}

export function QrScanPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [cameraUnavailable, setCameraUnavailable] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handledRef = useRef(false);

  const handlePayload = async (payload: string) => {
    if (handledRef.current || isResolving) return;
    handledRef.current = true;
    setIsResolving(true);
    setError(null);

    try {
      const code = payload.trim();
      try {
        await qrApi.scan(code);
      } catch {
        // scan logging is optional; resolve still works
      }
      await navigateToMachine(code, navigate);
    } catch {
      handledRef.current = false;
      setError(t('qr.notFound'));
      setIsResolving(false);
    }
  };

  useEffect(() => {
    const elementId = 'qr-reader';
    const scanner = new Html5Qrcode(elementId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 8, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          void handlePayload(decoded);
        },
        () => {}
      )
      .catch(() => setCameraUnavailable(true));

    return () => {
      void scanner.stop().then(() => scanner.clear()).catch(() => {});
      scannerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitManual = async (event: FormEvent) => {
    event.preventDefault();
    handledRef.current = false;
    await handlePayload(manualCode);
  };

  return (
    <PageShell title={t('qr.scanTitle')} subtitle={t('qr.scanSubtitle')}>
      {!cameraUnavailable ? (
        <div id="qr-reader" className="qr-scan-page__reader" />
      ) : (
        <p className="qr-scan-page__hint">{t('qr.cameraUnavailable')}</p>
      )}
      <p className="qr-scan-page__hint">{t('qr.scanHint')}</p>

      <form className="qr-scan-page__manual" onSubmit={submitManual}>
        <label>
          {t('qr.manualLabel')}
          <input
            className="input"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder={t('qr.manualPlaceholder')}
            disabled={isResolving}
          />
        </label>
        <button type="submit" className="btn btn--primary btn--block" disabled={isResolving}>
          {isResolving ? '...' : t('qr.submit')}
        </button>
        {error && <p className="qr-scan-page__error">{error}</p>}
      </form>
    </PageShell>
  );
}
