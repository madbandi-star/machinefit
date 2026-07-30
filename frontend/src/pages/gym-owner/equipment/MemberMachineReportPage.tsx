import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { MemberReportType } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { inspectionApi } from '@/api';
import { useUIStore } from '@/store/ui.store';
import '@/styles/inspection.css';

const REPORT_TYPES: Array<{ value: MemberReportType; label: string }> = [
  { value: 'noise', label: '소음' },
  { value: 'shake', label: '흔들림' },
  { value: 'cable', label: '케이블' },
  { value: 'seat', label: '시트' },
  { value: 'pad', label: '패드' },
  { value: 'other', label: '기타' },
];

/** Member-facing report form (QR / deep link: ?gymMachineId=). */
export function MemberMachineReportPage() {
  const showToast = useUIStore((s) => s.showToast);
  const params = new URLSearchParams(window.location.search);
  const [gymMachineId, setGymMachineId] = useState(params.get('gymMachineId') ?? '');
  const [reportType, setReportType] = useState<MemberReportType>('noise');
  const [description, setDescription] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      inspectionApi.createMemberReport({
        gymMachineId,
        reportType,
        description: description || undefined,
      }),
    onSuccess: () => {
      showToast('신고가 접수되었습니다. 감사합니다!', 'success');
      setDescription('');
    },
    onError: () => showToast('신고에 실패했습니다', 'error'),
  });

  return (
    <PageShell title="기구 이상 신고" subtitle="소음 · 흔들림 · 케이블 등">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!gymMachineId.trim()) {
            showToast('기구 ID가 필요합니다', 'error');
            return;
          }
          mutation.mutate();
        }}
      >
        <div className="form-row">
          <label htmlFor="report-machine">보유기구 ID</label>
          <input
            id="report-machine"
            value={gymMachineId}
            onChange={(e) => setGymMachineId(e.target.value)}
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="report-type">신고 유형</label>
          <select
            id="report-type"
            value={reportType}
            onChange={(e) => setReportType(e.target.value as MemberReportType)}
          >
            {REPORT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="report-desc">설명</label>
          <textarea
            id="report-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn--primary btn--block" disabled={mutation.isPending}>
          {mutation.isPending ? '전송 중…' : '신고하기'}
        </button>
      </form>
      <p className="inspection-coming-soon" style={{ marginTop: '1rem' }}>
        동일 기구 · 동일 증상이 3건 이상이면 자동으로 고장접수(점검 요청)가 생성됩니다.
      </p>
    </PageShell>
  );
}
