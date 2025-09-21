import React, { useEffect, useState, useRef } from 'react';
import './VictoryEffect.css';

interface VictoryEffectProps {
  stars: number;
  isAllComplete?: boolean;
  totalStars?: number;
  onComplete: () => void;
}

const VictoryEffect: React.FC<VictoryEffectProps> = ({ 
  stars, 
  isAllComplete = false, 
  totalStars = 0, 
  onComplete 
}) => {
  const [showEffect, setShowEffect] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; delay: number }>>([]);
  const onCompleteRef = useRef(onComplete);

  // 更新ref當onComplete改變
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    console.log('VictoryEffect: 組件初始化，設定定時器');
    
    // 生成粒子效果
    const particleCount = isAllComplete ? 50 : stars * 15;
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: getParticleColor(stars, isAllComplete),
      delay: Math.random() * 0.5
    }));
    setParticles(newParticles);

    // 更短的時間測試
    const timer = setTimeout(() => {
      console.log('VictoryEffect: 定時器觸發！');
      try {
        console.log('VictoryEffect: 設定淡出狀態');
        setFadeOut(true);
        setShowEffect(false);
        
        console.log('VictoryEffect: 準備調用 onComplete');
        console.log('VictoryEffect: onComplete 函數存在？', typeof onCompleteRef.current === 'function');
        
        // 調用回調
        if (onCompleteRef.current) {
          onCompleteRef.current();
          console.log('VictoryEffect: onComplete 調用完成');
        }
      } catch (error) {
        console.error('VictoryEffect: 錯誤！', error);
      }
    }, 2000); // 縮短到2秒測試

    return () => {
      console.log('VictoryEffect: useEffect 清理，清除定時器');
      clearTimeout(timer);
    };
  }, [stars, isAllComplete]); // 移除 onComplete 依賴

  const getParticleColor = (stars: number, isAllComplete: boolean) => {
    if (isAllComplete) {
      const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
      return colors[Math.floor(Math.random() * colors.length)];
    }
    
    switch (stars) {
      case 1: return '#32CD32'; // 綠色
      case 2: return '#FFD700'; // 金色
      case 3: return '#FF6B6B'; // 紅色
      default: return '#87CEEB';
    }
  };

  const getEffectTitle = () => {
    if (isAllComplete) {
      if (totalStars >= 21) return '完美大師！'; // 7關 * 3星
      if (totalStars >= 14) return '優秀冒險家！'; // 7關 * 2星平均
      return '勇敢探險者！';
    }
    
    switch (stars) {
      case 1: return '不錯的嘗試！';
      case 2: return '做得很好！';
      case 3: return '完美通關！';
      default: return '恭喜過關！';
    }
  };

  const getEffectSubtitle = () => {
    if (isAllComplete) {
      return `總共獲得 ${totalStars} 顆星星！`;
    }
    
    return `獲得 ${stars} 顆星星！`;
  };

  if (!showEffect) return null;

  return (
    <div className={`victory-effect ${isAllComplete ? 'all-complete' : `stars-${stars}`} ${fadeOut ? 'fade-out' : ''}`}>
      {/* 背景遮罩 */}
      <div className="victory-backdrop" />
      
      {/* 粒子效果 */}
      <div className="particles-container">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              backgroundColor: particle.color,
              animationDelay: `${particle.delay}s`
            }}
          />
        ))}
      </div>

      {/* 主要內容 */}
      <div className="victory-content">
        {/* 星星顯示 */}
        <div className="stars-display">
          {isAllComplete ? (
            <div className="trophy-icon">🏆</div>
          ) : (
            Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className={`star ${i < stars ? 'filled' : 'empty'}`}
                style={{ animationDelay: `${i * 0.2}s` }}
              >
                ★
              </div>
            ))
          )}
        </div>

        {/* 文字內容 */}
        <div className="victory-text">
          <h1 className="victory-title">{getEffectTitle()}</h1>
          <p className="victory-subtitle">{getEffectSubtitle()}</p>
        </div>

        {/* 額外的視覺效果 */}
        <div className="victory-rings">
          <div className="ring ring-1" />
          <div className="ring ring-2" />
          <div className="ring ring-3" />
        </div>
      </div>

      {/* 彩帶效果（僅全關卡完成時顯示） */}
      {isAllComplete && (
        <div className="confetti-container">
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                backgroundColor: getParticleColor(0, true)
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default VictoryEffect;
