import React, { useState, useMemo } from 'react';
import {
  generateGoalSuggestions,
  generatePenaltySuggestions,
  GoalSuggestion,
} from '../services/geminiService';
import BaseModal from './common/BaseModal';
import { Input, Button } from './common/FormElements';

interface BrainstormModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetName: string; // User Name or "Group/Penalty"
  mode: 'goal' | 'penalty';
  maxSelectable?: number; // New prop for dynamic limit
  onApplyGoal?: (suggestions: GoalSuggestion[]) => void;
  onApplyPenalty?: (penalty: string) => void;
}

const BrainstormModal: React.FC<BrainstormModalProps> = ({
  isOpen,
  onClose,
  targetName,
  mode,
  maxSelectable = 3,
  onApplyGoal,
  onApplyPenalty,
}) => {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // State for Goals
  const [goalSuggestions, setGoalSuggestions] = useState<GoalSuggestion[]>([]);
  const [selectedGoalIndices, setSelectedGoalIndices] = useState<number[]>([]);

  // Memoize selectedGoalIndices as a Set for O(1) lookup instead of O(n) includes
  const selectedIndicesSet = useMemo(() => new Set(selectedGoalIndices), [selectedGoalIndices]);

  // State for Penalties
  const [penaltySuggestions, setPenaltySuggestions] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setError('');

    // Clear previous results while loading
    if (mode === 'goal') {
      setGoalSuggestions([]);
      setSelectedGoalIndices([]);
    } else {
      setPenaltySuggestions([]);
    }

    try {
      let hasResults = false;
      if (mode === 'goal') {
        const results = await generateGoalSuggestions(keyword);
        setGoalSuggestions(results);
        hasResults = results.length > 0;
      } else {
        const results = await generatePenaltySuggestions(keyword);
        setPenaltySuggestions(results);
        hasResults = results.length > 0;
      }

      if (!hasResults) {
        setError('AI 無法生成內容，請稍後再試。');
      }
    } catch (e: any) {
      console.error(e);
      if (e.message === '請先設定 API Key') {
        setError('請先至右上角「設定」輸入 Gemini API Key');
      } else {
        setError('發生未知錯誤，請確認 API Key 是否有效。');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleGoalSelection = (index: number) => {
    setSelectedGoalIndices((prev) => {
      // Use Set for O(1) has check instead of O(n) includes
      if (selectedIndicesSet.has(index)) {
        return prev.filter((i) => i !== index);
      } else {
        if (prev.length >= maxSelectable) return prev; // Use dynamic limit
        return [...prev, index];
      }
    });
  };

  const applySelectedGoals = () => {
    const selected = selectedGoalIndices.map((i) => goalSuggestions[i]);
    onApplyGoal?.(selected);
    resetAndClose();
  };

  const resetAndClose = () => {
    setGoalSuggestions([]);
    setPenaltySuggestions([]);
    setSelectedGoalIndices([]);
    setKeyword('');
    setError('');
    setLoading(false);
    onClose();
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'step':
        return (
          <span className="bg-brand-rust/10 text-accent text-[10px] px-1.5 py-0.5 rounded border border-brand-rust/20">
            階段型
          </span>
        );
      case 'habit':
        return (
          <span className="bg-brand-teal/10 text-accent text-[10px] px-1.5 py-0.5 rounded border border-brand-teal/20">
            規律型
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={resetAndClose}
      title={
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-accent dark:text-purple-300">
            <span className="material-symbols-outlined">auto_awesome</span>
            AI 靈感助手
          </div>
          <span className="text-xs font-normal text-accent/70 dark:text-purple-300/70 mt-1">
            {mode === 'goal' ? `目標設定 (最多選 ${maxSelectable} 個)` : '懲罰發想'}
          </span>
        </div>
      }
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="secondary" onClick={resetAndClose}>
            取消
          </Button>
          {mode === 'goal' && (
            <Button
              onClick={applySelectedGoals}
              disabled={selectedGoalIndices.length === 0}
              className="bg-brand-purple border-transparent text-white"
            >
              {selectedGoalIndices.length > 0 ? `套用 (${selectedGoalIndices.length})` : '請選擇'}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-accent dark:text-purple-200">
          {mode === 'goal'
            ? `輸入興趣，AI 將提供包含計分建議的目標方案...`
            : `幫 ${targetName} 發想一些有趣的懲罰...`}
        </p>

        <div className="flex gap-2">
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={
              mode === 'goal' ? '興趣關鍵字 (如：烹飪、馬拉松)' : '關鍵字 (如：請客、運動)'
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                handleGenerate();
              }
            }}
            className="focus:border-brand-purple"
          />
          <Button
            onClick={handleGenerate}
            disabled={loading || !keyword.trim()}
            className="whitespace-nowrap bg-brand-purple text-white shadow-none"
          >
            {loading ? '生成中...' : '發想'}
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-white dark:bg-brand-rust/10 border border-brand-rust dark:border-brand-rust/20 text-accent text-xs rounded-xl flex items-center gap-2 shadow-sm animate-fade-in">
            <span className="material-symbols-outlined text-[14px]">error</span> {error}
          </div>
        )}

        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {/* Goal Suggestions */}
          {mode === 'goal' &&
            goalSuggestions.map((s, idx) => {
              const isSelected = selectedIndicesSet.has(idx);
              return (
                <div
                  key={idx}
                  onClick={() => toggleGoalSelection(idx)}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-brand-purple bg-brand-purple/10' : 'border-brand-mint/20 bg-white dark:bg-black/20 dark:border-white/10'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-brand-purple border-brand-purple' : 'border-brand-purple/30 bg-white dark:bg-transparent'}`}
                      >
                        {isSelected && (
                          <span className="text-white text-xs material-symbols-outlined text-[12px]">
                            check
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-accent dark:text-accent text-sm">
                        {s.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {getTypeBadge(s.type)}
                      <span className="text-[10px] font-bold bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded text-accent/60 border border-accent/10">
                        /{s.targetScore}分
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-accent/70 dark:text-accent/70 pl-6 mb-1">
                    {s.description}
                  </div>
                  <div className="text-[10px] text-accent pl-6 p-1 rounded inline-block font-mono">
                    計分：{s.breakdown}
                  </div>
                </div>
              );
            })}

          {/* Penalty Suggestions */}
          {mode === 'penalty' &&
            penaltySuggestions.map((s, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-4 p-3 bg-white dark:bg-brand-rust/20 rounded-xl border border-brand-rust/10 dark:border-brand-rust/30 group"
              >
                <div className="text-sm text-accent dark:text-orange-200 font-medium flex-1">
                  {s}
                </div>
                <Button
                  variant="danger"
                  onClick={() => {
                    onApplyPenalty?.(s);
                    resetAndClose();
                  }}
                  className="px-2 py-1 text-xs h-auto whitespace-nowrap flex-shrink-0"
                >
                  選用
                </Button>
              </div>
            ))}

          {(mode === 'goal' ? goalSuggestions.length === 0 : penaltySuggestions.length === 0) &&
            !loading &&
            !error && (
              <div className="text-center text-accent/50 text-xs py-8 border-2 border-dashed border-brand-purple/30 rounded-xl">
                輸入關鍵字後，點擊「發想」按鈕
              </div>
            )}

          {loading && (
            <div className="text-center text-accent text-xs py-8 animate-pulse flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-[24px]">psychology</span>
              正在詢問 Gemini 大神...
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
};

export default BrainstormModal;
