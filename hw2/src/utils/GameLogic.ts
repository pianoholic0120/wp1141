import { Position, Direction, GameState, Level, Block } from '../types/GameTypes';

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

// 根據方向排序方塊（用於確定移動順序）
export function sortBlocksByDirection(blocks: Block[], direction: Direction): Block[] {
  const sorted = [...blocks];
  
  switch (direction) {
    case 'left':
      // 從左到右（欄位座標由小到大）
      return sorted.sort((a, b) => a.position.col - b.position.col);
    case 'right':
      // 從右到左（欄位座標由大到小）
      return sorted.sort((a, b) => b.position.col - a.position.col);
    case 'up':
      // 從上到下（行座標由小到大）
      return sorted.sort((a, b) => a.position.row - b.position.row);
    case 'down':
      // 從下到上（行座標由大到小）
      return sorted.sort((a, b) => b.position.row - a.position.row);
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
  const { currentLevel, blocks, coveredCells, currentTurn } = gameState;
  const { gridSize, obstacles } = currentLevel;
  
  // 建立固定障礙物集合
  const staticObstacles = obstacles;
  
  // 根據方向排序方塊
  const sortedBlocks = sortBlocksByDirection(blocks, direction);
  
  // 追蹤已停下的方塊位置
  const stoppedPositions = new Set<string>();
  const newBlocks: Block[] = [];
  const allPathCells = new Set<string>(); // 收集所有經過的格子
  
  // 按順序處理每個方塊
  for (const block of sortedBlocks) {
    const movement = calculateBlockMovement(
      block.position,
      direction,
      gridSize,
      staticObstacles,
      stoppedPositions
    );
    
    // 記錄最終位置，保持原有的 ID
    newBlocks.push({
      id: block.id,
      position: movement.finalPosition
    });
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
  
  // 更新移動歷史和覆蓋歷史
  const newMoveHistory = [...gameState.moveHistory, newBlocks];
  const newCoverageHistory = [...gameState.coverageHistory, new Set(newCoveredCells)];
  
  return {
    ...gameState,
    blocks: newBlocks,
    coveredCells: newCoveredCells,
    currentTurn: currentTurn + 1,
    isGameWon,
    isGameLost,
    moveHistory: newMoveHistory,
    coverageHistory: newCoverageHistory
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
  
  // 創建帶有固定 ID 的方塊
  const initialBlocks: Block[] = level.blocks.map((position, index) => ({
    id: index + 1,
    position
  }));
  
  // 初始方塊位置視為已覆蓋
  initialBlocks.forEach(block => {
    initialCoveredCells.add(positionToKey(block.position));
  });
  
  return {
    currentLevel: level,
    blocks: initialBlocks,
    coveredCells: initialCoveredCells,
    currentTurn: 1,
    isGameWon: false,
    isGameLost: false,
    moveHistory: [initialBlocks],
    coverageHistory: [new Set(initialCoveredCells)]
  };
}

// 撤銷移動
export function undoMove(gameState: GameState): GameState {
  if (gameState.moveHistory.length <= 1 || gameState.coverageHistory.length <= 1) {
    return gameState; // 無法撤銷
  }
  
  const newMoveHistory = gameState.moveHistory.slice(0, -1);
  const newCoverageHistory = gameState.coverageHistory.slice(0, -1);
  const previousBlocks = newMoveHistory[newMoveHistory.length - 1];
  const previousCoverage = newCoverageHistory[newCoverageHistory.length - 1];
  
  return {
    ...gameState,
    blocks: previousBlocks,
    coveredCells: new Set(previousCoverage), // 恢復之前的覆蓋狀態
    currentTurn: gameState.currentTurn - 1,
    isGameWon: false,
    isGameLost: false,
    moveHistory: newMoveHistory,
    coverageHistory: newCoverageHistory
  };
}
