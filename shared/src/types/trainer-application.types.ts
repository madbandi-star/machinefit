export type TrainerApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface TrainerApplication {
  id: string;
  userId: string;
  applicantName: string;
  phone: string;
  email: string;
  specialties?: string;
  career?: string;
  certifications?: string;
  message?: string;
  status: TrainerApplicationStatus;
  adminNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  /** Joined display fields for admin list */
  userEmail?: string;
  userDisplayName?: string;
}
