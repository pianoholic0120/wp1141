import React, { useState, useEffect, useCallback } from 'react';
import { Level, GameState, GamePage } from './types/GameTypes';
import { calculateStarRating } from './utils/GameLogic';
import MainMenu from './components/MainMenu';
import RulesPage from './components/RulesPage';
import NewLevelSelector from './components/NewLevelSelector';
import NewGame from './components/NewGame';
import './App.css';

// 導入關卡資料
import levelsData from './data/levels.json';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<GamePage>('main-menu');
  const [currentLevel, setCurrentLevel] = useState<Level | null>(null);
  const [completedLevels, setCompletedLevels] = useState<Set<string>>(new Set());
  const [levelScores, setLevelScores] = useState<Record<string, { stars: number; moves: number }>>({});

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

  const handleStartGame = () => {
    setCurrentPage('level-selector');
  };

  const handleShowRules = () => {
    setCurrentPage('rules');
  };

  const handleBackToMainMenu = () => {
    setCurrentPage('main-menu');
    setCurrentLevel(null);
  };

  const handleLevelSelect = (level: Level) => {
    // 轉換數組格式到對象格式
    const convertedLevel: Level = {
      ...level,
      obstacles: level.obstacles.map((obs: any) => ({ row: obs[0], col: obs[1] })),
      blocks: level.blocks.map((block: any) => ({ row: block[0], col: block[1] }))
    };
    setCurrentLevel(convertedLevel);
    setCurrentPage('game');
  };

  const handleBackToLevelSelector = () => {
    setCurrentPage('level-selector');
    setCurrentLevel(null);
  };

  const handleResetProgress = () => {
    setCompletedLevels(new Set());
    setLevelScores({});
    localStorage.removeItem('completedLevels');
    localStorage.removeItem('levelScores');
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

    // 找到下一關
    const levels = levelsData as unknown as Level[];
    const currentIndex = levels.findIndex(level => level.id === levelId);
    const hasNextLevel = currentIndex < levels.length - 1;
    const nextLevel = hasNextLevel ? levels[currentIndex + 1] : null;

    // 顯示完成訊息並提供選項
    setTimeout(() => {
      let message = `🎉 恭喜通關！\n\n關卡: ${levelId}\n評分: ${starRating.stars}★ ${starRating.description}\n使用步數: ${movesUsed}`;
      
      if (hasNextLevel) {
        const userChoice = window.confirm(`${message}\n\n點擊「確定」進入下一關 (${nextLevel!.id})\n點擊「取消」返回關卡選擇`);
        if (userChoice && nextLevel) {
          // 進入下一關
          const convertedLevel: Level = {
            ...nextLevel,
            obstacles: nextLevel.obstacles.map((obs: any) => ({ row: obs[0], col: obs[1] })),
            blocks: nextLevel.blocks.map((block: any) => ({ row: block[0], col: block[1] }))
          };
          setCurrentLevel(convertedLevel);
        } else {
          // 返回關卡選擇，停留在當前關卡
          setCurrentPage('level-selector');
          setCurrentLevel(null);
        }
      } else {
        // 最後一關
        alert(`${message}\n\n🏆 恭喜您完成了所有關卡！`);
        setCurrentPage('level-selector');
        setCurrentLevel(null);
      }
    }, 1000);
  }, []);

  const handleLevelFailed = useCallback((gameState: GameState) => {
    const coverage = Math.round((gameState.coveredCells.size / (gameState.currentLevel.gridSize[0] * gameState.currentLevel.gridSize[1] - gameState.currentLevel.obstacles.length)) * 100);
    
    setTimeout(() => {
      alert(`😔 遊戲失敗！\n覆蓋率: ${coverage}%\n再試一次吧！`);
      setCurrentPage('level-selector');
      setCurrentLevel(null);
    }, 1000);
  }, []);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'main-menu':
        return (
          <MainMenu
            onStartGame={handleStartGame}
            onShowRules={handleShowRules}
          />
        );
      
      case 'rules':
        return (
          <RulesPage
            onBack={handleBackToMainMenu}
          />
        );
      
      case 'level-selector':
        return (
          <NewLevelSelector
            levels={levelsData as unknown as Level[]}
            completedLevels={completedLevels}
            levelScores={levelScores}
            onLevelSelect={handleLevelSelect}
            onResetProgress={handleResetProgress}
            onBack={handleBackToMainMenu}
          />
        );
      
      case 'game':
        return currentLevel ? (
          <NewGame
            level={currentLevel}
            onLevelComplete={handleLevelComplete}
            onLevelFailed={handleLevelFailed}
            onBack={handleBackToLevelSelector}
          />
        ) : (
          <div className="loading">載入中...</div>
        );
      
      default:
        return (
          <MainMenu
            onStartGame={handleStartGame}
            onShowRules={handleShowRules}
          />
        );
    }
  };

  return (
    <div className="app">
      {renderCurrentPage()}
    </div>
  );
};

export default App;
