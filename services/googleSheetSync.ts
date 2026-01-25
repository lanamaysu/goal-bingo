import { GameState } from '../types';

const parseResponse = (text: string): any => {
  if (!text) throw new Error('Empty response');
  try {
    return JSON.parse(text);
  } catch (e) {
    try {
      const firstOpen = text.indexOf('{');
      const lastClose = text.lastIndexOf('}');
      if (firstOpen !== -1 && lastClose !== -1) {
        const candidate = text.substring(firstOpen, lastClose + 1);
        return JSON.parse(candidate);
      }
    } catch (e2) {}
    console.error('JSON Parse Failed. Raw content length:', text.length);
    throw e;
  }
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const sendRequest = async (url: string, payload: any, retries = 3): Promise<any> => {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      });

      if (!response.ok) {
        if (response.status >= 500) throw new Error(`Server Error ${response.status}`);
        throw new Error(`HTTP Error ${response.status}`);
      }

      const text = await response.text();
      const data = parseResponse(text);

      if (data.error) {
        if (data.error === 'Server busy') {
          const error: any = new Error('Server busy');
          error.retryAfter = data.retryAfter || undefined;
          throw error;
        }
        throw new Error(data.error);
      }

      return data;
    } catch (error: any) {
      const isRetryable =
        error.message === 'Server busy' ||
        error.message.includes('Server busy') ||
        error.message.includes('Network') ||
        error.message.includes('Failed to fetch');

      if (isRetryable && i < retries) {
        const delay = error.retryAfter || 1000 * Math.pow(2, i);
        console.warn(`Sync attempt ${i + 1} failed: ${error.message}. Retrying in ${delay}ms...`);
        await wait(delay);
        continue;
      }
      throw error;
    }
  }
};

export const fetchAvailableYears = async (url: string): Promise<string[]> => {
  try {
    const data = await sendRequest(url, { action: 'listYears' });
    return data.years || [];
  } catch (error) {
    console.warn('Failed to fetch available years:', error);
    return [];
  }
};

export const loadFromSheet = async (url: string, year: string): Promise<GameState | null> => {
  try {
    const data = await sendRequest(url, { action: 'load', year });
    if (data.exists === false) return null;
    return data as GameState;
  } catch (error) {
    console.error('Load Error:', error);
    throw error;
  }
};

export const saveToSheet = async (url: string, gameState: GameState): Promise<GameState> => {
  try {
    const data = await sendRequest(url, { action: 'save', gameState });
    if (data.goals && Array.isArray(data.goals)) {
      const sentGoalIds = new Set(gameState.goals.map((g: any) => g.id));
      const receivedGoalIds = new Set(data.goals.map((g: any) => g.id));
      const missingGoalIds = Array.from(sentGoalIds).filter((id) => !receivedGoalIds.has(id));
      if (missingGoalIds.length > 0) {
        console.warn('⚠️ Server merge returned missing goals - potential data loss!', {
          sent: gameState.goals.length,
          received: data.goals.length,
          missingIds: missingGoalIds,
        });
      }
    }

    return data as GameState;
  } catch (error) {
    console.error('Save Error:', error);
    throw error;
  }
};

export const syncWithSheet = async (url: string, gameState: GameState): Promise<GameState> => {
  return saveToSheet(url, gameState);
};
