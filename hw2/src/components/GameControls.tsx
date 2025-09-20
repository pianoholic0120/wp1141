import React from 'react';
import { Direction } from '../types/GameTypes';
import './GameControls.css';

interface GameControlsProps {
  onMove: (direction: Direction) => void;
  onUndo: () => void;
  onReset: () => void;
  onHint: () => void;
  canUndo: boolean;
  isGameActive: boolean;
}

const GameControls: React.FC<GameControlsProps> = ({
  onMove,
  onUndo,
  onReset,
  onHint,
  canUndo,
  isGameActive
}) => {
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (!isGameActive) return;
    
    switch (event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        event.preventDefault();
        onMove('up');
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        event.preventDefault();
        onMove('down');
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        event.preventDefault();
        onMove('left');
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        event.preventDefault();
        onMove('right');
        break;
    }
  };

  return (
    <div className="game-controls" onKeyDown={handleKeyPress} tabIndex={0}>
      <div className="control-buttons">
        <button
          className="control-btn hint-btn"
          onClick={onHint}
          disabled={!isGameActive}
          title="提示 (H)"
        >
          💡 提示
        </button>
        
        <button
          className="control-btn undo-btn"
          onClick={onUndo}
          disabled={!canUndo || !isGameActive}
          title="撤銷 (Z)"
        >
          ↶ 撤銷
        </button>
        
        <button
          className="control-btn reset-btn"
          onClick={onReset}
          disabled={!isGameActive}
          title="重新開始 (R)"
        >
          🔄 重新開始
        </button>
      </div>
      
      <div className="direction-controls">
        <div className="direction-row">
          <button
            className="direction-btn up-btn"
            onClick={() => onMove('up')}
            disabled={!isGameActive}
            title="向上 (↑ 或 W)"
          >
            ↑
          </button>
        </div>
        
        <div className="direction-row">
          <button
            className="direction-btn left-btn"
            onClick={() => onMove('left')}
            disabled={!isGameActive}
            title="向左 (← 或 A)"
          >
            ←
          </button>
          
          <div className="center-space"></div>
          
          <button
            className="direction-btn right-btn"
            onClick={() => onMove('right')}
            disabled={!isGameActive}
            title="向右 (→ 或 D)"
          >
            →
          </button>
        </div>
        
        <div className="direction-row">
          <button
            className="direction-btn down-btn"
            onClick={() => onMove('down')}
            disabled={!isGameActive}
            title="向下 (↓ 或 S)"
          >
            ↓
          </button>
        </div>
      </div>
      
      <div className="control-instructions">
        <p>使用方向鍵、WASD 或點擊按鈕移動</p>
        <p>所有方塊會同時朝指定方向滑動</p>
      </div>
    </div>
  );
};

export default GameControls;
