import React, { useState, useEffect, useCallback } from 'react';
import { Level, GameState } from './types/GameTypes';
import { calculateStarRating } from './utils/GameLogic';
import Game from './components/Game';
import LevelSelector from './components/LevelSelector';
import './App.css';

// 導入關卡資料
import levelsData from './data/levels.json';

const App: React.FC = () => {
  const [currentLevel, setCurrentLevel] = useState<Level | null>(null);
  const [completedLevels, setCompletedLevels] = useState<Set<string>>(new Set());
  const [levelScores, setLevelScores] = useState<Record<string, { stars: number; moves: number }>>({});
  const [showLevelSelector, setShowLevelSelector] = useState(true);

  // 從 localStorage 載入遊戲進度
  useEffect(() => {
    const savedCompleted = localStorage.getItem('completedLevels');
    const savedScores = localStorage.getItem('levelScores');
    
    if (savedCompleted) {
      try {
        setCompletedLevels(new Set(JSON.parse(savedCompleted)));
      } catch (error) {
        console.error('Error loading completed levels:', error);
      }
    }
    
    if (savedScores) {
      try {
        setLevelScores(JSON.parse(savedScores));
      } catch (error) {
        console.error('Error loading level scores:', error);
      }
    }
  }, []);

  // 保存遊戲進度到 localStorage
  useEffect(() => {
    localStorage.setItem('completedLevels', JSON.stringify([...completedLevels]));
  }, [completedLevels]);

  useEffect(() => {
    localStorage.setItem('levelScores', JSON.stringify(levelScores));
  }, [levelScores]);

  const handleLevelSelect = (level: Level) => {
    // 轉換數組格式到對象格式
    const convertedLevel: Level = {
      ...level,
      obstacles: level.obstacles.map((obs: any) => ({ row: obs[0], col: obs[1] })),
      blocks: level.blocks.map((block: any) => ({ row: block[0], col: block[1] }))
    };
    setCurrentLevel(convertedLevel);
    setShowLevelSelector(false);
  };

  const handleLevelComplete = useCallback((gameState: GameState) => {
    const levelId = gameState.currentLevel.id;
    const movesUsed = gameState.currentTurn - 1;
    const starRating = calculateStarRating(gameState);
    
    // 更新完成的關卡
    setCompletedLevels(prev => new Set([...prev, levelId]));
    
    // 更新分數（只保存更好的分數）
    setLevelScores(prev => {
      const currentScore = prev[levelId];
      if (!currentScore || starRating.stars > currentScore.stars || 
          (starRating.stars === currentScore.stars && movesUsed < currentScore.moves)) {
        return {
          ...prev,
          [levelId]: {
            stars: starRating.stars,
            moves: movesUsed
          }
        };
      }
      return prev;
    });

    // 顯示完成訊息並返回關卡選擇
    setTimeout(() => {
      alert(`🎉 關卡完成！\n評分: ${starRating.stars}★ ${starRating.description}\n使用步數: ${movesUsed}`);
      setCurrentLevel(null);
      setShowLevelSelector(true);
    }, 1000);
  }, []);

  const handleLevelFailed = useCallback((gameState: GameState) => {
    const coverage = Math.round((gameState.coveredCells.size / (gameState.currentLevel.gridSize[0] * gameState.currentLevel.gridSize[1] - gameState.currentLevel.obstacles.length)) * 100);
    
    setTimeout(() => {
      alert(`😔 遊戲失敗！\n覆蓋率: ${coverage}%\n再試一次吧！`);
      setCurrentLevel(null);
      setShowLevelSelector(true);
    }, 1000);
  }, []);

  const handleBackToLevels = () => {
    setShowLevelSelector(true);
    setCurrentLevel(null);
  };

  const handleResetProgress = () => {
    if (window.confirm('確定要重置所有遊戲進度嗎？此操作無法復原。')) {
      setCompletedLevels(new Set());
      setLevelScores({});
      localStorage.removeItem('completedLevels');
      localStorage.removeItem('levelScores');
    }
  };

  if (showLevelSelector) {
    return (
      <div className="app">
        <div className="app-header">
          <h1>滑動方塊覆蓋遊戲</h1>
          <p>在限定回合內讓所有方塊覆蓋地圖的每一格</p>
          <div className="app-actions">
            <button 
              className="reset-btn"
              onClick={handleResetProgress}
              title="重置所有進度"
            >
              🔄 重置進度
            </button>
          </div>
        </div>
        
        <LevelSelector
          levels={levelsData as unknown as Level[]}
          onLevelSelect={handleLevelSelect}
          completedLevels={completedLevels}
          levelScores={levelScores}
        />
      </div>
    );
  }

  if (currentLevel) {
    return (
      <div className="app">
        <div className="game-header-actions">
          <button 
            className="back-btn"
            onClick={handleBackToLevels}
            title="返回關卡選擇"
          >
            ← 返回關卡選擇
          </button>
        </div>
        
        <Game
          level={currentLevel}
          onLevelComplete={handleLevelComplete}
          onLevelFailed={handleLevelFailed}
        />
      </div>
    );
  }

  return null;
};

export default App;
