import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { qrApi } from '@/api';
import { machineDetailPath, parseMachineCodeFromQrPayload } from '@/utils/qr';
import { ROUTES } from '@/constants/routes';

export function QrRedirectPage() {
  const { qrCode } = useParams<{ qrCode: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!qrCode) {
      setFailed(true);
      return;
    }

    const resolve = async () => {
      const machineCode = parseMachineCodeFromQrPayload(qrCode);
      if (machineCode) {
        navigate(machineDetailPath(machineCode), { replace: true });
        return;
      }

      try {
        try {
          await qrApi.scan(qrCode);
        } catch {
          // optional logging
        }
        const res = await qrApi.resolve(qrCode);
        navigate(machineDetailPath(res.data.data.machineCode), { replace: true });
      } catch {
        setFailed(true);
      }
    };

    void resolve();
  }, [qrCode, navigate]);

  if (failed) {
    return (
      <PageShell title={t('qr.notFound')}>
        <QueryErrorMessage />
        <button
          type="button"
          className="btn btn--secondary btn--block"
          style={{ marginTop: '1rem' }}
          onClick={() => navigate(ROUTES.SCAN)}
        >
          {t('qr.scanTitle')}
        </button>
      </PageShell>
    );
  }

  return (
    <PageShell title={t('qr.resolving')}>
      <Skeleton count={2} height={80} />
    </PageShell>
  );
}
