import {
  Role,
  getRoleLevel,
  hasMinRole,
  type ReviewTrainerApplicationInput,
  type TrainerApplicationInput,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { trainerApplicationRepository } from '../repositories/trainer-application.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { emailService } from './email.service.js';
import { notificationService } from './notification.service.js';
import { AppError } from '../middlewares/error.middleware.js';

const devTrainerUserIds = new Set<string>();

function adminNotifyEmail(): string | undefined {
  return process.env.ADMIN_NOTIFY_EMAIL?.trim() || process.env.SMTP_USER?.trim() || undefined;
}

export const trainerApplicationService = {
  async apply(userId: string, input: TrainerApplicationInput) {
    const pool = getPool();
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');

    if (hasMinRole(user.roleCode, Role.TRAINER)) {
      throw new AppError(400, 'ALREADY_TRAINER', 'This account already has trainer privileges');
    }

    if (!pool) {
      devTrainerUserIds.add(userId);
      return {
        approved: true,
        pending: false,
        message: 'Trainer application approved (mock mode)',
        application: null,
        user: { ...user, roleCode: 'trainer' as const },
      };
    }

    const pending = await trainerApplicationRepository.findPendingByUser(userId);
    if (pending) {
      throw new AppError(409, 'APPLICATION_PENDING', 'You already have a pending trainer application');
    }

    const application = await trainerApplicationRepository.create(userId, input);

    const notifyTo = adminNotifyEmail();
    if (notifyTo) {
      const text = [
        'MachineFit 트레이너 인증 신청',
        '',
        `신청 ID: ${application.id}`,
        `신청자: ${application.applicantName}`,
        `연락처: ${application.phone}`,
        `이메일: ${application.email}`,
        `계정 이메일: ${user.email}`,
        `전문분야: ${application.specialties ?? '(없음)'}`,
        `경력: ${application.career ?? '(없음)'}`,
        `자격증: ${application.certifications ?? '(없음)'}`,
        `메시지: ${application.message ?? '(없음)'}`,
        '',
        '관리자 페이지에서 승인/반려해 주세요.',
      ].join('\n');

      try {
        await emailService.send({
          to: notifyTo,
          subject: `[MachineFit] 트레이너 인증 신청 — ${application.applicantName}`,
          text,
        });
      } catch {
        // Application is saved even if email delivery fails.
      }
    }

    return {
      approved: false,
      pending: true,
      message: 'Trainer application submitted. An admin will review it.',
      application,
      user: null,
    };
  },

  async listApplications(status?: 'pending' | 'approved' | 'rejected') {
    return trainerApplicationRepository.list(status);
  },

  async reviewApplication(
    applicationId: string,
    reviewerId: string,
    input: ReviewTrainerApplicationInput
  ) {
    const existing = await trainerApplicationRepository.findById(applicationId);
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Application not found');
    if (existing.status !== 'pending') {
      throw new AppError(400, 'ALREADY_REVIEWED', 'Application was already reviewed');
    }

    const reviewed = await trainerApplicationRepository.review(applicationId, reviewerId, input);
    if (!reviewed) throw new AppError(404, 'NOT_FOUND', 'Application not found');

    if (input.status === 'approved') {
      const applicant = await userRepository.findById(reviewed.userId);
      if (applicant && getRoleLevel(applicant.roleCode) < getRoleLevel(Role.TRAINER)) {
        await trainerApplicationRepository.grantTrainerRole(reviewed.userId);
      }

      await notificationService.notify(
        reviewed.userId,
        'system',
        { ko: '트레이너 인증 승인', en: 'Trainer verification approved' },
        {
          ko: '확인되었습니다. 이제 온라인 PT 트레이너로 활동할 수 있습니다.',
          en: 'Your trainer verification was approved.',
        },
        { linkPath: '/online-pt/manage' }
      );
    } else {
      await notificationService.notify(
        reviewed.userId,
        'system',
        { ko: '트레이너 인증 반려', en: 'Trainer verification rejected' },
        {
          ko: input.adminNote
            ? `신청이 반려되었습니다. 사유: ${input.adminNote}`
            : '신청이 반려되었습니다. 내용을 확인 후 다시 신청해 주세요.',
          en: input.adminNote
            ? `Application rejected: ${input.adminNote}`
            : 'Your trainer application was rejected.',
        },
        { linkPath: '/trainer/apply' }
      );
    }

    return reviewed;
  },
};
