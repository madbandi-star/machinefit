import type { TargetMuscleGroup } from '../constants/workout-goals.js';

export type MuscleGroupImageKey = TargetMuscleGroup;

export interface MuscleGroupImageAsset {
  muscleGroup: MuscleGroupImageKey;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  originalFilename: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  width: number | null;
  height: number | null;
  version: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface MuscleGroupImagesState {
  items: MuscleGroupImageAsset[];
}
