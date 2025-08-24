import { GameState } from '../types.ts';

const SAVE_GAME_KEY = 'spaceHaulerGeminiSave';

export const saveGameState = (state: GameState): void => {
  try {
    const stateString = JSON.stringify(state);
    localStorage.setItem(SAVE_GAME_KEY, stateString);
  } catch (error) {
    console.error("Failed to save game state:", error);
  }
};

export const loadGameState = (): GameState | null => {
  try {
    const stateString = localStorage.getItem(SAVE_GAME_KEY);
    if (stateString === null) {
      return null;
    }
    return JSON.parse(stateString) as GameState;
  } catch (error) {
    console.error("Failed to load game state:", error);
    // If loading fails, it's safer to remove the corrupted data
    deleteGameState();
    return null;
  }
};

export const hasSaveData = (): boolean => {
  return localStorage.getItem(SAVE_GAME_KEY) !== null;
};

export const deleteGameState = (): void => {
  try {
    localStorage.removeItem(SAVE_GAME_KEY);
  } catch (error) {
    console.error("Failed to delete game state:", error);
  }
};