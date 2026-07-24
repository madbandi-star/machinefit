import type { User, UserGym } from '@machinefit/shared';

/** Prefer profile home gym (signup), then active/personal gym name. */
export function resolveHomeGymName(
  user?: Pick<User, 'homeGymName'> | null,
  activeGym?: Pick<UserGym, 'name'> | null,
  gyms: Array<Pick<UserGym, 'name' | 'isDefault'>> = []
): string {
  const fromProfile = user?.homeGymName?.trim();
  if (fromProfile) return fromProfile;

  const fromActive = activeGym?.name?.trim();
  if (fromActive && fromActive !== '기본 헬스장') return fromActive;

  const preferred = gyms.find((g) => g.isDefault) ?? gyms[0];
  const fromList = preferred?.name?.trim();
  if (fromList && fromList !== '기본 헬스장') return fromList;

  return '';
}
