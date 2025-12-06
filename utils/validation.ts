
import { User, Goal, GameConfig } from '../types';

export const validatePersonalSetup = (user: User, userGoals: Goal[]): string | null => {
  // 1. Check Penalty
  if (!user.individualPenalty || !user.individualPenalty.trim()) {
    return "請填寫您的「個人懲罰」項目。";
  }

  // 2. Check Goals
  for (let i = 0; i < userGoals.length; i++) {
    const g = userGoals[i];
    // Check title: Must be non-empty and not the placeholder
    if (!g.title || !g.title.trim() || g.title.includes('(點擊設定目標)')) {
      return `目標 ${i + 1} 尚未設定標題。`;
    }

    // Check Structure Validity for Step goals
    if (g.structure?.type === 'step') {
      const totalPoints = g.structure.milestones?.reduce((sum, m) => sum + m.points, 0) || 0;
      if (totalPoints !== 100) {
        return `目標「${g.title}」是階段型，但里程碑總分不等於 100 分。`;
      }
    }
  }
  return null;
};

export const validateGroupSetup = (config: GameConfig): string | null => {
  // In solo mode, group penalty is not required
  if (config.totalPlayers === 1) return null;

  if (!config.groupPenalty || !config.groupPenalty.trim()) {
    return "請設定「團體懲罰」項目。";
  }
  return null;
};
