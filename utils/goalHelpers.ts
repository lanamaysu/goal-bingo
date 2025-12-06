import { Goal, GameConfig } from '../types';
import { GoalSuggestion } from '../services/geminiService';

const HABIT_DEFAULT_TOTAL = 52;

export const isGoalEmpty = (goal: Goal): boolean => {
  return !goal.title || !goal.title.trim() || goal.title.includes('(點擊設定目標)');
};

const buildGoalFromSuggestion = (
  goal: Goal,
  suggestion: GoalSuggestion,
  config: GameConfig
): Goal => {
  const activeMonths = config.activeMonths || 12;

  const frequency = suggestion.frequency || 'weekly';
  const periodCount = suggestion.periodCount || 1;
  let finalTargetCount = suggestion.totalCount || HABIT_DEFAULT_TOTAL;

  if (suggestion.type === 'habit') {
    if (frequency === 'weekly') {
      finalTargetCount = Math.round((activeMonths / 12) * HABIT_DEFAULT_TOTAL) * periodCount;
    }
    if (frequency === 'monthly') {
      finalTargetCount = activeMonths * periodCount;
    }
  }

  let description = `${suggestion.description}\n\n[計分方式]: ${suggestion.breakdown}`;
  if (suggestion.type === 'habit') {
    const freqMap: Record<string, string> = { weekly: '每週', monthly: '每月', yearly: '每年' };
    const freqLabel = freqMap[frequency] || '每週';
    description += `\n[頻率目標]: ${freqLabel} ${periodCount}${suggestion.unit || '次'} (約 ${finalTargetCount} ${suggestion.unit || '次'}/年)`;
  }

  const structure =
    suggestion.type === 'habit'
      ? {
          type: suggestion.type,
          bonusPoints: 0,
          frequency,
          periodCount,
          targetCount: finalTargetCount,
          currentCount: 0,
          unit: suggestion.unit || '次',
        }
      : {
          type: suggestion.type,
          bonusPoints: 0,
          milestones: [
            { id: 'm1', title: '階段 1', points: 20, isCompleted: false },
            { id: 'm2', title: '階段 2', points: 30, isCompleted: false },
            { id: 'm3', title: '完成', points: 50, isCompleted: false },
          ],
        };

  return {
    ...goal,
    title: suggestion.title,
    description,
    targetScore: suggestion.targetScore,
    structure,
  };
};

export interface ApplySuggestionResult {
  updatedGoals: Goal[];
  pending: GoalSuggestion[];
}

export const applySuggestionsToGoals = (
  currentGoals: Goal[],
  suggestions: GoalSuggestion[],
  config: GameConfig
): ApplySuggestionResult => {
  const updatedGoals = [...currentGoals];
  const emptyIndices = updatedGoals.reduce<number[]>((list, goal, index) => {
    if (isGoalEmpty(goal)) list.push(index);
    return list;
  }, []);

  const pending: GoalSuggestion[] = [];
  const emptyQueue = [...emptyIndices];

  suggestions.forEach((suggestion) => {
    if (emptyQueue.length > 0) {
      const targetIndex = emptyQueue.shift()!;
      updatedGoals[targetIndex] = buildGoalFromSuggestion(
        updatedGoals[targetIndex],
        suggestion,
        config
      );
    } else {
      pending.push(suggestion);
    }
  });

  return { updatedGoals, pending };
};

export const replaceGoalWithSuggestion = (
  currentGoals: Goal[],
  index: number,
  suggestion: GoalSuggestion,
  config: GameConfig
): Goal[] => {
  if (index < 0 || index >= currentGoals.length) return currentGoals;
  const updatedGoals = [...currentGoals];
  updatedGoals[index] = buildGoalFromSuggestion(updatedGoals[index], suggestion, config);
  return updatedGoals;
};
