import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';
import * as sheetService from '../services/googleSheetSync';

// Declare jest to fix "Cannot use namespace 'jest' as a value"
declare const jest: any;

// --- Mocks ---

// Mock Gemini Service to avoid API calls
jest.mock('../services/geminiService', () => ({
  getGoalAdvice: jest.fn().mockResolvedValue("Mock Advice"),
  analyzeProgress: jest.fn().mockResolvedValue("Mock Analysis"),
  generateGoalSuggestions: jest.fn().mockResolvedValue([]),
  generatePenaltySuggestions: jest.fn().mockResolvedValue([]),
}));

// Mock Google Sheet Service to simulate backend
jest.mock('../services/googleSheetSync');

// Mock localStorage
const localStorageMock = (function() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Game Setup Integration Flow', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    
    // Default Mock Implementation for Sheet Service
    // Cast to any to avoid "Namespace 'global.jest' has no exported member 'Mock'"
    (sheetService.loadFromSheet as any).mockResolvedValue(null); // Initially no data on server
    (sheetService.saveToSheet as any).mockImplementation(async (url: any, state: any) => {
        return state; // Echo back the state as if saved successfully
    });
  });

  test('Complete flow: Create Team -> Config -> Register -> Setup Goals -> Start Game', async () => {
    // 1. Render App
    await act(async () => {
      render(<App />);
    });

    // Check Landing Page
    expect(screen.getByText('🎯 九宮格挑戰')).toBeInTheDocument();

    // 2. Create Team
    const createBtn = screen.getByText('➕ 建立新隊伍');
    fireEvent.click(createBtn);

    // Check Instructions Modal & Enter URL
    expect(screen.getByText('🛠️ 建立新隊伍 (Google Apps Script 設定)')).toBeInTheDocument();
    
    const urlInput = screen.getByPlaceholderText('https://script.google.com/macros/s/...');
    const validUrl = 'https://script.google.com/macros/s/AKfycbx_MockId/exec';
    
    fireEvent.change(urlInput, { target: { value: validUrl } });
    
    const verifyBtn = screen.getByText('驗證並建立隊伍 🚀');
    await act(async () => {
        fireEvent.click(verifyBtn);
    });

    // 3. Configure Game (Solo Mode for simplicity)
    expect(await screen.findByText('遊戲規則')).toBeInTheDocument();
    
    // Set Players to 1
    const playersSlider = screen.getAllByRole('slider')[0]; // First slider is totalPlayers
    fireEvent.change(playersSlider, { target: { value: 1 } });
    
    // Confirm Config
    const startConfigBtn = screen.getByText('開始個人挑戰');
    await act(async () => {
        fireEvent.click(startConfigBtn);
    });

    // 4. Register User
    expect(await screen.findByPlaceholderText('您的暱稱')).toBeInTheDocument();
    
    const nameInput = screen.getByPlaceholderText('您的暱稱');
    fireEvent.change(nameInput, { target: { value: 'SoloPlayer' } });
    
    const joinBtn = screen.getByText('加入遊戲');
    await act(async () => {
        fireEvent.click(joinBtn);
    });

    // 5. Setup Phase
    expect(await screen.findByText('🛠️ 2025 規劃期')).toBeInTheDocument(); // Assuming default year is 2025 or mock activeYear
    expect(screen.getByText('👤 我的設定')).toBeInTheDocument();

    // 5a. Validation Check: Try to click Ready without filling data
    const readyBtn = screen.getByText('🚀 我設定好了！');
    fireEvent.click(readyBtn);
    
    // Should show error alert (Alert Dialog)
    expect(await screen.findByText('⚠️ 設定尚未完成')).toBeInTheDocument();
    expect(screen.getByText('請填寫您的「個人懲罰」項目。')).toBeInTheDocument();
    
    // Close Alert
    const closeAlertBtn = screen.getByText('知道了');
    fireEvent.click(closeAlertBtn);

    // 5b. Fill Penalty
    const penaltyInput = screen.getByPlaceholderText('若未達成...');
    fireEvent.change(penaltyInput, { target: { value: 'No bubble tea' } });

    // 5c. Setup Goal 1
    // Find first goal (initially empty)
    const goalItem = screen.getByText('(點擊以設定目標)'); // Finds the first one
    fireEvent.click(goalItem);

    // Modal should open
    expect(screen.getByText('輸入目標標題...')).toBeInTheDocument();
    
    const titleInput = screen.getByPlaceholderText('輸入目標標題...');
    fireEvent.change(titleInput, { target: { value: 'Goal 1: Read Books' } });
    
    const saveGoalBtn = screen.getByText('保存設定');
    await act(async () => {
        fireEvent.click(saveGoalBtn);
    });

    // Verify Goal 1 is updated in list
    expect(screen.getByText('Goal 1: Read Books')).toBeInTheDocument();

    // Note: Since default goalsPerUser might be 3, we technically need to fill all 3 for validation to pass.
    // However, in our mock test flow or config, we can adjust logic. 
    // But let's just fill the other 2 quickly to pass validation logic.
    const emptyGoals = screen.getAllByText('(點擊以設定目標)');
    for (const emptyG of emptyGoals) {
        fireEvent.click(emptyG);
        const tInput = screen.getByPlaceholderText('輸入目標標題...');
        fireEvent.change(tInput, { target: { value: 'Another Goal' } });
        await act(async () => {
            fireEvent.click(screen.getByText('保存設定'));
        });
    }

    // 5d. Click Ready Successfully
    await act(async () => {
        fireEvent.click(readyBtn);
    });

    // Should now show "Ready" state (button text changes)
    expect(screen.getByText('✅ 已準備完成 (取消)')).toBeInTheDocument();

    // 6. Start Game
    // Since it's solo mode and ready, the start button should appear
    const startGameBtn = await screen.findByText('🔒 鎖定目標，開始個人挑戰！');
    fireEvent.click(startGameBtn);

    // Confirm Dialog
    expect(screen.getByText('確定要鎖定所有目標並開始遊戲嗎？')).toBeInTheDocument();
    const confirmStartBtn = screen.getByText('確定開始');
    
    await act(async () => {
        fireEvent.click(confirmStartBtn);
    });

    // 7. Verify Dashboard (Active Phase)
    expect(await screen.findByText('🔥 執行中')).toBeInTheDocument();
    expect(screen.getByText('Goal 1: Read Books')).toBeInTheDocument();
    expect(screen.getByText('個人挑戰')).toBeInTheDocument(); // Solo badge
  });
});