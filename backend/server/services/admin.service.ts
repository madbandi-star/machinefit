import type {
  UpdateUserAdminInput,
  ModeratePostInput,
  VerifyGymInput,
  UpdateMachineRequestAdminInput,
  ResolveReportInput,
  ToggleActiveInput,
} from '@machinefit/shared';
import { adminRepository } from '../repositories/admin.repository.js';
import { notificationService } from './notification.service.js';

export const adminService = {
  dashboard() {
    return adminRepository.dashboard();
  },

  listUsers(page = 1, limit = 20) {
    return adminRepository.listUsers(page, limit);
  },

  updateUser(userId: string, input: UpdateUserAdminInput) {
    return adminRepository.updateUser(userId, input);
  },

  listGyms() {
    return adminRepository.listGyms();
  },

  async verifyGym(gymId: string, input: VerifyGymInput, _adminId: string) {
    const gym = adminRepository.verifyGym(gymId, input);
    if (input.isVerified && gym.ownerId) {
      await notificationService.notify(
        gym.ownerId,
        'gym_verified',
        { en: 'Gym verified!', ko: '헬스장이 인증되었습니다!' },
        { en: `${gym.name} is now verified on MachineFit.`, ko: `${gym.name}이(가) 인증되었습니다.` },
        { gymId: gym.id }
      );
    }
    return gym;
  },

  listBrands() {
    return adminRepository.listBrands();
  },

  updateBrand(brandId: string, input: ToggleActiveInput) {
    return adminRepository.updateBrand(brandId, input);
  },

  listMachines() {
    return adminRepository.listMachines();
  },

  updateMachine(machineId: string, input: ToggleActiveInput) {
    return adminRepository.updateMachine(machineId, input);
  },

  listPosts() {
    return adminRepository.listPosts(true);
  },

  moderatePost(postId: string, input: ModeratePostInput) {
    return adminRepository.moderatePost(postId, input);
  },

  listMachineRequests() {
    return adminRepository.listMachineRequests();
  },

  async updateMachineRequest(id: string, input: UpdateMachineRequestAdminInput) {
    const req = adminRepository.updateMachineRequest(id, input);
    if (input.status === 'approved' || input.status === 'rejected' || input.status === 'added') {
      const statusLabel = input.status.charAt(0).toUpperCase() + input.status.slice(1);
      await notificationService.notify(
        req.userId,
        'machine_request',
        {
          en: `Machine request ${statusLabel}`,
          ko: `기구 요청 ${input.status === 'approved' ? '승인' : input.status === 'rejected' ? '거절' : '추가됨'}`,
        },
        {
          en: `${req.machineName}: ${input.adminNote ?? statusLabel}`,
          ko: `${req.machineName}: ${input.adminNote ?? statusLabel}`,
        },
        { requestId: req.id, status: input.status }
      );
    }
    return req;
  },

  listReports() {
    return adminRepository.listReports();
  },

  resolveReport(id: string, input: ResolveReportInput, adminId: string) {
    return adminRepository.resolveReport(id, input, adminId);
  },
};
