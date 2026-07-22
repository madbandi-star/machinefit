import type { MuscleGroup } from '@/constants/muscle-groups';
import muscleArms from '@/assets/muscle-groups/muscle-arms.png';
import muscleBack from '@/assets/muscle-groups/muscle-back.png';
import muscleBiceps from '@/assets/muscle-groups/muscle-biceps.png';
import muscleChest from '@/assets/muscle-groups/muscle-chest.png';
import muscleCore from '@/assets/muscle-groups/muscle-core.png';
import muscleLegs from '@/assets/muscle-groups/muscle-legs.png';
import muscleShoulders from '@/assets/muscle-groups/muscle-shoulders.png';
import muscleTriceps from '@/assets/muscle-groups/muscle-triceps.png';

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
