import React, { useState, useEffect } from 'react';
import { Level } from '../types/GameTypes';
import { getLevelChineseName } from '../utils/LevelNames';
import './NewLevelSelector.css';

interface NewLevelSelectorProps {
  levels: Level[];
  completedLevels: Set<string>;
  levelScores: Record<string, { stars: number; moves: number }>;
  onLevelSelect: (level: Level) => void;
  onResetProgress: () => void;
  onBack: () => void;
}

const NewLevelSelector: React.FC<NewLevelSelectorProps> = ({
  levels,
  completedLevels,
  levelScores,
  onLevelSelect,
  onResetProgress,
  onBack
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [currentIndex, setCurrentIndex] = useState(0);

  const difficulties = ['All', 'Easy', 'Normal', 'Hard', 'Expert'];

  const filteredLevels = levels
    .filter(level => selectedDifficulty === 'All' || level.difficulty === selectedDifficulty)
    .sort((a, b) => a.id.localeCompare(b.id));

  // 重置索引當篩選改變時，確保索引在有效範圍內
  useEffect(() => {
    if (filteredLevels.length > 0) {
      setCurrentIndex(0);
    }
  }, [selectedDifficulty, filteredLevels.length]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return '#4caf50';
      case 'Normal': return '#ff9800';
      case 'Hard': return '#f44336';
      case 'Expert': return '#9c27b0';
      default: return '#666';
    }
  };

  const getStarDisplay = (levelId: string) => {
    const score = levelScores[levelId];
    if (!score) return '☆☆☆';
    return '★'.repeat(score.stars) + '☆'.repeat(3 - score.stars);
  };

  const goToPrevious = () => {
    if (filteredLevels.length === 0) return;
    setCurrentIndex(prev => 
      prev > 0 ? prev - 1 : filteredLevels.length - 1
    );
  };

  const goToNext = () => {
    if (filteredLevels.length === 0) return;
    setCurrentIndex(prev => 
      prev < filteredLevels.length - 1 ? prev + 1 : 0
    );
  };

  const handleResetConfirm = () => {
    if (window.confirm('確定要重置所有進度嗎？此操作無法復原。')) {
      onResetProgress();
    }
  };

  // 確保索引在有效範圍內
  const safeIndex = filteredLevels.length > 0 ? Math.max(0, Math.min(currentIndex, filteredLevels.length - 1)) : 0;
  const currentLevel = filteredLevels[safeIndex];
  
  // 如果安全索引與當前索引不同，更新索引
  useEffect(() => {
    if (filteredLevels.length > 0 && safeIndex !== currentIndex) {
      setCurrentIndex(safeIndex);
    }
  }, [safeIndex, currentIndex, filteredLevels.length]);

  if (filteredLevels.length === 0) {
    return (
      <div className="new-level-selector-container">
        <div className="no-levels">
          <p>沒有符合條件的關卡</p>
          <button onClick={() => {
            setCurrentIndex(0);
            setSelectedDifficulty('All');
          }}>顯示所有關卡</button>
        </div>
      </div>
    );
  }

  return (
    <div className="new-level-selector-container">
      {/* 頂部控制欄 */}
      <div className="new-level-selector-header">
        <button className="back-button-selector" onClick={onBack}>
          ← 返回主選單
        </button>
        
        <h1 className="new-selector-title">選擇關卡</h1>
        
        <button className="reset-button" onClick={handleResetConfirm}>
          重置進度
        </button>
      </div>

      {/* 難度篩選 */}
      <div className="difficulty-filter-bar">
        {difficulties.map(difficulty => (
          <button
            key={difficulty}
            className={`difficulty-tab ${selectedDifficulty === difficulty ? 'active' : ''}`}
            onClick={() => {
              setCurrentIndex(0);
              setSelectedDifficulty(difficulty);
            }}
          >
            {difficulty === 'All' ? '全部' : difficulty}
          </button>
        ))}
      </div>

      {/* 關卡輪播 */}
      <div className="level-carousel">
        <button 
          className="carousel-nav prev" 
          onClick={goToPrevious}
          disabled={filteredLevels.length <= 1}
        >
          ‹
        </button>

        <div className="level-display">
          <div className="level-card-large">
            <div className="level-header-large">
              <div className="level-id-large">{currentLevel.id}</div>
              <div 
                className="difficulty-badge-large"
                style={{ backgroundColor: getDifficultyColor(currentLevel.difficulty) }}
              >
                {currentLevel.difficulty}
              </div>
            </div>
            
            <div className="level-chinese-name">
              {getLevelChineseName(currentLevel.id)}
            </div>
            
            <div className="level-info-grid">
              <div className="info-item">
                <div className="info-label">地圖大小</div>
                <div className="info-value">{currentLevel.gridSize[0]}×{currentLevel.gridSize[1]}</div>
              </div>
              <div className="info-item">
                <div className="info-label">方塊數量</div>
                <div className="info-value">{currentLevel.blocks.length}</div>
              </div>
              <div className="info-item">
                <div className="info-label">最少步數</div>
                <div className="info-value">{currentLevel.minSteps}</div>
              </div>
              <div className="info-item">
                <div className="info-label">步數限制</div>
                <div className="info-value">{currentLevel.turnLimit}</div>
              </div>
            </div>
            
            <div className="level-progress-large">
              <div className="stars-large">{getStarDisplay(currentLevel.id)}</div>
              {levelScores[currentLevel.id] && (
                <div className="best-score-large">
                  最佳紀錄：{levelScores[currentLevel.id].moves} 步
                </div>
              )}
            </div>
            
            <div className="level-status-large">
              {completedLevels.has(currentLevel.id) ? (
                <span className="completed-badge-large">✓ 已完成</span>
              ) : (
                <span className="incomplete-badge-large">準備挑戰</span>
              )}
            </div>

            <button 
              className="play-button"
              onClick={() => onLevelSelect(currentLevel)}
            >
              開始遊戲
            </button>
          </div>
        </div>

        <button 
          className="carousel-nav next" 
          onClick={goToNext}
          disabled={filteredLevels.length <= 1}
        >
          ›
        </button>
      </div>

      {/* 指示器 */}
      <div className="carousel-indicators">
        {filteredLevels.map((_, index) => (
          <button
            key={index}
            className={`indicator ${index === safeIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>

      {/* 關卡統計 */}
      <div className="level-stats">
        <div className="stat-item">
          <span className="stat-number">{completedLevels.size}</span>
          <span className="stat-label">已完成</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{levels.length - completedLevels.size}</span>
          <span className="stat-label">剩餘</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">
            {Object.values(levelScores).reduce((sum, score) => sum + score.stars, 0)}
          </span>
          <span className="stat-label">總星數</span>
        </div>
      </div>
    </div>
  );
};

export default NewLevelSelector;
