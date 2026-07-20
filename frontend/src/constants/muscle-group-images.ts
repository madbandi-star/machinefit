import type { MuscleGroup } from '@/constants/muscle-groups';
import muscleBack from '@/assets/muscle-groups/muscle-back.png';
import muscleChest from '@/assets/muscle-groups/muscle-chest.png';
import muscleLegs from '@/assets/muscle-groups/muscle-legs.png';
import muscleShoulders from '@/assets/muscle-groups/muscle-shoulders.png';

export const MUSCLE_GROUP_IMAGES: Partial<Record<MuscleGroup, string>> = {
  back: muscleBack,
  chest: muscleChest,
  legs: muscleLegs,
  shoulders: muscleShoulders,
};

export function getMuscleGroupImage(group: string): string | undefined {
  if (group in MUSCLE_GROUP_IMAGES) {
    return MUSCLE_GROUP_IMAGES[group as MuscleGroup];
  }
  return undefined;
}
