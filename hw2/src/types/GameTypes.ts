// 遊戲基本類型定義

export interface Position {
  row: number;
  col: number;
}

export interface Block {
  id: number;
  position: Position;
}

export interface Level {
  id: string;
  difficulty: 'Easy' | 'Normal' | 'Hard' | 'Expert';
  gridSize: [number, number]; // [rows, cols]
  obstacles: Position[];
  blocks: Position[];
  goal: 'cover_all_cells';
  minSteps: number;
  turnLimit: number;
  solution: string[];
}

export interface GameState {
  currentLevel: Level;
  blocks: Block[];
  coveredCells: Set<string>; // 使用 "row,col" 格式作為 key
  currentTurn: number;
  isGameWon: boolean;
  isGameLost: boolean;
  moveHistory: Block[][]; // 每回合的方塊歷史
  coverageHistory: Set<string>[]; // 每回合的覆蓋歷史
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export type GamePage = 'main-menu' | 'rules' | 'level-selector' | 'game';

export interface GameConfig {
  animationDuration: number;
  showHints: boolean;
  soundEnabled: boolean;
  colorBlindMode: boolean;
}

export interface StarRating {
  stars: 1 | 2 | 3;
  description: string;
}

// 遊戲統計
export interface GameStats {
  totalMoves: number;
  optimalMoves: number;
  timeElapsed: number;
  stars: StarRating;
}
