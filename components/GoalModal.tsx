
import React, { useState, useEffect } from 'react';
import { Goal, User, Log, GoalStructure, Milestone, GoalType } from '../types';
import { getGoalAdvice } from '../services/geminiService';
import BaseModal from './common/BaseModal';
import { Input, TextArea, Select, Button } from './common/FormElements';
import { getUserTheme } from '../utils/themeStyles';
import { useGame } from '../contexts/GameContext';

interface GoalModalProps {
  goal: Goal;
  isSetupPhase: boolean;
  onClose: () => void;
  // onUpdate removed, using Context
}

const GoalModal: React.FC<GoalModalProps> = ({ goal, isSetupPhase, onClose }) => {
  const { gameState, currentUser, updateGoal } = useGame();
  
  // Safe guard access
  if (!gameState || !currentUser) return null;

  const owner = gameState.users.find(u => u.id === goal.userId);
  if (!owner) return null;

  const config = gameState.config;

  // IMPORTANT: Allow edit only if I am the owner OR if we are in Setup phase AND NOT COMPLETE
  const canEdit = currentUser.id === goal.userId && gameState.phase !== 'complete';

  // --- State Setup ---
  const [title, setTitle] = useState(goal.title);
  const [description, setDescription] = useState(goal.description);
  
  // Structure State
  const [goalType, setGoalType] = useState<GoalType>(goal.structure?.type || 'habit');
  
  // Habit State
  const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'yearly'>(
      (goal.structure?.frequency as any) || 'weekly'
  );
  const [periodCount, setPeriodCount] = useState(goal.structure?.periodCount || 1);
  const [targetCount, setTargetCount] = useState(goal.structure?.targetCount || 52);
  const [unit, setUnit] = useState(goal.structure?.unit || '次');
  const [exemptionCount, setExemptionCount] = useState(goal.structure?.exemptionCount || 0);

  // Step State
  const [milestones, setMilestones] = useState<Milestone[]>(goal.structure?.milestones || [
    { id: 'm1', title: '階段一', points: 20, isCompleted: false },
    { id: 'm2', title: '階段二', points: 30, isCompleted: false },
    { id: 'm3', title: '最終達成', points: 50, isCompleted: false },
  ]);

  // Active Phase State
  const [currentCount, setCurrentCount] = useState(goal.structure?.currentCount || 0);
  const [bonusPoints, setBonusPoints] = useState(goal.structure?.bonusPoints || 0);
  const [newLog, setNewLog] = useState('');
  
  // Logs State (Local Buffer)
  const [localLogs, setLocalLogs] = useState<Log[]>(goal.logs || []);

  // AI State
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Validation State
  const [validationError, setValidationError] = useState<string | null>(null);

  // New: Edit Mode for Active Phase (Modifying Targets/Title mid-year)
  const [isEditingSettings, setIsEditingSettings] = useState(false);

  // Sync state if prop changes (External Update)
  useEffect(() => {
      if (goal.logs) setLocalLogs(goal.logs);
  }, [goal.id, goal.logs]); 

  // Theme
  const userTheme = getUserTheme(owner.colorId);

  // Determine if we show the setup form (either we are in setup phase, or user enabled editing)
  const showSetupForm = isSetupPhase || isEditingSettings;

  // --- Logic Helpers ---

  // Auto-calculate annual target based on frequency * periodCount - exemption
  useEffect(() => {
    // Calculate if in setup OR if editing settings
    if (showSetupForm && canEdit) {
      const activeMonths = config.activeMonths || 12;
      let multiplier = 1;

      // Base Multiplier Calculation
      if (frequency === 'weekly') {
         // Approximate weeks in active months
         multiplier = Math.round((activeMonths / 12) * 52);
      } else if (frequency === 'monthly') {
          multiplier = activeMonths;
      } else if (frequency === 'yearly') {
          multiplier = 1;
      }
      
      // Apply Exemption (Buffer)
      // Ensure we don't go below 1 period if possible, or 0 if user wants to skip everything
      const effectiveMultiplier = Math.max(0, multiplier - exemptionCount);
      
      setTargetCount(effectiveMultiplier * periodCount);
    }
  }, [frequency, periodCount, exemptionCount, showSetupForm, config.activeMonths, canEdit]);

  // Helper: Calculate score based on CURRENT local state
  const calculateLocalScore = () => {
    let baseScore = 0;
    if (goalType === 'habit') {
        const calculated = (currentCount / (targetCount || 1)) * 100;
        baseScore = Math.min(100, calculated);
    } else if (goalType === 'step') {
        baseScore = milestones.filter(m => m.isCompleted).reduce((sum, m) => sum + m.points, 0);
    } else {
        return goal.currentScore;
    }
    return Math.round((baseScore + bonusPoints) * 10) / 10;
  };

  // Helper: Save and close
  const handleSave = () => {
    if (!canEdit) return;

    // Reset validation error
    setValidationError(null);

    // 1. Validate Title
    if (!title || !title.trim()) {
        setValidationError("請設定目標標題");
        return;
    }

    // 2. Validate Structure
    if (goalType === 'habit') {
        if (!periodCount || periodCount <= 0) {
            setValidationError("頻率次數必須大於 0");
            return;
        }
        if (!unit || !unit.trim()) {
            setValidationError("請設定單位 (例如：次、小時)");
            return;
        }
    } else if (goalType === 'step') {
        const totalPoints = milestones.reduce((sum, m) => sum + (m.points || 0), 0);
        if (totalPoints !== 100) {
            setValidationError(`里程碑總分必須等於 100 分 (目前: ${totalPoints} 分)`);
            return;
        }
        if (milestones.some(m => !m.title.trim())) {
             setValidationError("所有里程碑都必須設定名稱");
             return;
        }
    }

    const structure: GoalStructure = {
      type: goalType,
      bonusPoints: bonusPoints,
      // Include all habit/step fields based on current local state
      ...(goalType === 'habit' ? {
          frequency, periodCount, targetCount, unit,
          exemptionCount, // Save the buffer
          currentCount: currentCount 
      } : {
          milestones: milestones
      })
    };

    const newScore = calculateLocalScore();

    const updatedGoal: Goal = { 
      ...goal, 
      title,
      description,
      targetScore: 100, 
      currentScore: newScore,
      structure,
      logs: localLogs, // Save the locally accumulated logs
      lastUpdated: Date.now()
    };
    
    // Call update via Context
    updateGoal(updatedGoal);
    onClose();
  };

  // Helper: Add log to local state
  const addLocalLog = (msg: string) => {
      const logEntry: Log = {
          id: Date.now().toString() + Math.random().toString().slice(2, 5),
          date: new Date().toLocaleDateString(),
          content: msg
      };
      setLocalLogs(prev => [logEntry, ...prev]);
  };

  const handleAddManualLog = () => {
    if (!newLog.trim() || !canEdit) return;
    addLocalLog(newLog);
    setNewLog('');
  };

  // --- Habit Actions (Local Update Only) ---
  const incrementHabit = (amount: number) => {
    if (!canEdit) return;
    const newCount = Math.max(0, currentCount + amount);
    setCurrentCount(newCount); // Update UI
    
    // Add Log Locally
    addLocalLog(`${amount > 0 ? '完成' : '修正'} ${Math.abs(amount)} ${unit} (累計: ${newCount}/${targetCount})`);
  };

  // --- Step Actions (Local Update Only) ---
  const toggleMilestone = (id: string) => {
    if (!canEdit) return;
    
    const updatedMilestones = milestones.map(item => item.id === id ? { ...item, isCompleted: !item.isCompleted } : item);
    const changedItem = updatedMilestones.find(m => m.id === id);
    
    setMilestones(updatedMilestones); // Update UI

    if (changedItem) {
        addLocalLog(changedItem.isCompleted 
            ? `達成階段目標：${changedItem.title} (+${changedItem.points}分)`
            : `取消階段目標：${changedItem.title}`
        );
    }
  };

  // For setup phase editing (local only)
  const updateMilestone = (index: number, field: keyof Milestone, value: any) => {
      const newM = [...milestones];
      newM[index] = { ...newM[index], [field]: value };
      setMilestones(newM);
  };

  const addMilestone = () => {
      setMilestones([...milestones, { id: `m_${Date.now()}`, title: '', points: 0, isCompleted: false }]);
  };

  const removeMilestone = (index: number) => {
      setMilestones(milestones.filter((_, i) => i !== index));
  };

  // --- AI ---
  const fetchAdvice = async () => {
    setLoadingAi(true);
    const advice = await getGoalAdvice(goal);
    setAiAdvice(advice);
    setLoadingAi(false);
  };

  // Render Helpers
  const totalMilestonePoints = milestones.reduce((sum, m) => sum + (m.points || 0), 0);
  const currentTotalScore = calculateLocalScore(); // Use local state for display
  const pointsPerUnit = targetCount > 0 ? 100 / targetCount : 0;
  const getFrequencyLabel = () => {
      if (frequency === 'weekly') return '週';
      if (frequency === 'monthly') return '月';
      return '次';
  };

  return (
    <BaseModal
        isOpen={true}
        onClose={onClose}
        maxWidth="lg"
        title={
            <div className="flex justify-between items-center w-full gap-3">
                <div className="flex-1 min-w-0">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${userTheme.badge} mb-1 inline-block`}>
                        {owner.name}
                    </span>
                    
                    {showSetupForm ? (
                        <div className="mt-1">
                            <Input 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                readOnly={!canEdit}
                                placeholder="輸入目標標題..."
                                className="text-lg font-bold"
                            />
                        </div>
                    ) : (
                        <div className="mt-1">
                            <h2 className="text-xl font-bold text-brand-petrol dark:text-white leading-tight">{goal.title}</h2>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] px-2 py-1 rounded-md bg-brand-petrol text-brand-mint font-bold flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[10px]">{goal.structure?.type === 'habit' ? 'calendar_today' : 'flag'}</span>
                                    {goal.structure?.type === 'habit' ? '規律型' : '階段型'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Allow switching to edit mode in Active Phase */}
                {!isSetupPhase && canEdit && (
                    <button 
                        onClick={() => setIsEditingSettings(!isEditingSettings)}
                        className={`flex-shrink-0 whitespace-nowrap p-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${isEditingSettings ? 'bg-brand-rust/10 text-brand-rust' : 'bg-brand-mint/20 text-brand-teal'}`}
                    >
                        <span className="material-symbols-outlined text-[16px]">{isEditingSettings ? 'close' : 'edit'}</span>
                        {isEditingSettings ? '取消修改' : '修改設定'}
                    </button>
                )}
            </div>
        }
        footer={
            <div className="flex flex-col w-full gap-3">
                {validationError && (
                    <div className="bg-white dark:bg-brand-rust/10 border border-brand-rust dark:border-brand-rust/30 text-brand-rust text-xs font-bold p-2.5 rounded-lg flex items-center gap-2 animate-fade-in shadow-sm">
                        <span className="material-symbols-outlined text-[16px]">error</span>
                        {validationError}
                    </div>
                )}
                <div className="flex justify-end gap-3 w-full">
                    <Button variant="secondary" onClick={onClose}>取消</Button>
                    {canEdit && (
                        <Button onClick={handleSave}>
                            <span className="material-symbols-outlined text-[16px]">save</span> 保存
                        </Button>
                    )}
                </div>
            </div>
        }
    >
        {/* --- SETUP PHASE OR EDITING MODE CONTENT --- */}
        {showSetupForm && (
            <div className="space-y-6">
                 {/* Warning for editing in Active Phase */}
                 {isEditingSettings && (
                     <div className="p-3 bg-brand-rust/10 border border-brand-rust/20 rounded-xl text-brand-rust text-xs font-bold flex gap-2">
                         <span className="material-symbols-outlined text-[16px]">warning</span>
                         <span>注意：在進行中修改目標設定可能會影響目前得分與進度計算。</span>
                     </div>
                 )}

                {/* 1. Goal Type Selection */}
                {canEdit && (
                    <div>
                        <label className="block text-xs font-black text-brand-teal uppercase tracking-wider mb-2">目標類型</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => setGoalType('habit')}
                                className={`p-4 rounded-xl border-2 text-center transition-all flex flex-col items-center gap-2 ${goalType === 'habit' ? 'border-brand-teal bg-brand-teal/10 text-brand-petrol dark:text-brand-mint' : 'border-brand-mint/20 bg-white dark:bg-black/20 hover:border-brand-teal/50 dark:text-gray-400'}`}
                            >
                                <span className="material-symbols-outlined text-[24px] mb-1">calendar_today</span>
                                <div className="font-bold text-sm">規律型</div>
                            </button>
                            <button 
                                onClick={() => setGoalType('step')}
                                className={`p-4 rounded-xl border-2 text-center transition-all flex flex-col items-center gap-2 ${goalType === 'step' ? 'border-brand-rust bg-brand-rust/10 text-brand-rust' : 'border-brand-mint/20 bg-white dark:bg-black/20 hover:border-brand-rust/50 dark:text-gray-400'}`}
                            >
                                <span className="material-symbols-outlined text-[24px] mb-1">flag</span>
                                <div className="font-bold text-sm">階段型</div>
                            </button>
                        </div>
                    </div>
                )}

                {/* 2. Type Specific Config */}
                {goalType === 'habit' && (
                    <div className="bg-brand-mint/10 dark:bg-black/20 p-5 rounded-xl border border-brand-mint/20 dark:border-brand-teal/10 space-y-4">
                        {/* Improved Grid Layout for Frequency inputs */}
                        <div className="grid grid-cols-[minmax(90px,1.5fr)_auto_1fr_1fr] gap-3 items-end">
                            <div>
                                <Select 
                                    label="頻率"
                                    value={frequency} 
                                    disabled={!canEdit}
                                    onChange={(e) => setFrequency(e.target.value as any)}
                                >
                                    <option value="weekly">每週</option>
                                    <option value="monthly">每月</option>
                                    <option value="yearly">每年</option>
                                </Select>
                            </div>
                            <div className="pb-3 text-sm text-brand-petrol dark:text-brand-teal font-bold">至少</div>
                            <div>
                                <Input 
                                    type="number"
                                    min="1"
                                    label="次數"
                                    disabled={!canEdit}
                                    value={periodCount}
                                    onChange={(e) => setPeriodCount(Math.max(1, parseInt(e.target.value) || 0))}
                                    className="text-center"
                                />
                            </div>
                            <div>
                                <Input 
                                    value={unit}
                                    label="單位"
                                    disabled={!canEdit}
                                    onChange={(e) => setUnit(e.target.value)}
                                    placeholder="次/小時"
                                    className="text-center"
                                />
                            </div>
                        </div>

                        {frequency !== 'yearly' && (
                             <div className="flex items-center gap-3">
                                <label className="text-xs font-bold text-brand-teal whitespace-nowrap">允許請假 (Buffer):</label>
                                <div className="w-20">
                                    <Input 
                                        type="number"
                                        min="0"
                                        disabled={!canEdit}
                                        value={exemptionCount}
                                        onChange={(e) => setExemptionCount(Math.max(0, parseInt(e.target.value) || 0))}
                                        className="text-center text-brand-rust"
                                    />
                                </div>
                                <span className="text-sm text-gray-400">{getFrequencyLabel()}不計分</span>
                             </div>
                        )}

                        <div className="bg-white/50 dark:bg-black/20 p-3 rounded-xl flex justify-between items-center border border-white/20 dark:border-white/5">
                             <div>
                                 <div className="text-[10px] text-brand-teal font-bold uppercase tracking-wider">年度總目標</div>
                                 <div className="text-lg font-black text-brand-petrol dark:text-brand-mint">
                                     {targetCount} {unit}
                                 </div>
                             </div>
                             <div className="text-right text-[10px] text-gray-400">
                                每{unit}約 {pointsPerUnit.toFixed(2)} 分
                             </div>
                        </div>
                    </div>
                )}

                {goalType === 'step' && (
                     <div className="bg-brand-mint/10 dark:bg-black/20 p-5 rounded-xl border border-brand-mint/20 space-y-3">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-bold text-brand-teal">里程碑規劃</label>
                            <span className={`text-xs font-bold ${totalMilestonePoints === 100 ? 'text-brand-teal' : 'text-brand-rust'}`}>
                                總分: {totalMilestonePoints}/100
                            </span>
                        </div>
                        
                        <div className="space-y-2">
                            {milestones.map((m, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <Input 
                                        readOnly={!canEdit}
                                        value={m.title}
                                        onChange={(e) => updateMilestone(idx, 'title', e.target.value)}
                                        placeholder="里程碑名稱..."
                                    />
                                    <div className="w-20">
                                        <Input 
                                            type="number"
                                            readOnly={!canEdit}
                                            value={m.points}
                                            onChange={(e) => updateMilestone(idx, 'points', parseInt(e.target.value) || 0)}
                                            placeholder="分數"
                                            className="text-center"
                                        />
                                    </div>
                                    {canEdit && (
                                        <button onClick={() => removeMilestone(idx)} className="text-gray-400 hover:text-brand-rust px-1">
                                            <span className="material-symbols-outlined text-[20px]">close</span>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        {canEdit && (
                            <Button variant="secondary" onClick={addMilestone} className="w-full border-dashed">
                                + 新增里程碑
                            </Button>
                        )}
                     </div>
                )}

                <TextArea 
                    label="詳細說明 / 備註"
                    value={description}
                    readOnly={!canEdit}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="補充說明執行細節..."
                    className="h-24"
                />
            </div>
        )}

        {/* --- ACTIVE PHASE CONTENT --- */}
        {!showSetupForm && (
        <div className="space-y-6">
            {/* Score Display */}
            <div className="flex items-center justify-between bg-brand-petrol dark:bg-brand-dark text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <div className="text-[10px] opacity-70 uppercase tracking-widest font-bold mb-1">Current Score</div>
                    <div className="text-4xl font-black font-mono tracking-tight">
                        {currentTotalScore}<span className="text-lg opacity-50 font-medium">/100</span>
                    </div>
                </div>
                <div className="text-right relative z-10">
                    <div className="text-[10px] opacity-70 uppercase tracking-widest font-bold mb-1">Bonus</div>
                    {currentTotalScore >= 100 && canEdit ? (
                        <div className="flex items-center gap-1">
                             <span className="material-symbols-outlined text-[16px] text-brand-mint">add</span>
                             <input 
                                type="number" 
                                value={bonusPoints}
                                onChange={(e) => setBonusPoints(parseFloat(e.target.value) || 0)}
                                className="w-16 bg-white/10 border border-white/20 rounded-lg text-center text-white font-mono p-1"
                             />
                        </div>
                    ) : (
                        <div className={`font-mono font-bold text-2xl ${bonusPoints > 0 ? 'text-brand-mint' : 'text-gray-500'}`}>
                            +{bonusPoints}
                        </div>
                    )}
                </div>
                <div className="absolute right-0 bottom-0 w-32 h-32 bg-brand-teal/20 rounded-full blur-2xl -mr-10 -mb-10 pointer-events-none"></div>
            </div>

            {/* Tracking Interface */}
            <div>
                {goalType === 'habit' && (
                    <div className="bg-brand-mint/10 dark:bg-black/20 p-6 rounded-3xl border border-brand-mint/20 text-center">
                        <div className="flex items-center justify-center gap-6 mb-6">
                            {canEdit && (
                                <button 
                                    onClick={() => incrementHabit(-1)}
                                    className="w-12 h-12 rounded-full bg-white dark:bg-brand-dark border-2 border-brand-teal/20 text-brand-teal hover:border-brand-teal hover:text-brand-petrol transition-all flex items-center justify-center flex-shrink-0"
                                >
                                    <span className="material-symbols-outlined text-[20px]">remove</span>
                                </button>
                            )}
                            <div className="text-center">
                                {/* Direct Input for Bulk Progress Update */}
                                {canEdit ? (
                                    <div className="relative group">
                                         <input 
                                            type="number"
                                            value={currentCount.toString()}
                                            onChange={(e) => setCurrentCount(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="text-5xl font-black text-brand-petrol dark:text-white font-mono tracking-tighter bg-transparent text-center w-32 outline-none border-b-2 border-transparent focus:border-brand-teal/50 hover:border-brand-teal/20 transition-all"
                                         />
                                         <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            <span className="material-symbols-outlined text-gray-400 text-[14px]">edit</span>
                                         </div>
                                    </div>
                                ) : (
                                    <div className="text-5xl font-black text-brand-petrol dark:text-white font-mono tracking-tighter">{currentCount}</div>
                                )}
                                
                                <div className="text-xs text-brand-teal font-bold uppercase tracking-wider mt-1">/ {targetCount} {unit}</div>
                            </div>
                            {canEdit && (
                                <button 
                                    onClick={() => incrementHabit(1)}
                                    className="w-20 h-20 rounded-full bg-brand-petrol text-brand-mint shadow-xl hover:bg-brand-petrol/90 hover:scale-105 transition-all flex items-center justify-center flex-shrink-0"
                                >
                                    <span className="material-symbols-outlined text-[32px]">add</span>
                                </button>
                            )}
                        </div>
                        <div className="w-full bg-white dark:bg-brand-dark h-3 rounded-full overflow-hidden shadow-inner">
                            <div className="bg-brand-teal h-full transition-all duration-500 ease-out" style={{ width: `${Math.min(100, (currentCount/targetCount)*100)}%` }}></div>
                        </div>
                    </div>
                )}

                {goalType === 'step' && (
                    <div className="space-y-3">
                        {milestones.map((m) => (
                            <label key={m.id} className={`flex items-center p-4 rounded-2xl border-2 transition-all ${m.isCompleted ? 'bg-brand-mint/20 border-brand-mint dark:bg-brand-mint/10' : 'bg-white dark:bg-brand-surface border-gray-100 dark:border-brand-dark'} ${canEdit ? 'cursor-pointer hover:border-brand-teal/30' : 'cursor-default'}`}>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 transition-colors ${m.isCompleted ? 'bg-brand-mint border-brand-mint text-brand-petrol' : 'border-gray-300 dark:border-brand-teal/30'}`}>
                                    {m.isCompleted && <span className="material-symbols-outlined text-[16px]">check_circle</span>}
                                </div>
                                <input 
                                    type="checkbox" 
                                    className="hidden" 
                                    checked={m.isCompleted} 
                                    disabled={!canEdit}
                                    onChange={() => toggleMilestone(m.id)}
                                />
                                <div className="flex-1">
                                    <div className={`font-bold ${m.isCompleted ? 'text-brand-petrol dark:text-brand-mint' : 'text-gray-700 dark:text-gray-300'}`}>{m.title}</div>
                                </div>
                                <div className="font-mono font-bold text-gray-400 bg-gray-100 dark:bg-black/20 px-2 py-1 rounded-lg text-xs">
                                    {m.points}pt
                                </div>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* AI & Logs - Updated to Vintage Purple */}
            <div className="space-y-4">
                <div className="p-4 bg-brand-purple/5 dark:bg-brand-purple/10 rounded-2xl border border-brand-purple/10 dark:border-brand-purple/20">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-bold text-brand-purple dark:text-purple-200 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">auto_awesome</span> AI 教練</h3>
                        <button 
                            onClick={fetchAdvice} 
                            disabled={loadingAi}
                            className="text-xs bg-white dark:bg-brand-purple/20 text-brand-purple dark:text-purple-100 px-3 py-1.5 rounded-full shadow-sm hover:shadow"
                        >
                            {loadingAi ? '思考中...' : '給點建議'}
                        </button>
                    </div>
                    {aiAdvice && <p className="text-sm text-brand-purple/90 dark:text-purple-200 italic leading-relaxed">"{aiAdvice}"</p>}
                </div>

                <div>
                     {canEdit && (
                        <div className="flex gap-2 mb-3">
                            <Input
                                value={newLog}
                                onChange={(e) => setNewLog(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleAddManualLog();
                                }}
                                placeholder="寫下備註..."
                            />
                            <Button onClick={handleAddManualLog} className="whitespace-nowrap">紀錄</Button>
                        </div>
                     )}
                     <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {localLogs.map(log => (
                            <div key={log.id} className="text-xs bg-gray-50 dark:bg-black/20 p-3 rounded-xl border border-gray-100 dark:border-white/5 flex gap-3 text-gray-600 dark:text-gray-300">
                                <span className="font-mono text-gray-400 opacity-70 whitespace-nowrap">{log.date}</span>
                                <span>{log.content}</span>
                            </div>
                        ))}
                     </div>
                </div>
            </div>
        </div>
        )}
    </BaseModal>
  );
};

export default GoalModal;
