
import { Goal, GameConfig } from '../types';
import { GoalSuggestion } from '../services/geminiService';

export const applySuggestionsToGoals = (
  currentGoals: Goal[], 
  suggestions: GoalSuggestion[], 
  config: GameConfig
): Goal[] => {
  const activeMonths = config.activeMonths || 12;
  let updatedGoals = [...currentGoals];

  suggestions.forEach((sug, i) => {
    // Only update if within bounds of existing goals (e.g. user selects 3 suggestions but has 3 slots)
    if (i < updatedGoals.length) {
      
      // Recalculate total if habit
      let finalTargetCount = sug.totalCount || 52;
      const freq = sug.frequency || 'weekly';
      const periodCount = sug.periodCount || 1;

      if (sug.type === 'habit') {
        if (freq === 'weekly') finalTargetCount = Math.round((activeMonths / 12) * 52) * periodCount;
        if (freq === 'monthly') finalTargetCount = activeMonths * periodCount;
      }

      // Helper to generate description text
      let desc = `${sug.description}\n\n[計分方式]: ${sug.breakdown}`;
      if (sug.type === 'habit') {
        const freqMap: Record<string, string> = { 'weekly': '每週', 'monthly': '每月', 'yearly': '每年' };
        const freqStr = freqMap[freq] || '每週';
        desc += `\n[頻率目標]: ${freqStr} ${periodCount}${sug.unit} (約 ${finalTargetCount} ${sug.unit}/年)`;
      }

      // Create the new structure object
      const newStructure = {
        type: sug.type,
        bonusPoints: 0,
        ...(sug.type === 'habit' ? {
            frequency: freq, 
            periodCount: periodCount,
            targetCount: finalTargetCount,
            currentCount: 0,
            unit: sug.unit || '次'
        } : {
            milestones: [
                { id: 'm1', title: '階段 1', points: 20, isCompleted: false },
                { id: 'm2', title: '階段 2', points: 30, isCompleted: false },
                { id: 'm3', title: '完成', points: 50, isCompleted: false },
            ]
        })
      };

      updatedGoals[i] = {
        ...updatedGoals[i],
        title: sug.title,
        description: desc,
        targetScore: sug.targetScore,
        structure: newStructure
      };
    }
  });

  return updatedGoals;
};
