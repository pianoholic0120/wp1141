import React from 'react';
import { GameState } from '../types/GameTypes';
import { calculateCoverage, calculateStarRating } from '../utils/GameLogic';
import './GameInfo.css';

interface GameInfoProps {
  gameState: GameState;
}

const GameInfo: React.FC<GameInfoProps> = ({ gameState }) => {
  const { currentLevel, currentTurn, isGameWon, isGameLost } = gameState;
  const coverage = calculateCoverage(gameState);
  const starRating = calculateStarRating(gameState);
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return '#4caf50';
      case 'Normal': return '#ff9800';
      case 'Hard': return '#f44336';
      case 'Expert': return '#9c27b0';
      default: return '#666';
    }
  };

  const getStatusMessage = () => {
    if (isGameWon) {
      return (
        <div className="status-message success">
          <h3>🎉 恭喜完成！</h3>
          <p>覆蓋率: {coverage}%</p>
          <p>評分: {starRating.stars}★ {starRating.description}</p>
        </div>
      );
    }
    
    if (isGameLost) {
      return (
        <div className="status-message failure">
          <h3>😔 遊戲結束</h3>
          <p>回合數已用完</p>
          <p>覆蓋率: {coverage}%</p>
        </div>
      );
    }
    
    return (
      <div className="status-message playing">
        <h3>🎮 遊戲進行中</h3>
        <p>繼續移動方塊覆蓋所有格子</p>
      </div>
    );
  };

  return (
    <div className="game-info">
      <div className="level-info">
        <h2 className="level-title">
          {currentLevel.id} - {currentLevel.difficulty}
        </h2>
        <div 
          className="difficulty-badge"
          style={{ backgroundColor: getDifficultyColor(currentLevel.difficulty) }}
        >
          {currentLevel.difficulty}
        </div>
      </div>
      
      <div className="progress-info">
        <div className="progress-item">
          <span className="progress-label">回合數:</span>
          <span className="progress-value">
            {currentTurn - 1} / {currentLevel.turnLimit}
          </span>
        </div>
        
        <div className="progress-item">
          <span className="progress-label">覆蓋率:</span>
          <span className="progress-value">{coverage}%</span>
        </div>
        
        <div className="progress-item">
          <span className="progress-label">最少步數:</span>
          <span className="progress-value">{currentLevel.minSteps}</span>
        </div>
      </div>
      
      <div className="coverage-bar">
        <div className="coverage-label">覆蓋進度</div>
        <div className="coverage-track">
          <div 
            className="coverage-fill"
            style={{ width: `${coverage}%` }}
          ></div>
        </div>
        <div className="coverage-percentage">{coverage}%</div>
      </div>
      
      <div className="level-stats">
        <div className="stat-item">
          <span className="stat-label">地圖大小:</span>
          <span className="stat-value">{currentLevel.gridSize[0]}×{currentLevel.gridSize[1]}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">方塊數量:</span>
          <span className="stat-value">{currentLevel.blocks.length}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">障礙物:</span>
          <span className="stat-value">{currentLevel.obstacles.length}</span>
        </div>
      </div>
      
      {getStatusMessage()}
    </div>
  );
};

export default GameInfo;
