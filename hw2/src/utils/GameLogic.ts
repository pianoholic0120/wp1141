import { Position, Direction, GameState, Level } from '../types/GameTypes';

// 方向向量
const DIRECTION_VECTORS: Record<Direction, Position> = {
  up: { row: -1, col: 0 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
  right: { row: 0, col: 1 }
};

// 將位置轉換為字串 key
export function positionToKey(pos: Position): string {
  return `${pos.row},${pos.col}`;
}

// 將字串 key 轉換為位置
export function keyToPosition(key: string): Position {
  const [row, col] = key.split(',').map(Number);
  return { row, col };
}

// 檢查位置是否在地圖範圍內
export function isPositionValid(pos: Position, gridSize: [number, number]): boolean {
  return pos.row >= 0 && pos.row < gridSize[0] && pos.col >= 0 && pos.col < gridSize[1];
}

// 檢查位置是否為障礙物
export function isObstacle(pos: Position, obstacles: Position[]): boolean {
  return obstacles.some(obs => obs.row === pos.row && obs.col === pos.col);
}

// 根據方向排序方塊位置（用於確定移動順序）
export function sortPositionsByDirection(positions: Position[], direction: Direction): Position[] {
  const sorted = [...positions];
  
  switch (direction) {
    case 'left':
      // 從左到右（欄位座標由小到大）
      return sorted.sort((a, b) => a.col - b.col);
    case 'right':
      // 從右到左（欄位座標由大到小）
      return sorted.sort((a, b) => b.col - a.col);
    case 'up':
      // 從上到下（行座標由小到大）
      return sorted.sort((a, b) => a.row - b.row);
    case 'down':
      // 從下到上（行座標由大到小）
      return sorted.sort((a, b) => b.row - a.row);
    default:
      return sorted;
  }
}

// 計算方塊在指定方向能移動到的位置，並返回經過的所有格子
export function calculateBlockMovement(
  startPos: Position,
  direction: Direction,
  gridSize: [number, number],
  obstacles: Position[],
  stoppedPositions: Set<string>
): { finalPosition: Position; pathCells: Position[] } {
  const vector = DIRECTION_VECTORS[direction];
  let currentPos = { ...startPos };
  const pathCells: Position[] = [{ ...startPos }]; // 包含起始位置
  
  while (true) {
    const nextPos: Position = {
      row: currentPos.row + vector.row,
      col: currentPos.col + vector.col
    };
    
    // 檢查是否超出地圖範圍
    if (!isPositionValid(nextPos, gridSize)) {
      break;
    }
    
    // 檢查是否撞到固定障礙物
    if (isObstacle(nextPos, obstacles)) {
      break;
    }
    
    // 檢查是否撞到已停下的方塊
    if (stoppedPositions.has(positionToKey(nextPos))) {
      break;
    }
    
    currentPos = nextPos;
    pathCells.push({ ...currentPos });
  }
  
  return {
    finalPosition: currentPos,
    pathCells
  };
}

// 執行一次移動
export function executeMove(
  gameState: GameState,
  direction: Direction
): GameState {
  const { currentLevel, blockPositions, coveredCells, currentTurn } = gameState;
  const { gridSize, obstacles } = currentLevel;
  
  // 建立固定障礙物集合
  const staticObstacles = obstacles;
  
  // 根據方向排序方塊
  const sortedPositions = sortPositionsByDirection(blockPositions, direction);
  
  // 追蹤已停下的方塊位置
  const stoppedPositions = new Set<string>();
  const newPositions: Position[] = [];
  const allPathCells = new Set<string>(); // 收集所有經過的格子
  
  // 按順序處理每個方塊
  for (const originalPos of sortedPositions) {
    const movement = calculateBlockMovement(
      originalPos,
      direction,
      gridSize,
      staticObstacles,
      stoppedPositions
    );
    
    // 記錄最終位置
    newPositions.push(movement.finalPosition);
    stoppedPositions.add(positionToKey(movement.finalPosition));
    
    // 記錄所有經過的格子
    movement.pathCells.forEach(cell => {
      allPathCells.add(positionToKey(cell));
    });
  }
  
  // 更新覆蓋的格子 - 包含所有經過的路徑
  const newCoveredCells = new Set(coveredCells);
  allPathCells.forEach(cellKey => {
    newCoveredCells.add(cellKey);
  });
  
  // 檢查是否勝利
  const totalCells = gridSize[0] * gridSize[1];
  const obstacleCount = obstacles.length;
  const targetCells = totalCells - obstacleCount;
  const isGameWon = newCoveredCells.size >= targetCells;
  
  // 檢查是否失敗
  const isGameLost = !isGameWon && currentTurn >= currentLevel.turnLimit;
  
  // 更新移動歷史
  const newMoveHistory = [...gameState.moveHistory, newPositions];
  
  return {
    ...gameState,
    blockPositions: newPositions,
    coveredCells: newCoveredCells,
    currentTurn: currentTurn + 1,
    isGameWon,
    isGameLost,
    moveHistory: newMoveHistory
  };
}

// 計算覆蓋率
export function calculateCoverage(gameState: GameState): number {
  const { currentLevel, coveredCells } = gameState;
  const { gridSize, obstacles } = currentLevel;
  
  const totalCells = gridSize[0] * gridSize[1];
  const obstacleCount = obstacles.length;
  const targetCells = totalCells - obstacleCount;
  
  return Math.round((coveredCells.size / targetCells) * 100);
}

// 計算星級評分
export function calculateStarRating(gameState: GameState): { stars: 1 | 2 | 3; description: string } {
  const { currentLevel, currentTurn } = gameState;
  const { minSteps } = currentLevel;
  
  const movesUsed = currentTurn - 1; // 因為 currentTurn 是下一回合的數字
  
  if (movesUsed <= minSteps + 1) {
    return { stars: 3, description: '完美！' };
  } else if (movesUsed <= minSteps + 5) {
    return { stars: 2, description: '很好！' };
  } else {
    return { stars: 1, description: '完成！' };
  }
}

// 初始化遊戲狀態
export function initializeGameState(level: Level): GameState {
  const initialCoveredCells = new Set<string>();
  
  // 初始方塊位置視為已覆蓋
  level.blocks.forEach(block => {
    initialCoveredCells.add(positionToKey(block));
  });
  
  return {
    currentLevel: level,
    blockPositions: [...level.blocks],
    coveredCells: initialCoveredCells,
    currentTurn: 1,
    isGameWon: false,
    isGameLost: false,
    moveHistory: [level.blocks]
  };
}

// 撤銷移動
export function undoMove(gameState: GameState): GameState {
  if (gameState.moveHistory.length <= 1) {
    return gameState; // 無法撤銷
  }
  
  const newMoveHistory = gameState.moveHistory.slice(0, -1);
  const previousPositions = newMoveHistory[newMoveHistory.length - 1];
  
  // 重新計算覆蓋的格子
  const newCoveredCells = new Set<string>();
  previousPositions.forEach(pos => {
    newCoveredCells.add(positionToKey(pos));
  });
  
  return {
    ...gameState,
    blockPositions: previousPositions,
    coveredCells: newCoveredCells,
    currentTurn: gameState.currentTurn - 1,
    isGameWon: false,
    isGameLost: false,
    moveHistory: newMoveHistory
  };
}
