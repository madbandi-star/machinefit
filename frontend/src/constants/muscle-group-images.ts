import type { MuscleGroup } from '@/constants/muscle-groups';
import muscleArms from '@/assets/muscle-groups/muscle-arms.webp';
import muscleBack from '@/assets/muscle-groups/muscle-back.webp';
import muscleBiceps from '@/assets/muscle-groups/muscle-biceps.webp';
import muscleChest from '@/assets/muscle-groups/muscle-chest.webp';
import muscleCore from '@/assets/muscle-groups/muscle-core.webp';
import muscleLegs from '@/assets/muscle-groups/muscle-legs.webp';
import muscleShoulders from '@/assets/muscle-groups/muscle-shoulders.webp';
import muscleTriceps from '@/assets/muscle-groups/muscle-triceps.webp';

/** Bundled MachineFit muscle-group cover illustrations (fallback when admin has no upload). */
export const MUSCLE_GROUP_IMAGES: Record<MuscleGroup, string> = {
  back: muscleBack,
  chest: muscleChest,
  legs: muscleLegs,
  shoulders: muscleShoulders,
  biceps: muscleBiceps,
  triceps: muscleTriceps,
  arms: muscleArms,
  core: muscleCore,
};

export function getMuscleGroupImage(group: string): string | undefined {
  if (group in MUSCLE_GROUP_IMAGES) {
    return MUSCLE_GROUP_IMAGES[group as MuscleGroup];
  }
  return undefined;
}
