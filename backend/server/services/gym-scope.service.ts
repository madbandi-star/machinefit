import { userGymRepository } from '../repositories/user-gym.repository.js';
import { gymMemberRepository } from '../repositories/gym-member.repository.js';
import { AppError } from '../middlewares/error.middleware.js';
import { isAllGymsId } from '@machinefit/shared';

export const gymScopeService = {
  /**
   * Resolves a gymId ('all' or real UUID) into a list of gym IDs the user owns.
   * Returns null gymIds when not filtering by gym (all).
   */
  async resolveGymFilter(
    userId: string,
    gymId: string
  ): Promise<{ gymIds: string[] | null }> {
    if (isAllGymsId(gymId)) {
      const gyms = await userGymRepository.listByUser(userId);
      return { gymIds: gyms.map((g) => g.id) };
    }
    // validate ownership
    await this.assertOwned(userId, gymId);
    return { gymIds: [gymId] };
  },

  async assertOwned(userId: string, gymId: string): Promise<void> {
    const gym = await userGymRepository.findByIdForUser(userId, gymId);
    if (!gym) throw new AppError(403, 'FORBIDDEN', 'Gym does not belong to this user');
  },

  /**
   * Asserts the member belongs to a gym owned by the user.
   */
  async assertMemberOwned(userId: string, memberId: string): Promise<void> {
    const member = await gymMemberRepository.findById(memberId);
    if (!member || member.ownerUserId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'Member does not belong to this user');
    }
  },

  /**
   * Resolves member for write operations (real gymId required).
   * Asserts gym ownership and member ownership.
   */
  async resolveMemberForWrite(
    userId: string,
    gymId: string,
    memberId: string
  ): Promise<void> {
    await this.assertOwned(userId, gymId);
    const member = await gymMemberRepository.findById(memberId);
    if (!member || member.ownerUserId !== userId || member.gymId !== gymId) {
      throw new AppError(403, 'FORBIDDEN', 'Member does not belong to this gym');
    }
  },
};
