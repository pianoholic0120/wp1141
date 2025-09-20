import React, { useState, useEffect, useCallback } from 'react';
import { GameState, Level, Direction } from '../types/GameTypes';
import { executeMove, initializeGameState, undoMove, calculateCoverage } from '../utils/GameLogic';
import GameBoard from './GameBoard';
import GameControls from './GameControls';
import GameInfo from './GameInfo';
import GameScore from './GameScore';
import './Game.css';

interface GameProps {
  level: Level;
  onLevelComplete?: (gameState: GameState) => void;
  onLevelFailed?: (gameState: GameState) => void;
}

const Game: React.FC<GameProps> = ({ level, onLevelComplete, onLevelFailed }) => {
  const [gameState, setGameState] = useState<GameState>(() => initializeGameState(level));
  const [isAnimating, setIsAnimating] = useState(false);

  // 重置遊戲
  const resetGame = useCallback(() => {
    setGameState(initializeGameState(level));
    setIsAnimating(false);
  }, [level]);

  // 執行移動
  const handleMove = useCallback((direction: Direction) => {
    if (isAnimating || gameState.isGameWon || gameState.isGameLost) {
      return;
    }

    setIsAnimating(true);
    
    // 添加移動動畫延遲
    setTimeout(() => {
      const newGameState = executeMove(gameState, direction);
      setGameState(newGameState);
      setIsAnimating(false);
    }, 150);
  }, [gameState, isAnimating]);

  // 撤銷移動
  const handleUndo = useCallback(() => {
    if (isAnimating || gameState.moveHistory.length <= 1) {
      return;
    }

    const newGameState = undoMove(gameState);
    setGameState(newGameState);
  }, [gameState, isAnimating]);

  // 提示功能（簡單實現）
  const handleHint = useCallback(() => {
    // 簡單的提示：顯示未覆蓋的格子
    const coverage = calculateCoverage(gameState);
    alert(`目前覆蓋率: ${coverage}%\n繼續移動方塊來覆蓋所有格子！`);
  }, [gameState]);

  // 鍵盤事件處理
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (isAnimating || gameState.isGameWon || gameState.isGameLost) {
        return;
      }

      switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          event.preventDefault();
          handleMove('up');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          event.preventDefault();
          handleMove('down');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          event.preventDefault();
          handleMove('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          event.preventDefault();
          handleMove('right');
          break;
        case 'z':
        case 'Z':
          event.preventDefault();
          handleUndo();
          break;
        case 'r':
        case 'R':
          event.preventDefault();
          resetGame();
          break;
        case 'h':
        case 'H':
          event.preventDefault();
          handleHint();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleMove, handleUndo, resetGame, handleHint, isAnimating, gameState.isGameWon, gameState.isGameLost]);

  // 遊戲狀態變化處理
  useEffect(() => {
    if (gameState.isGameWon && onLevelComplete) {
      onLevelComplete(gameState);
    } else if (gameState.isGameLost && onLevelFailed) {
      onLevelFailed(gameState);
    }
  }, [gameState.isGameWon, gameState.isGameLost, gameState, onLevelComplete, onLevelFailed]);

  // 當關卡改變時重置遊戲
  useEffect(() => {
    resetGame();
  }, [level.id, resetGame]);

  const canUndo = gameState.moveHistory.length > 1;
  const isGameActive = !gameState.isGameWon && !gameState.isGameLost;

  return (
    <div className="game-container">
      <GameScore gameState={gameState} />
      
      <div className="game-content-2048">
        <GameBoard 
          gameState={gameState}
          onCellClick={(position) => {
            // 可以添加點擊格子的功能
            console.log('Clicked cell:', position);
          }}
        />
        
        <GameControls
          onMove={handleMove}
          onUndo={handleUndo}
          onReset={resetGame}
          onHint={handleHint}
          canUndo={canUndo}
          isGameActive={isGameActive}
        />
        
        <div className="game-info-compact">
          <GameInfo gameState={gameState} />
        </div>
      </div>
      
      {isAnimating && <div className="animation-overlay" />}
    </div>
  );
};

export default Game;
