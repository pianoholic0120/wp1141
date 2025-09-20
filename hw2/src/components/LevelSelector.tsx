import React, { useState } from 'react';
import { Level } from '../types/GameTypes';
import './LevelSelector.css';

interface LevelSelectorProps {
  levels: Level[];
  onLevelSelect: (level: Level) => void;
  completedLevels: Set<string>;
  levelScores: Record<string, { stars: number; moves: number }>;
}

const LevelSelector: React.FC<LevelSelectorProps> = ({
  levels,
  onLevelSelect,
  completedLevels,
  levelScores
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'id' | 'difficulty'>('id');

  const difficulties = ['All', 'Easy', 'Normal', 'Normal+', 'Hard', 'Hard+', 'Expert'];

  const filteredLevels = levels
    .filter(level => selectedDifficulty === 'All' || level.difficulty === selectedDifficulty)
    .sort((a, b) => {
      if (sortBy === 'difficulty') {
        const difficultyOrder: Record<string, number> = { 
          Easy: 1, 
          Normal: 2, 
          'Normal+': 3, 
          Hard: 4, 
          'Hard+': 5, 
          Expert: 6 
        };
        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
      }
      return a.id.localeCompare(b.id);
    });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return '#4caf50';
      case 'Normal': return '#ff9800';
      case 'Normal+': return '#ff7043';
      case 'Hard': return '#f44336';
      case 'Hard+': return '#e53935';
      case 'Expert': return '#9c27b0';
      default: return '#666';
    }
  };

  const getStarDisplay = (levelId: string) => {
    const score = levelScores[levelId];
    if (!score) return null;
    
    return (
      <div className="level-stars">
        {[1, 2, 3].map(star => (
          <span
            key={star}
            className={`star ${star <= score.stars ? 'filled' : 'empty'}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="level-selector">
      <div className="selector-header">
        <h2>選擇關卡</h2>
        <p>挑戰不同難度的滑動方塊謎題</p>
      </div>

      <div className="selector-filters">
        <div className="filter-group">
          <label htmlFor="difficulty-filter">難度篩選:</label>
          <select
            id="difficulty-filter"
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="filter-select"
          >
            {difficulties.map(diff => (
              <option key={diff} value={diff}>{diff}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="sort-filter">排序方式:</label>
          <select
            id="sort-filter"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'id' | 'difficulty')}
            className="filter-select"
          >
            <option value="id">關卡編號</option>
            <option value="difficulty">難度</option>
          </select>
        </div>
      </div>

      <div className="levels-grid">
        {filteredLevels.map(level => {
          const isCompleted = completedLevels.has(level.id);
          const score = levelScores[level.id];
          
          return (
            <div
              key={level.id}
              className={`level-card ${isCompleted ? 'completed' : ''}`}
              onClick={() => onLevelSelect(level)}
            >
              <div className="level-card-header">
                <h3 className="level-title">{level.id}</h3>
                <div
                  className="difficulty-badge"
                  style={{ backgroundColor: getDifficultyColor(level.difficulty) }}
                >
                  {level.difficulty}
                </div>
              </div>

              <div className="level-card-content">
                <div className="level-stats">
                  <div className="stat">
                    <span className="stat-label">地圖:</span>
                    <span className="stat-value">{level.gridSize[0]}×{level.gridSize[1]}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">方塊:</span>
                    <span className="stat-value">{level.blocks.length}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">回合限制:</span>
                    <span className="stat-value">{level.turnLimit}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">最少步數:</span>
                    <span className="stat-value">{level.minSteps}</span>
                  </div>
                </div>

                {isCompleted && (
                  <div className="completion-info">
                    {getStarDisplay(level.id)}
                    {score && (
                      <div className="completion-moves">
                        使用 {score.moves} 步
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="level-card-footer">
                {isCompleted ? (
                  <span className="completed-text">✓ 已完成</span>
                ) : (
                  <span className="play-text">點擊開始</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredLevels.length === 0 && (
        <div className="no-levels">
          <p>沒有找到符合條件的關卡</p>
        </div>
      )}
    </div>
  );
};

export default LevelSelector;
