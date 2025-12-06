import { GameState } from '../types';

// Helper to handle GAS responses that might have trailing script injections or garbage
const parseResponse = (text: string): any => {
  if (!text) throw new Error('Empty response');
  try {
    return JSON.parse(text);
  } catch (e) {
    // If strict parse fails, try to salvage valid JSON from the start.
    try {
      const firstOpen = text.indexOf('{');
      const lastClose = text.lastIndexOf('}');
      if (firstOpen !== -1 && lastClose !== -1) {
        const candidate = text.substring(firstOpen, lastClose + 1);
        return JSON.parse(candidate);
      }
    } catch (e2) {
      // Fall through to throw original error
    }
    console.error('JSON Parse Failed. Raw content length:', text.length);
    throw e;
  }
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Generic request wrapper with Retry Logic
const sendRequest = async (url: string, payload: any, retries = 3): Promise<any> => {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      });

      if (!response.ok) {
        // 5xx errors might be transient server issues
        if (response.status >= 500) throw new Error(`Server Error ${response.status}`);
        throw new Error(`HTTP Error ${response.status}`);
      }

      const text = await response.text();
      const data = parseResponse(text);

      if (data.error) {
        if (data.error === 'Server busy') {
          throw new Error('Server busy');
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

      // If it is a retryable error and we haven't used up all retries
      if (isRetryable && i < retries) {
        const delay = 1000 * Math.pow(2, i); // Exponential backoff: 1s, 2s, 4s...
        console.warn(`Sync attempt ${i + 1} failed: ${error.message}. Retrying in ${delay}ms...`);
        await wait(delay);
        continue;
      }

      // If last attempt or non-retryable error, throw it
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

// Load data from the sheet
export const loadFromSheet = async (url: string, year: string): Promise<GameState | null> => {
  try {
    const data = await sendRequest(url, { action: 'load', year });
    // If backend says exists: false
    if (data.exists === false) return null;
    return data as GameState;
  } catch (error) {
    console.error('Load Error:', error);
    throw error;
  }
};

// Save data to the sheet
export const saveToSheet = async (url: string, gameState: GameState): Promise<GameState> => {
  try {
    const data = await sendRequest(url, { action: 'save', gameState });
    return data as GameState;
  } catch (error) {
    console.error('Save Error:', error);
    throw error;
  }
};

// Backward compatibility wrapper
export const syncWithSheet = async (url: string, gameState: GameState): Promise<GameState> => {
  return saveToSheet(url, gameState);
};
