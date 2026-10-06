import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, HelpCircle, Settings, Moon, Sun } from 'lucide-react';

interface ImmersionHeaderProps {
  title: string;
  currentIndex: number;
  totalCount: number;
  onExit: () => void;
  subtitle?: string;
  rightExtra?: React.ReactNode;
}

export const ImmersionHeader: React.FC<ImmersionHeaderProps> = ({
  title,
  currentIndex,
  totalCount,
  onExit,
  subtitle,
  rightExtra
}) => {
  const [seconds, setSeconds] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = totalCount > 0
    ? Math.min(100, Math.round(((currentIndex) / totalCount) * 100))
    : 0;

  return (
    <header className="sticky top-0 z-40 bg-[#F7FAFF]/90 backdrop-blur-md border-b border-[#E7EEF8]">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Exit & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onExit}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#8BA0BD] hover:text-[#29466F] hover:bg-white border border-transparent hover:border-[#E7EEF8] transition-all select-none"
            title="退出学习 (进度自动暂存)"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="truncate">
            <h2 className="text-sm sm:text-base font-bold text-[#29466F] truncate flex items-center gap-2">
              <span>{title}</span>
            </h2>
            {subtitle && (
              <p className="text-[11px] text-[#8BA0BD] truncate hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Center: Progress Display & Micro Bar */}
        <div className="flex flex-col items-center justify-center flex-1 max-w-xs px-2">
          <div className="text-xs sm:text-sm font-bold text-[#29466F] font-mono tracking-wide">
            {currentIndex} <span className="text-[#8BA0BD] font-normal">/</span> {totalCount}
          </div>
          <div className="w-full h-1.5 bg-[#E7EEF8] rounded-full overflow-hidden mt-1.5">
            <div
              className="h-full bg-[#4F7DF3] rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Right: Timer & Tools */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs text-[#8BA0BD]">
          {rightExtra}

          {/* Clean Timer */}
          <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs font-semibold text-[#8BA0BD] bg-white px-2.5 py-1 rounded-lg border border-[#E7EEF8]">
            <Clock className="w-3.5 h-3.5 text-[#4F7DF3]" />
            <span>{formatTime(seconds)}</span>
          </div>

          {/* Quick Help Modal Trigger */}
          <button
            type="button"
            onClick={() => setShowHelp(prev => !prev)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8BA0BD] hover:text-[#29466F] hover:bg-white border border-transparent hover:border-[#E7EEF8] transition-all"
            title="帮助说明与快捷键"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Lightweight Help Dropdown */}
      {showHelp && (
        <div className="absolute right-4 sm:right-8 top-16 mt-2 w-72 bg-white rounded-2xl p-4 shadow-xl border border-[#E7EEF8] text-xs space-y-3 z-50 animate-fadeIn text-[#29466F]">
          <div className="font-bold border-b border-[#E7EEF8] pb-2 text-[#29466F]">
            学习操作提示
          </div>
          <div className="space-y-1.5 text-[#8BA0BD]">
            <div className="flex justify-between">
              <span>检查答案 / 下一步</span>
              <kbd className="px-1.5 py-0.5 bg-[#F7FAFF] border border-[#E7EEF8] rounded text-[#29466F] font-mono">Enter</kbd>
            </div>
            <div className="flex justify-between">
              <span>重新播放发音</span>
              <span className="text-[#29466F]">点击 🔊 图标</span>
            </div>
            <div className="flex justify-between">
              <span>学习进度</span>
              <span className="text-[#29466F]">实时自动保存</span>
            </div>
          </div>
          <button
            onClick={() => setShowHelp(false)}
            className="w-full py-1.5 bg-[#F7FAFF] hover:bg-[#E7EEF8] text-[#29466F] font-medium rounded-lg text-center"
          >
            知道了
          </button>
        </div>
      )}
    </header>
  );
};
