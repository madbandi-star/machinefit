import type { User, UserGym } from '@machinefit/shared';

const PLACEHOLDER_GYM_NAME = '기본 헬스장';

/**
 * Prefer the currently selected personal gym (home / manage),
 * then profile home gym, then default/first gym in the list.
 */
export function resolveHomeGymName(
  user?: Pick<User, 'homeGymName'> | null,
  activeGym?: Pick<UserGym, 'name'> | null,
  gyms: Array<Pick<UserGym, 'name' | 'isDefault'>> = []
): string {
  const fromActive = activeGym?.name?.trim();
  if (fromActive && fromActive !== PLACEHOLDER_GYM_NAME) return fromActive;

  const fromProfile = user?.homeGymName?.trim();
  if (fromProfile) return fromProfile;

  const preferred = gyms.find((g) => g.isDefault) ?? gyms[0];
  const fromList = preferred?.name?.trim();
  if (fromList && fromList !== PLACEHOLDER_GYM_NAME) return fromList;

  return '';
}
