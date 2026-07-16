import { useTranslation } from 'react-i18next';
import type { User } from '@machinefit/shared';
import { useUserUnits } from '@/hooks/useUserUnits';
import { isGenderMissing, isHeightMissing } from '@/utils/profileCompleteness';
import '@/styles/home.css';

interface ProfileSummaryCardProps {
  user: User | null | undefined;
}

export function ProfileSummaryCard({ user }: ProfileSummaryCardProps) {
  const { t } = useTranslation();
  const { formatHeight, formatWeight } = useUserUnits();

  if (!user) return null;

  const parts: string[] = [];

  if (!isHeightMissing(user)) {
    parts.push(formatHeight(user.heightCm!));
  } else {
    parts.push(t('auth.profileUnset'));
  }

  if (user.weightKg != null) {
    parts.push(formatWeight(user.weightKg));
  }

  if (user.experienceLevel) {
    parts.push(t(`auth.experienceLevels.${user.experienceLevel}`));
  }

  if (user.gender) {
    parts.push(t(`auth.genders.${user.gender}`));
  } else {
    parts.push(t('auth.genderUnset'));
  }

  const hasMissing = isHeightMissing(user) || isGenderMissing(user);

  return (
    <div className="profile-summary-card">
      <p className="profile-summary-card__title">{t('auth.profileSummary')}</p>
      <p className="profile-summary-card__values">{parts.join(' · ')}</p>
      {hasMissing && (
        <p className="profile-summary-card__missing">{t('auth.profileIncompleteHint')}</p>
      )}
    </div>
  );
}
