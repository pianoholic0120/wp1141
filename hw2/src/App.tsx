import React, { useState, useEffect, useCallback } from 'react';
import { Level, GameState, GamePage } from './types/GameTypes';
import { calculateStarRating } from './utils/GameLogic';
import AudioManager from './utils/AudioManager';
import MainMenu from './components/MainMenu';
import RulesPage from './components/RulesPage';
import NewLevelSelector from './components/NewLevelSelector';
import NewGame from './components/NewGame';
import VictoryEffect from './components/VictoryEffect';
import './App.css';

// 導入關卡資料
import levelsData from './data/levels.json';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<GamePage>('main-menu');
  const [currentLevel, setCurrentLevel] = useState<Level | null>(null);
  const [completedLevels, setCompletedLevels] = useState<Set<string>>(new Set());
  const [levelScores, setLevelScores] = useState<Record<string, { stars: number; moves: number }>>({});
  
  // 音效和特效狀態
  const [audioManager] = useState(() => AudioManager.getInstance());
  const [showVictoryEffect, setShowVictoryEffect] = useState(false);
  const [victoryData, setVictoryData] = useState<{
    stars: number;
    isAllComplete: boolean;
    totalStars: number;
    onComplete: () => void;
  } | null>(null);

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

  // 初始化音頻系統
  useEffect(() => {
    console.log('Audio manager initialized:', audioManager.isAudioEnabled());
    // 嘗試立即啟動背景音樂（如果用戶已經有互動）
    setTimeout(() => {
      if (audioManager.isAudioEnabled()) {
        audioManager.playBackgroundMusic();
      }
    }, 1000);
  }, [audioManager]);

  const handleStartGame = () => {
    // 暫時移除音效
    // audioManager.playSound('click');
    // audioManager.playBackgroundMusic();
    setCurrentPage('level-selector');
  };

  const handleShowRules = () => {
    // 暫時移除音效
    // audioManager.playSound('click');
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

  const handleLevelComplete = (gameState: GameState) => {
    console.log('=== handleLevelComplete 被調用 ===');
    
    const levelId = gameState.currentLevel.id;
    
    // 防止重複處理同一關卡
    if (showVictoryEffect || victoryData) {
      console.log('App: 已經在處理通關，忽略重複調用');
      return;
    }
    
    console.log('gameState:', gameState);
    
    const movesUsed = gameState.currentTurn - 1;
    const starRating = calculateStarRating(gameState);
    
    console.log('關卡ID:', levelId);
    console.log('使用步數:', movesUsed);
    console.log('星級評分:', starRating);
    
    // 暫時移除音效
    // audioManager.playSound(`star${starRating.stars}`);
    
    // 更新完成的關卡
    const newCompletedLevels = new Set([...completedLevels, levelId]);
    setCompletedLevels(newCompletedLevels);
    
    // 更新分數（只保存更好的分數）
    let updatedScores = levelScores;
    setLevelScores(prev => {
      const currentScore = prev[levelId];
      if (!currentScore || starRating.stars > currentScore.stars || 
          (starRating.stars === currentScore.stars && movesUsed < currentScore.moves)) {
        updatedScores = {
          ...prev,
          [levelId]: {
            stars: starRating.stars,
            moves: movesUsed
          }
        };
        return updatedScores;
      }
      return prev;
    });

    // 檢查是否完成所有關卡
    const levels = levelsData as unknown as Level[];
    const isAllComplete = newCompletedLevels.size === levels.length;
    const totalStars = Object.values(updatedScores).reduce((sum, score) => sum + score.stars, 0);
    
    // 找到下一關
    const currentIndex = levels.findIndex(level => level.id === levelId);
    const hasNextLevel = currentIndex < levels.length - 1;
    const nextLevel = hasNextLevel ? levels[currentIndex + 1] : null;

    console.log('App: 準備顯示通關特效');
    console.log('App: isAllComplete =', isAllComplete);
    console.log('App: hasNextLevel =', hasNextLevel);
    console.log('App: nextLevel =', nextLevel);
    
    // 創建穩定的回調函數
    const victoryCallback = () => {
      console.log('App: ===== 收到 VictoryEffect 完成回調 =====');
      
      try {
        // 清理特效狀態
        console.log('App: 清理特效狀態');
        setShowVictoryEffect(false);
        setVictoryData(null);
        
        console.log('App: 準備顯示對話框，設定100ms延遲');
        
        // 使用setTimeout確保狀態更新完成
        setTimeout(() => {
          console.log('App: setTimeout 觸發，開始顯示對話框');
          
          if (isAllComplete) {
            console.log('App: 條件判斷 - 全完成');
            alert(`🏆 恭喜您完成了所有關卡！\n總共獲得 ${totalStars} 顆星星！`);
            setCurrentPage('level-selector');
            setCurrentLevel(null);
          } else if (hasNextLevel) {
            console.log('App: 條件判斷 - 有下一關');
            const userChoice = window.confirm(`🎉 恭喜通關！\n\n關卡: ${levelId}\n評分: ${starRating.stars}★ ${starRating.description}\n使用步數: ${movesUsed}\n\n點擊「確定」進入下一關 (${nextLevel!.id})\n點擊「取消」返回關卡選擇`);
            if (userChoice && nextLevel) {
              console.log('App: 用戶選擇進入下一關');
              const convertedLevel: Level = {
                ...nextLevel,
                obstacles: nextLevel.obstacles.map((obs: any) => ({ row: obs[0], col: obs[1] })),
                blocks: nextLevel.blocks.map((block: any) => ({ row: block[0], col: block[1] }))
              };
              setCurrentLevel(convertedLevel);
            } else {
              console.log('App: 用戶選擇返回關卡選擇');
              setCurrentPage('level-selector');
              setCurrentLevel(null);
            }
          } else {
            console.log('App: 條件判斷 - 最後一關');
            alert(`🎉 恭喜通關！\n\n關卡: ${levelId}\n評分: ${starRating.stars}★ ${starRating.description}\n使用步數: ${movesUsed}`);
            setCurrentPage('level-selector');
            setCurrentLevel(null);
          }
        }, 100); // 100ms延遲確保狀態更新
      } catch (error) {
        console.error('App: 回調函數執行錯誤！', error);
      }
    };
    
    setVictoryData({
      stars: starRating.stars,
      isAllComplete,
      totalStars,
      onComplete: victoryCallback
    });
    setShowVictoryEffect(true);
    console.log('App: 通關特效已啟動');
  };

  const handleLevelFailed = useCallback((gameState: GameState) => {
    const coverage = Math.round((gameState.coveredCells.size / (gameState.currentLevel.gridSize[0] * gameState.currentLevel.gridSize[1] - gameState.currentLevel.obstacles.length)) * 100);
    
    // 暫時移除音效
    // audioManager.playSound('error');
    
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
      
      {/* 通關特效 */}
      {showVictoryEffect && victoryData && (
        <VictoryEffect
          stars={victoryData.stars}
          isAllComplete={victoryData.isAllComplete}
          totalStars={victoryData.totalStars}
          onComplete={victoryData.onComplete}
        />
      )}
    </div>
  );
};

export default App;
