
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import App from '../App';
import * as sheetService from '../services/googleSheetSync';
import { SWRConfig } from 'swr';

// --- Mocks ---

// Mock Gemini Service
vi.mock('../services/geminiService', () => ({
  getGoalAdvice: vi.fn().mockResolvedValue("Mock Advice"),
  analyzeProgress: vi.fn().mockResolvedValue("Mock Analysis"),
  generateGoalSuggestions: vi.fn().mockResolvedValue([]),
  generatePenaltySuggestions: vi.fn().mockResolvedValue([]),
}));

// Mock Google Sheet Service
vi.mock('../services/googleSheetSync');

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

// Helper to clear SWR cache between tests
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
    {children}
  </SWRConfig>
);

describe('Game Setup Integration Flow', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    
    // Default Mock Implementation for Sheet Service
    vi.mocked(sheetService.loadFromSheet).mockResolvedValue(null); // Initially no data on server
    vi.mocked(sheetService.saveToSheet).mockImplementation(async (url: any, state: any) => {
        return state; // Echo back the state as if saved successfully
    });
    // Mock fetchYears to avoid error in useBingoGame
    vi.mocked(sheetService.fetchAvailableYears).mockResolvedValue([]);
  });

  it('Complete flow: Create Team -> Config -> Register -> Setup Goals -> Start Game', async () => {
    // 1. Render App with SWR cache cleared
    await act(async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );
    });

    // Check Landing Page
    expect(screen.getByText('年度九宮格')).toBeInTheDocument();

    // 2. Create Team
    const createBtn = screen.getByText('建立新隊伍');
    fireEvent.click(createBtn);

    // Check Instructions Modal & Enter URL
    expect(screen.getByText(/建立新隊伍 \(Google Apps Script 設定\)/i)).toBeInTheDocument();
    
    const urlInput = screen.getByPlaceholderText('https://script.google.com/macros/s/...');
    const validUrl = 'https://script.google.com/macros/s/AKfycbx_MockId/exec';
    
    fireEvent.change(urlInput, { target: { value: validUrl } });
    
    // Using a more flexible matcher for the button text which includes an icon
    const verifyBtn = screen.getByRole('button', { name: /驗證並建立隊伍/i });
    await act(async () => {
        fireEvent.click(verifyBtn);
    });

    // 3. Configure Game (Solo Mode for simplicity)
    expect(await screen.findByText(/遊戲規則設定/i)).toBeInTheDocument();
    
    // Set Players to 1
    const playersSlider = screen.getAllByRole('slider')[0]; // First slider is totalPlayers
    fireEvent.change(playersSlider, { target: { value: 1 } });
    
    // Confirm Config
    const startConfigBtn = screen.getByRole('button', { name: /開始個人挑戰/i });
    await act(async () => {
        fireEvent.click(startConfigBtn);
    });

    // 4. Register User
    expect(await screen.findByPlaceholderText('您的暱稱')).toBeInTheDocument();
    
    const nameInput = screen.getByPlaceholderText('您的暱稱');
    fireEvent.change(nameInput, { target: { value: 'SoloPlayer' } });
    
    const joinBtn = screen.getByRole('button', { name: /加入遊戲/i });
    await act(async () => {
        fireEvent.click(joinBtn);
    });

    // 5. Setup Phase
    // Assuming default activeYear is current year, checking for partial text match
    expect(await screen.findByText(/PLANNING/i)).toBeInTheDocument(); 
    expect(screen.getByText('我的設定')).toBeInTheDocument();

    // 5a. Validation Check: Try to click Ready without filling data
    const readyBtn = screen.getByRole('button', { name: /我設定好了！/i });
    fireEvent.click(readyBtn);
    
    // Should show error alert (Alert Dialog)
    expect(await screen.findByText(/設定尚未完成/i)).toBeInTheDocument();
    expect(screen.getByText('請填寫您的「個人懲罰」項目。')).toBeInTheDocument();
    
    // Close Alert
    const closeAlertBtn = screen.getByRole('button', { name: /知道了/i });
    fireEvent.click(closeAlertBtn);

    // 5b. Fill Penalty
    const penaltyInput = screen.getByPlaceholderText(/例如：請大家喝星巴克/i);
    fireEvent.change(penaltyInput, { target: { value: 'No bubble tea' } });

    // 5c. Setup Goal 1
    // Find first goal (initially empty)
    const goalItem = screen.getByText('(點擊以設定目標)'); // Finds the first one
    fireEvent.click(goalItem);

    // Modal should open
    expect(screen.getByPlaceholderText('輸入目標標題...')).toBeInTheDocument();
    
    const titleInput = screen.getByPlaceholderText('輸入目標標題...');
    fireEvent.change(titleInput, { target: { value: 'Goal 1: Read Books' } });
    
    // Select frequency (default is weekly, lets change to yearly for simplicity in test if needed, but default is fine)
    // We need to fill required fields if any. Default logic handles it.

    const saveGoalBtn = screen.getByRole('button', { name: /保存/i });
    await act(async () => {
        fireEvent.click(saveGoalBtn);
    });

    // Verify Goal 1 is updated in list
    expect(screen.getByText('Goal 1: Read Books')).toBeInTheDocument();

    // Fill the other goals to pass validation (assuming goalsPerUser=3 from default config in modal logic)
    // In GameConfigModal logic: when players=1, calculated grid is sqrt(3) -> 2x2 or just list. 
    // Actually default is 3 goals.
    const emptyGoals = screen.getAllByText('(點擊以設定目標)');
    for (const emptyG of emptyGoals) {
        fireEvent.click(emptyG);
        const tInput = screen.getByPlaceholderText('輸入目標標題...');
        fireEvent.change(tInput, { target: { value: 'Another Goal' } });
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /保存/i }));
        });
    }

    // 5d. Click Ready Successfully
    await act(async () => {
        fireEvent.click(readyBtn);
    });

    // Should now show "Ready" state (button text changes)
    expect(screen.getByText(/已準備完成/i)).toBeInTheDocument();

    // 6. Start Game
    // Since it's solo mode and ready, the start button should appear
    const startGameBtn = await screen.findByRole('button', { name: /鎖定目標，開始個人挑戰/i });
    fireEvent.click(startGameBtn);

    // Confirm Dialog
    expect(screen.getByText('確定要鎖定所有目標並開始遊戲嗎？')).toBeInTheDocument();
    const confirmStartBtn = screen.getByRole('button', { name: '確定開始' });
    
    await act(async () => {
        fireEvent.click(confirmStartBtn);
    });

    // 7. Verify Dashboard (Active Phase)
    expect(await screen.findByText(/執行中/i)).toBeInTheDocument();
    expect(screen.getByText('Goal 1: Read Books')).toBeInTheDocument();
    expect(screen.getByText('個人挑戰')).toBeInTheDocument(); // Solo badge
  });
});
