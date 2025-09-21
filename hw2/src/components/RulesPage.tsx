import React from 'react';
import './RulesPage.css';

interface RulesPageProps {
  onBack: () => void;
}

const RulesPage: React.FC<RulesPageProps> = ({ onBack }) => {
  return (
    <div className="rules-page-container">
      <div className="rules-content">
        <div className="rules-header">
          <h1 className="rules-title">遊戲規則</h1>
          <button className="back-button" onClick={onBack}>
            返回主選單
          </button>
        </div>
        
        <div className="rules-body">
          {/* 左側區域 */}
          <div className="rules-left">
            <div className="rule-section compact">
              <h2><span className="section-icon target"></span> 遊戲目標</h2>
              <p>控制所有可移動方塊，讓每個空格都至少被方塊經過一次，達到100%覆蓋率即可過關。</p>
            </div>
            
            <div className="rule-section compact">
              <h2><span className="section-icon controls"></span> 操作方式</h2>
              <div className="controls-detailed">
                <div className="control-item-detailed">
                  <div className="key-group">
                    <div className="key-display">↑</div>
                    <div className="key-display">↓</div>
                    <div className="key-display">←</div>
                    <div className="key-display">→</div>
                  </div>
                  <span>使用方向鍵控制所有方塊移動</span>
                </div>
                <div className="control-item-detailed">
                  <div className="key-display single">Z</div>
                  <span>撤銷上一步操作</span>
                </div>
                <div className="control-item-detailed">
                  <div className="key-display single">R</div>
                  <span>重新開始當前關卡</span>
                </div>
                <div className="control-item-detailed">
                  <div className="key-display single">H</div>
                  <span>顯示解法提示</span>
                </div>
              </div>
            </div>
          </div>

          {/* 右側區域 */}
          <div className="rules-right">
            <div className="rule-section compact">
              <h2><span className="section-icon rules"></span> 遊戲規則</h2>
              <ul className="rules-list compact">
                <li><strong>同步移動：</strong>按下方向鍵後，所有方塊會同時朝該方向滑動</li>
                <li><strong>滑動停止：</strong>方塊會一直滑動，直到撞到牆壁、障礙物或其他方塊才停下</li>
                <li><strong>覆蓋標記：</strong>方塊經過的每個格子都會被標記為已覆蓋（顯示✓符號）</li>
                <li><strong>步數限制：</strong>必須在規定的步數限制內完成關卡</li>
                <li><strong>方塊編號：</strong>每個方塊都有固定編號，移動後編號保持不變</li>
              </ul>
            </div>
            
            <div className="rule-section compact">
              <h2><span className="section-icon scoring"></span> 評分系統</h2>
              <div className="scoring-detailed">
                <div className="score-item-detailed">
                  <span className="stars">★★★</span>
                  <div className="score-desc">
                    <strong>完美</strong>
                    <small>用最少步數完成</small>
                  </div>
                </div>
                <div className="score-item-detailed">
                  <span className="stars">★★</span>
                  <div className="score-desc">
                    <strong>良好</strong>
                    <small>用較少步數完成</small>
                  </div>
                </div>
                <div className="score-item-detailed">
                  <span className="stars">★</span>
                  <div className="score-desc">
                    <strong>完成</strong>
                    <small>在限制內完成</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RulesPage;
