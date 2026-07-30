import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { qrApi } from '@/api';
import { machineDetailPath, parseGymMachineIdFromQrPayload, parseMachineCodeFromQrPayload, equipmentQrPath } from '@/utils/qr';
import '@/styles/phase4.css';

type CameraIssue = 'denied' | 'not_found' | 'unavailable' | null;

async function navigateToMachine(
  payload: string,
  navigate: ReturnType<typeof useNavigate>
): Promise<void> {
  const gymMachineId = parseGymMachineIdFromQrPayload(payload);
  if (gymMachineId) {
    navigate(equipmentQrPath(gymMachineId));
    return;
  }

  const machineCode = parseMachineCodeFromQrPayload(payload);
  if (machineCode) {
    // Still try API first — gym asset codes may look like catalog codes
    try {
      const res = await qrApi.resolve(payload);
      const data = res.data.data as {
        machineCode: string;
        deepLinkPath?: string;
        gymMachineId?: string;
        kind?: string;
      };
      if (data.kind === 'gym_machine' && data.gymMachineId) {
        navigate(equipmentQrPath(data.gymMachineId));
        return;
      }
      if (data.deepLinkPath?.startsWith('/equipment/qr/')) {
        navigate(data.deepLinkPath);
        return;
      }
    } catch {
      // fall through to catalog
    }
    navigate(machineDetailPath(machineCode));
    return;
  }

  const res = await qrApi.resolve(payload);
  const data = res.data.data as {
    machineCode: string;
    deepLinkPath?: string;
    gymMachineId?: string;
    kind?: string;
  };
  if (data.kind === 'gym_machine' && data.gymMachineId) {
    navigate(equipmentQrPath(data.gymMachineId));
    return;
  }
  if (data.deepLinkPath?.startsWith('/equipment/qr/')) {
    navigate(data.deepLinkPath);
    return;
  }
  navigate(machineDetailPath(data.machineCode));
}

function classifyCameraError(error: unknown): CameraIssue {
  const name =
    error && typeof error === 'object' && 'name' in error
      ? String((error as { name?: string }).name)
      : '';
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message?: string }).message)
      : String(error ?? '');
  const haystack = `${name} ${message}`.toLowerCase();

  if (
    name === 'NotAllowedError' ||
    name === 'PermissionDeniedError' ||
    haystack.includes('permission') ||
    haystack.includes('notallowed')
  ) {
    return 'denied';
  }
  if (
    name === 'NotFoundError' ||
    name === 'DevicesNotFoundError' ||
    haystack.includes('requested device not found') ||
    haystack.includes('no camera')
  ) {
    return 'not_found';
  }
  return 'unavailable';
}

export function QrScanPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [cameraIssue, setCameraIssue] = useState<CameraIssue>(null);
  const [cameraRetryKey, setCameraRetryKey] = useState(0);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handledRef = useRef(false);
  const isResolvingRef = useRef(false);

  useEffect(() => {
    isResolvingRef.current = isResolving;
  }, [isResolving]);

  const handlePayload = async (payload: string) => {
    if (handledRef.current || isResolvingRef.current) return;
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
    if (cameraIssue) return;

    let cancelled = false;
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
      .catch((err) => {
        if (!cancelled) setCameraIssue(classifyCameraError(err));
      });

    return () => {
      cancelled = true;
      void scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => {});
      scannerRef.current = null;
    };
    // Restart only when user retries camera; handlePayload uses refs for latest state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraIssue, cameraRetryKey]);

  const retryCamera = () => {
    setCameraIssue(null);
    setCameraRetryKey((key) => key + 1);
  };

  const submitManual = async (event: FormEvent) => {
    event.preventDefault();
    handledRef.current = false;
    await handlePayload(manualCode);
  };

  const cameraHint =
    cameraIssue === 'denied'
      ? t('qr.cameraDenied')
      : cameraIssue === 'not_found'
        ? t('qr.cameraNotFound')
        : cameraIssue === 'unavailable'
          ? t('qr.cameraUnavailable')
          : null;

  return (
    <PageShell title={t('qr.scanTitle')} subtitle={t('qr.scanSubtitle')}>
      {!cameraIssue ? (
        <div id="qr-reader" className="qr-scan-page__reader" />
      ) : (
        <div className="qr-scan-page__camera-fallback">
          <p className="qr-scan-page__hint">{cameraHint}</p>
          <button type="button" className="btn btn--secondary btn--block" onClick={retryCamera}>
            {t('qr.retryCamera')}
          </button>
        </div>
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
