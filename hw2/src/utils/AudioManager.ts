class AudioManager {
  private static instance: AudioManager;
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;
  private backgroundVolume: number = 0.3; // 背景音樂音量
  private effectVolume: number = 0.5; // 音效音量
  private backgroundMusicInterval: number | null = null;
  private bgNextNoteTime: number | null = null; // 下個音符的絕對時間（AudioContext 時間）
  private bgNoteIndex: number = 0;
  private masterGainNode: GainNode | null = null;

  private constructor() {
    this.initializeAudio();
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private async initializeAudio() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // 創建主音量控制節點
      this.masterGainNode = this.audioContext.createGain();
      this.masterGainNode.connect(this.audioContext.destination);
      this.masterGainNode.gain.setValueAtTime(1.0, this.audioContext.currentTime);
      
      // 等待用戶互動後恢復音頻上下文並啟動背景音樂
      if (this.audioContext.state === 'suspended') {
        const resumeAudio = () => {
          this.audioContext?.resume().then(() => {
            // 音頻上下文恢復後自動啟動背景音樂
            if (this.isEnabled) {
              this.playSimpleBackgroundMusic();
            }
          });
          document.removeEventListener('click', resumeAudio);
          document.removeEventListener('keydown', resumeAudio);
        };
        document.addEventListener('click', resumeAudio);
        document.addEventListener('keydown', resumeAudio);
      } else {
        // 如果音頻上下文已經可用，立即啟動背景音樂
        this.playSimpleBackgroundMusic();
      }
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  private createSoundEffects() {
    // 音效將在播放時動態創建，避免預加載問題
  }

  private playSimpleBackgroundMusic() {
    if (!this.audioContext || !this.isEnabled || !this.masterGainNode) return;

    // 清除之前的間隔
    if (this.backgroundMusicInterval) {
      clearInterval(this.backgroundMusicInterval);
    }

    // 簡化的背景音樂 - 使用預排程，避免被阻塞 API 影響
    const scheduleNote = (frequency: number, startTime: number, duration: number, volume: number = 0.05) => {
      if (!this.audioContext || !this.masterGainNode || !this.isEnabled) return;

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.masterGainNode);
      
      oscillator.frequency.setValueAtTime(frequency, startTime);
      oscillator.type = 'sine';
      
      // 平滑的音量控制
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume * this.backgroundVolume * 0.8, startTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(volume * this.backgroundVolume * 0.6, startTime + duration - 0.1);
      gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    // 簡單的音符序列
    const notes = [523, 659, 784, 659]; // C-E-G-E
    this.bgNoteIndex = 0;
    const noteGap = 2.0; // 兩秒一個音符
    const noteDur = 0.9; // 持續時間 0.9s

    // 設定下一個音符起始時間（使用 AudioContext 時間）
    this.bgNextNoteTime = this.audioContext.currentTime + 0.05;

    // 預先排程更多音符，確保在同步彈窗期間不會中斷
    const scheduler = () => {
      if (!this.audioContext || !this.isEnabled || this.bgNextNoteTime === null) return;
      const lookAhead = 0.1; // 每次排程時往前看 0.1s
      const scheduleAheadTime = 8.0; // 預先排程 8s 內的音符，足夠覆蓋對話框時間
      const now = this.audioContext.currentTime + lookAhead;

      while (this.bgNextNoteTime < now + scheduleAheadTime) {
        const freq = notes[this.bgNoteIndex];
        scheduleNote(freq, this.bgNextNoteTime, noteDur);
        this.bgNextNoteTime += noteGap;
        this.bgNoteIndex = (this.bgNoteIndex + 1) % notes.length;
      }
    };

    scheduler();
    this.backgroundMusicInterval = window.setInterval(scheduler, 50); // 50ms 排程一次，更頻繁
  }

  // 公共方法
  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stopBackgroundMusic();
    } else if (enabled) {
      this.playBackgroundMusic();
    }
  }

  public isAudioEnabled(): boolean {
    return this.isEnabled;
  }

  public playBackgroundMusic() {
    if (!this.isEnabled || !this.audioContext) return;
    
    // 確保音頻上下文已恢復
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().then(() => {
        this.playSimpleBackgroundMusic();
      });
    } else {
      this.playSimpleBackgroundMusic();
    }
  }

  public stopBackgroundMusic() {
    if (this.backgroundMusicInterval) {
      clearInterval(this.backgroundMusicInterval);
      this.backgroundMusicInterval = null;
    }
    // 重置背景音樂狀態
    this.bgNextNoteTime = null;
    this.bgNoteIndex = 0;
  }

  public playSound(soundName: string) {
    if (!this.isEnabled || !this.audioContext || !this.masterGainNode) return;
    
    // 確保音頻上下文已恢復
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().then(() => {
        this.playProgrammaticSound(soundName);
      });
    } else {
      this.playProgrammaticSound(soundName);
    }
  }

  private playProgrammaticSound(soundName: string) {
    if (!this.audioContext || !this.masterGainNode) return;

    const soundMap: { [key: string]: { frequencies: number[], duration: number } } = {
      'move': { frequencies: [523], duration: 0.15 }, // 簡化移動音效
      'success': { frequencies: [523, 659, 784], duration: 0.4 }, // 簡化成功音效
      'error': { frequencies: [330], duration: 0.3 }, // 簡化錯誤音效
      'click': { frequencies: [800], duration: 0.1 }, // 簡化點擊音效
      'star1': { frequencies: [523, 659], duration: 0.5 },
      'star2': { frequencies: [523, 659, 784], duration: 0.7 },
      'star3': { frequencies: [523, 659, 784, 988], duration: 0.9 },
      'allComplete': { frequencies: [523, 659, 784, 988, 1175], duration: 1.2 }
    };

    const sound = soundMap[soundName];
    if (!sound) return;

    const now = this.audioContext.currentTime;
    
    sound.frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.masterGainNode!);
      
      oscillator.frequency.setValueAtTime(freq, now);
      oscillator.type = 'sine';
      
      const delay = index * 0.15;
      const amplitude = this.effectVolume * 0.3;

      gainNode.gain.setValueAtTime(0, now + delay);
      gainNode.gain.linearRampToValueAtTime(amplitude, now + delay + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, now + delay + 0.4);
      
      oscillator.start(now + delay);
      oscillator.stop(now + delay + 0.4);
    });
  }

  public setBackgroundVolume(volume: number) {
    this.backgroundVolume = Math.max(0, Math.min(0.4, volume)); // 限制最大音量
  }

  public setEffectVolume(volume: number) {
    this.effectVolume = Math.max(0, Math.min(0.7, volume)); // 限制最大音量
  }
}

export default AudioManager;
