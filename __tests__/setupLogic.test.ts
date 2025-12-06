

// NOTE: This test file requires a standard Jest/Vitest setup.
// It tests the extracted pure functions for validation.

import { validatePersonalSetup, validateGroupSetup } from '../utils/validation';
import { User, Goal, GameConfig } from '../types';

describe('Setup Logic Validation', () => {
  const mockUser: User = {
    id: 'u1', 
    name: 'Test User', 
    colorId: 0, 
    color: 'bg-blue-100', 
    individualPenalty: 'Run 5km', 
    isReady: false
  };

  const mockGoals: Goal[] = [
    { id: 1, userId: 'u1', title: 'Goal 1', description: '', targetScore: 100, currentScore: 0, logs: [], lastUpdated: 0 },
    { id: 2, userId: 'u1', title: 'Goal 2', description: '', targetScore: 100, currentScore: 0, logs: [], lastUpdated: 0 },
  ];

  describe('validatePersonalSetup', () => {
    it('should return null (valid) when all fields are correct', () => {
      const result = validatePersonalSetup(mockUser, mockGoals);
      expect(result).toBeNull();
    });

    it('should return error if individual penalty is missing', () => {
      const invalidUser = { ...mockUser, individualPenalty: '' };
      const result = validatePersonalSetup(invalidUser, mockGoals);
      expect(result).toContain('個人懲罰');
    });

    it('should return error if a goal title is empty', () => {
      const invalidGoals = [...mockGoals];
      invalidGoals[0] = { ...invalidGoals[0], title: '' };
      const result = validatePersonalSetup(mockUser, invalidGoals);
      expect(result).toContain('尚未設定標題');
    });

    it('should return error if a goal title is the placeholder', () => {
      const invalidGoals = [...mockGoals];
      invalidGoals[0] = { ...invalidGoals[0], title: '(點擊設定目標)' };
      const result = validatePersonalSetup(mockUser, invalidGoals);
      expect(result).toContain('尚未設定標題');
    });

    it('should return error if step goal total points is not 100', () => {
      const stepGoals = [{
        ...mockGoals[0],
        structure: {
          type: 'step',
          milestones: [{ id: 'm1', title: 'p1', points: 50, isCompleted: false }]
        }
      }];
      // @ts-ignore - treating goal type as any for test simplicity or fully mock it
      const result = validatePersonalSetup(mockUser, stepGoals as Goal[]);
      expect(result).toContain('里程碑總分不等於 100 分');
    });
  });

  describe('validateGroupSetup', () => {
    const mockConfig: GameConfig = {
      year: '2025', groupPenalty: 'Buy Dinner', groupTargetScore: 500, minLinesForSafe: 1,
      individualSafeScore: 100, gridSize: 3, goalsPerUser: 3, totalPlayers: 3, activeMonths: 12
    };

    it('should return null (valid) when group penalty is set', () => {
      const result = validateGroupSetup(mockConfig);
      expect(result).toBeNull();
    });

    it('should return error if group penalty is missing', () => {
      const invalidConfig = { ...mockConfig, groupPenalty: '' };
      const result = validateGroupSetup(invalidConfig);
      expect(result).toContain('團體懲罰');
    });

    it('should skip group penalty check if totalPlayers is 1 (Solo Mode)', () => {
      const soloConfig = { ...mockConfig, totalPlayers: 1, groupPenalty: '' };
      const result = validateGroupSetup(soloConfig);
      expect(result).toBeNull();
    });
  });
});