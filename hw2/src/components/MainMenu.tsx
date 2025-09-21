import React from 'react';
import './MainMenu.css';

interface MainMenuProps {
  onStartGame: () => void;
  onShowRules: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStartGame, onShowRules }) => {
  return (
    <div className="main-menu-container">
      <div className="main-menu-content">
        {/* 讓底圖的原始標題顯示，不添加自定義文字 */}
        
        <div className="menu-buttons">
          <button 
            className="menu-button start-button"
            onClick={onStartGame}
          >
            開始遊戲
          </button>
          
          <button 
            className="menu-button rules-button"
            onClick={onShowRules}
          >
            遊戲規則
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
