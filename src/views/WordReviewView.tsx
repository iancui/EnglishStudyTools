import React, { useEffect, useState, useRef } from 'react';
import { Volume2, CheckCircle2, XCircle, Eye, ArrowRight, RotateCcw, Sparkles } from 'lucide-react';
import { api } from '../api/client.ts';
import { WordItem } from '../types/index.ts';
import { SpeechPlayer } from '../utils/speech.ts';

interface WordReviewViewProps {
  navigate: (route: string) => void;
  config: any;
}

export const WordReviewView: React.FC<WordReviewViewProps> = ({ navigate, config }) => {
  const [words, setWords] = useState<WordItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Memorize state
  const [showPhonetic, setShowPhonetic] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [result, setResult] = useState<{
    isCorrect: boolean;
    correctAnswer: string;
    phonetic?: string;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadReviewWords();
  }, []);

  const loadReviewWords = async () => {
    try {
      setLoading(true);
      const data = await api.getTodayWords(20);
      setWords(data);
      setCurrentIndex(0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const currentWord = words[currentIndex];

  useEffect(() => {
    // Reset inputs on word change
    setUserInput('');
    setHasSubmitted(false);
    setResult(null);
    setShowPhonetic(false);

    // Auto-focus input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [currentIndex, currentWord]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentWord || hasSubmitted || !userInput.trim()) return;

    try {
      const res = await api.checkWordAnswer(currentWord.id, userInput.trim());
      setResult(res);
      setHasSubmitted(true);

      // Play correct word audio
      const lang = config?.audioType === 'US' ? 'en-US' : 'en-GB';
      SpeechPlayer.speak(currentWord.text, { lang });
    } catch (err) {
      console.error(err);
    }
  };

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Completed round
      navigate('/statistics');
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-stone-500 text-sm">正在加载背诵词库...</p>
      </div>
    );
  }

  if (!currentWord) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-stone-900">恭喜！今日背诵任务已全部完成</h2>
        <p className="text-stone-500 text-sm">你已完成所有待背单词的检索与检测。</p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/sentences')}
            className="px-6 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-medium"
          >
            去练习句子
          </button>
          <button
            onClick={() => navigate('/statistics')}
            className="px-6 py-2.5 border border-stone-200 text-stone-700 rounded-xl text-sm font-medium"
          >
            查看学习记录
          </button>
        </div>
      </div>
    );
  }

  const primaryMeaning = currentWord.meanings[0];
  const activePhonetic = config?.phoneticType === 'US'
    ? (currentWord.phoneticUs || currentWord.phoneticUk)
    : (currentWord.phoneticUk || currentWord.phoneticUs);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-stone-500 font-medium tracking-wide">
          <span>第二阶段：背单词</span>
          <span className="mx-2">·</span>
          <span>中文回忆拼写</span>
        </div>

        <div className="text-sm font-mono text-stone-700 bg-stone-100 px-3 py-1 rounded-full">
          {currentIndex + 1} / {words.length}
        </div>
      </div>

      {/* Main Memorization Card */}
      <div className="bg-white border border-stone-200 rounded-3xl p-8 sm:p-12 shadow-sm text-center space-y-8 transition-all">
        {/* Part of Speech & Chinese Prompt */}
        <div className="space-y-3">
          <span className="text-sm font-serif italic text-amber-800 font-semibold bg-amber-50 px-3 py-1 rounded-full">
            {primaryMeaning?.pos || currentWord.pos}
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-stone-900 tracking-tight">
            {primaryMeaning?.definitionCn || '释义待补'}
          </h2>
        </div>

        {/* Phonetic Reveal Trigger */}
        <div>
          {!showPhonetic ? (
            <button
              type="button"
              onClick={() => setShowPhonetic(true)}
              className="text-xs text-stone-500 hover:text-stone-800 py-1.5 px-3 rounded-lg border border-dashed border-stone-300 hover:border-stone-400 transition-colors inline-flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>[显示音标提示]</span>
            </button>
          ) : (
            <div className="text-lg font-mono text-stone-600 animate-fadeIn">
              {activePhonetic}
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              disabled={hasSubmitted}
              placeholder="输入英文单词..."
              className={`w-full text-center text-2xl font-medium px-4 py-3.5 rounded-2xl border-2 transition-all outline-none font-serif ${
                !hasSubmitted
                  ? 'border-stone-200 focus:border-stone-900 bg-white'
                  : result?.isCorrect
                  ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900'
                  : 'border-rose-400 bg-rose-50/50 text-rose-900'
              }`}
            />
          </div>

          {!hasSubmitted ? (
            <button
              type="submit"
              disabled={!userInput.trim()}
              className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white font-semibold rounded-xl transition-all shadow-sm text-base"
            >
              提交 (Enter)
            </button>
          ) : null}
        </form>

        {/* Evaluation Feedback */}
        {hasSubmitted && result && (
          <div className="animate-fadeIn max-w-md mx-auto space-y-5">
            {result.isCorrect ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div className="text-left">
                  <div className="font-bold text-base">回答正确！</div>
                  <div className="text-xs text-emerald-700 mt-0.5">已根据记忆曲线安排下一次复习</div>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2 text-center">
                <div className="flex items-center justify-center gap-1.5 font-bold text-rose-700">
                  <XCircle className="w-5 h-5" />
                  <span>回答错误</span>
                </div>
                <div className="text-sm">
                  正确答案：
                  <span className="font-bold text-lg font-serif text-rose-950 ml-1">
                    {result.correctAnswer}
                  </span>
                  <span className="text-stone-500 font-mono text-xs ml-2">
                    {result.phonetic}
                  </span>
                </div>
                <div className="text-xs text-rose-600">已加入重点复习队列</div>
              </div>
            )}

            <button
              onClick={handleNext}
              className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-base shadow-sm"
            >
              <span>{currentIndex === words.length - 1 ? '查看背诵统计' : '下一个单词'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="text-center text-xs text-stone-400">
        💡 自动忽略首尾空格与大小写差异 · 支持键盘 Enter 快捷提交
      </div>
    </div>
  );
};
