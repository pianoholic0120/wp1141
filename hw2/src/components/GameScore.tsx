import React from 'react';
import { GameState } from '../types/GameTypes';
import { calculateCoverage } from '../utils/GameLogic';
import './GameScore.css';

interface GameScoreProps {
  gameState: GameState;
}

const GameScore: React.FC<GameScoreProps> = ({ gameState }) => {
  const { currentLevel, currentTurn } = gameState;
  const coverage = calculateCoverage(gameState);
  const remainingMoves = currentLevel.turnLimit - (currentTurn - 1);

  return (
    <div className="game-score-container">
      <div className="score-header">
        <h1 className="game-title">滑動方塊覆蓋遊戲</h1>
        <p className="game-subtitle">讓所有方塊覆蓋地圖的每一格！</p>
      </div>
      
      <div className="score-row">
        <div className="score-box">
          <div className="score-label">覆蓋率</div>
          <div className="score-value">{coverage}%</div>
        </div>
        
        <div className="score-box">
          <div className="score-label">剩餘步數</div>
          <div className="score-value">{remainingMoves}</div>
        </div>
      </div>
      
      <div className="level-info-row">
        <div className="level-box">
          <div className="level-name">{currentLevel.id}</div>
          <div className="level-difficulty">{currentLevel.difficulty}</div>
        </div>
        
        <div className="stats-box">
          <div className="stat-item">
            <span className="stat-label">地圖:</span>
            <span className="stat-value">{currentLevel.gridSize[0]}×{currentLevel.gridSize[1]}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">最少步數:</span>
            <span className="stat-value">{currentLevel.minSteps}</span>
          </div>
        </div>
      </div>
      
      <div className="how-to-play">
        <div className="instructions-title">HOW TO PLAY:</div>
        <div className="instructions-text">
          使用方向鍵移動方塊。所有方塊會同時朝指定方向滑動，直到撞到障礙物或其他方塊才停下。目標是讓每一格都至少被方塊停過一次！
        </div>
      </div>
    </div>
  );
};

export default GameScore;
