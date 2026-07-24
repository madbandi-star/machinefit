import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { onlinePtApi } from '@/api';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import '@/styles/online-pt.css';

function linesToUrls(text: string): string[] {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s));
}

export function OnlinePtAskPage() {
  const { trainerId = '' } = useParams();
  const { t } = useTranslation('online-pt');
  const navigate = useNavigate();
  const showToast = useUIStore((s) => s.showToast);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [workoutGoal, setWorkoutGoal] = useState('');
  const [machineCode, setMachineCode] = useState('');
  const [brandCode, setBrandCode] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [photos, setPhotos] = useState('');
  const [videos, setVideos] = useState('');
  const [workoutLogRef, setWorkoutLogRef] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      onlinePtApi.createQuestion({
        trainerId,
        title,
        body,
        workoutGoal: workoutGoal || null,
        machineCode: machineCode || null,
        brandCode: brandCode || null,
        muscleGroup: muscleGroup || null,
        photoUrls: linesToUrls(photos),
        videoUrls: linesToUrls(videos),
        workoutLogRef: workoutLogRef || null,
        isPublic,
      }),
    onSuccess: (res) => {
      showToast(t('questionCreated'), 'success');
      navigate(ROUTES.ONLINE_PT_QUESTION.replace(':questionId', res.data.data.id));
    },
    onError: (e) => showToast(getApiErrorMessage(e, t('error')), 'error'),
  });

  return (
    <PageShell title={t('ask')} subtitle={t('title')}>
      <form
        className="opt-form"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <div>
          <label htmlFor="q-title">{t('questionTitle')}</label>
          <input id="q-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="q-body">{t('questionBody')}</label>
          <textarea
            id="q-body"
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="q-goal">{t('workoutGoal')}</label>
          <input id="q-goal" value={workoutGoal} onChange={(e) => setWorkoutGoal(e.target.value)} />
        </div>
        <div>
          <label htmlFor="q-machine">{t('machine')}</label>
          <input
            id="q-machine"
            value={machineCode}
            onChange={(e) => setMachineCode(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="q-brand">{t('brand')}</label>
          <input id="q-brand" value={brandCode} onChange={(e) => setBrandCode(e.target.value)} />
        </div>
        <div>
          <label htmlFor="q-muscle">{t('muscle')}</label>
          <input
            id="q-muscle"
            value={muscleGroup}
            onChange={(e) => setMuscleGroup(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="q-photos">{t('photos')}</label>
          <textarea id="q-photos" rows={2} value={photos} onChange={(e) => setPhotos(e.target.value)} />
        </div>
        <div>
          <label htmlFor="q-videos">{t('videos')}</label>
          <textarea id="q-videos" rows={2} value={videos} onChange={(e) => setVideos(e.target.value)} />
        </div>
        <div>
          <label htmlFor="q-log">{t('workoutLog')}</label>
          <input
            id="q-log"
            value={workoutLogRef}
            onChange={(e) => setWorkoutLogRef(e.target.value)}
          />
        </div>
        <label>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />{' '}
          {t('isPublic')}
        </label>
        <button type="submit" className="btn btn--primary" disabled={mutation.isPending}>
          {t('submitQuestion')}
        </button>
      </form>
    </PageShell>
  );
}
