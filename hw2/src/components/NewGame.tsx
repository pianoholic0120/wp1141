import React, { useState, useEffect, useCallback } from 'react';
import { Level, GameState, Direction } from '../types/GameTypes';
import { initializeGameState, executeMove, undoMove, calculateCoverage } from '../utils/GameLogic';
import { getLevelChineseName } from '../utils/LevelNames';
import AudioManager from '../utils/AudioManager';
import GameBoard from './GameBoard';
import './NewGame.css';

interface NewGameProps {
  level: Level;
  onLevelComplete: (gameState: GameState) => void;
  onLevelFailed: (gameState: GameState) => void;
  onBack: () => void;
}

const NewGame: React.FC<NewGameProps> = ({
  level,
  onLevelComplete,
  onLevelFailed,
  onBack
}) => {
  const [gameState, setGameState] = useState<GameState>(() => initializeGameState(level));
  const [isAnimating, setIsAnimating] = useState(false);
  const [audioManager] = useState(() => AudioManager.getInstance());
  const [showHint, setShowHint] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [hasCalledComplete, setHasCalledComplete] = useState(false); // 防止重複調用

  const resetGame = useCallback(() => {
    audioManager.playSound('click');
    setGameState(initializeGameState(level));
    setIsAnimating(false);
    setShowHint(false);
    setHintIndex(0);
    setHasCalledComplete(false); // 重置完成標記
  }, [level, audioManager]);

  const handleMove = useCallback((direction: Direction) => {
    if (isAnimating || gameState.isGameWon || gameState.isGameLost) return;

    audioManager.playSound('move');
    setIsAnimating(true);
    setTimeout(() => {
      setGameState(prevState => executeMove(prevState, direction));
      setIsAnimating(false);
    }, 200);
  }, [isAnimating, gameState.isGameWon, gameState.isGameLost, audioManager]);

  const handleUndo = useCallback(() => {
    if (isAnimating || gameState.moveHistory.length <= 1) return;
    
    audioManager.playSound('click');
    setGameState(prevState => undoMove(prevState));
  }, [isAnimating, gameState.moveHistory.length, audioManager]);

  const handleHint = useCallback(() => {
    if (!level.solution || level.solution.length === 0) {
      audioManager.playSound('error');
      alert('此關卡沒有提示可用');
      return;
    }
    
    if (hintIndex >= level.solution.length) {
      audioManager.playSound('error');
      alert('已顯示所有提示步驟');
      return;
    }
    
    audioManager.playSound('success');
    const nextMove = level.solution[hintIndex];
    const directionMap: Record<string, string> = {
      'U': '上',
      'D': '下',
      'L': '左',
      'R': '右'
    };
    
    alert(`提示 ${hintIndex + 1}/${level.solution.length}: 向${directionMap[nextMove]}移動`);
    setHintIndex(prev => prev + 1);
    setShowHint(true);
  }, [level.solution, hintIndex, audioManager]);

  // 鍵盤控制
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (isAnimating || gameState.isGameWon || gameState.isGameLost) return;

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          handleMove('up');
          break;
        case 'ArrowDown':
          event.preventDefault();
          handleMove('down');
          break;
        case 'ArrowLeft':
          event.preventDefault();
          handleMove('left');
          break;
        case 'ArrowRight':
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

  // 遊戲狀態變化處理 - 防止重複調用
  useEffect(() => {
    if (gameState.isGameWon && onLevelComplete && !hasCalledComplete) {
      console.log('NewGame: 檢測到通關，調用 onLevelComplete');
      setHasCalledComplete(true); // 標記已調用
      onLevelComplete(gameState);
    } else if (gameState.isGameLost && onLevelFailed) {
      console.log('NewGame: 檢測到失敗，調用 onLevelFailed');
      onLevelFailed(gameState);
    }
  }, [gameState.isGameWon, gameState.isGameLost, hasCalledComplete]); // 添加標記依賴

  // 當關卡改變時重置遊戲
  useEffect(() => {
    resetGame();
  }, [level.id, resetGame]);

  const canUndo = gameState.moveHistory.length > 1;
  const isGameActive = !gameState.isGameWon && !gameState.isGameLost;
  const coverage = calculateCoverage(gameState);
  const remainingMoves = level.turnLimit - (gameState.currentTurn - 1);

  return (
    <div className="new-game-container">
      {/* 頂部信息欄 */}
      <div className="new-game-header">
        <button className="back-button-game" onClick={onBack}>
          ← 返回選關
        </button>
        
        <div className="level-info-header">
          <div className="level-name-header">{getLevelChineseName(level.id)}</div>
          <div className="level-id-header">{level.id}</div>
        </div>
        
        <div className="game-status">
          <div className="coverage-progress-container">
            <div className="coverage-label">覆蓋率</div>
            <div className="progress-bar-wrapper">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${coverage}%` }}
                ></div>
                <div className="progress-text">{coverage}%</div>
              </div>
            </div>
          </div>
          <div className="status-item moves-counter">
            <span className="status-label">剩餘步數</span>
            <span className="status-value remaining-moves">{remainingMoves}</span>
          </div>
        </div>
      </div>

      {/* 遊戲主體 */}
      <div className="new-game-main">
        {/* 左側控制面板 */}
        <div className="game-controls-panel">
          <div className="control-section">
            <h3>遊戲控制</h3>
            <div className="control-buttons">
              <button 
                className="control-btn undo-btn"
                onClick={handleUndo}
                disabled={!canUndo || !isGameActive}
              >
                撤銷 (Z)
              </button>
              <button 
                className="control-btn reset-btn"
                onClick={resetGame}
              >
                重置 (R)
              </button>
              <button 
                className="control-btn hint-btn"
                onClick={handleHint}
                disabled={!isGameActive}
              >
                提示 (H)
              </button>
            </div>
          </div>

          <div className="control-section">
            <h3>方向控制</h3>
            <div className="direction-controls">
              <button 
                className="direction-btn up"
                onClick={() => handleMove('up')}
                disabled={!isGameActive || isAnimating}
              >
                ↑
              </button>
              <div className="direction-row">
                <button 
                  className="direction-btn left"
                  onClick={() => handleMove('left')}
                  disabled={!isGameActive || isAnimating}
                >
                  ←
                </button>
                <button 
                  className="direction-btn right"
                  onClick={() => handleMove('right')}
                  disabled={!isGameActive || isAnimating}
                >
                  →
                </button>
              </div>
              <button 
                className="direction-btn down"
                onClick={() => handleMove('down')}
                disabled={!isGameActive || isAnimating}
              >
                ↓
              </button>
            </div>
          </div>

          <div className="control-section">
            <h3>關卡信息</h3>
            <div className="level-details">
              <div className="detail-item">
                <span className="detail-label">地圖:</span>
                <span className="detail-value">{level.gridSize[0]}×{level.gridSize[1]}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">方塊:</span>
                <span className="detail-value">{level.blocks.length}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">最少步數:</span>
                <span className="detail-value">{level.minSteps}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">目前步數:</span>
                <span className="detail-value">{gameState.currentTurn - 1}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 中央遊戲板 */}
        <div className="game-board-container">
          <GameBoard 
            gameState={gameState}
            onCellClick={(position) => {
              console.log('Clicked cell:', position);
            }}
          />
        </div>

        {/* 右側信息面板 */}
        <div className="game-info-panel">
          <div className="info-section">
            <h3>遊戲說明</h3>
            <div className="game-instructions">
              <p><span className="instruction-icon target">⚡</span> 目標：讓所有格子都被方塊經過至少一次</p>
              <p><span className="instruction-icon control">⚔</span> 控制：使用方向鍵或點擊按鈕移動</p>
              <p><span className="instruction-icon rules">⚖</span> 規則：所有方塊同時移動直到撞到障礙</p>
              <p><span className="instruction-icon scoring">♦</span> 評分：越少步數完成，星數越高</p>
            </div>
          </div>

          <div className="info-section">
            <h3>圖例說明</h3>
            <div className="legend">
              <div className="legend-item">
                <div className="legend-color block-example">1</div>
                <span>可移動方塊</span>
              </div>
              <div className="legend-item">
                <div className="legend-color obstacle-example"></div>
                <span>固定障礙物</span>
              </div>
              <div className="legend-item">
                <div className="legend-color covered-example">✓</div>
                <span>已覆蓋格子</span>
              </div>
              <div className="legend-item">
                <div className="legend-color empty-example"></div>
                <span>空白格子</span>
              </div>
            </div>
          </div>

          {showHint && level.solution && (
            <div className="info-section hint-section">
              <h3>解法提示</h3>
              <div className="hint-display">
                <p>完整解法 ({level.solution.length} 步):</p>
                <div className="solution-steps">
                  {level.solution.map((step, index) => (
                    <span 
                      key={index} 
                      className={`step ${index < hintIndex ? 'revealed' : ''}`}
                    >
                      {step}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewGame;
