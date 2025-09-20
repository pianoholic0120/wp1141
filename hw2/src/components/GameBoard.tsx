import React from 'react';
import { GameState, Position } from '../types/GameTypes';
import './GameBoard.css';

interface GameBoardProps {
  gameState: GameState;
  onCellClick?: (position: Position) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState, onCellClick }) => {
  const { currentLevel, blocks, coveredCells } = gameState;
  const { gridSize, obstacles } = currentLevel;
  const [rows, cols] = gridSize;


  const renderCell = (row: number, col: number) => {
    const position: Position = { row, col };
    const positionKey = `${row},${col}`;
    
    // 檢查是否為障礙物
    const isObstacle = obstacles.some(obs => obs.row === row && obs.col === col);
    
    // 檢查是否有方塊
    const block = blocks.find(block => 
      block.position.row === row && block.position.col === col
    );
    
    // 檢查是否已覆蓋
    const isCovered = coveredCells.has(positionKey);
    
    let cellClass = 'game-cell';
    if (isObstacle) {
      cellClass += ' obstacle';
    } else if (block) {
      cellClass += ` block block-${block.id - 1}`;
    } else if (isCovered) {
      cellClass += ' covered';
    } else {
      cellClass += ' empty';
    }

    return (
      <div
        key={`${row}-${col}`}
        className={cellClass}
        onClick={() => onCellClick?.(position)}
        data-row={row}
        data-col={col}
      >
        {block && (
          <span className="block-number">{block.id}</span>
        )}
      </div>
    );
  };

  return (
    <div 
      className="game-board"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`
      }}
    >
      {Array.from({ length: rows }, (_, row) =>
        Array.from({ length: cols }, (_, col) => renderCell(row, col))
      )}
    </div>
  );
};

export default GameBoard;
