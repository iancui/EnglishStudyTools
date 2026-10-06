import React, { useEffect, useState, useCallback } from 'react';
import { Volume2, ChevronLeft, ChevronRight, Split, CheckCircle2, RotateCcw, Snail } from 'lucide-react';
import { api } from '../api/client.ts';
import { WordItem, WordPhonics } from '../types/index.ts';
import { SpeechPlayer } from '../utils/speech.ts';
import { PhonicsSplitter } from '../components/PhonicsSplitter.tsx';

interface WordLearnViewProps {
  navigate: (route: string) => void;
  config: any;
}

export const WordLearnView: React.FC<WordLearnViewProps> = ({ navigate, config }) => {
  const [words, setWords] = useState<WordItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showPhonics, setShowPhonics] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState<'normal' | 'slow'>('normal');
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
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

  const playAudio = useCallback(async (speed: 'normal' | 'slow' = audioSpeed) => {
    if (!currentWord) return;
    setIsSpeaking(true);
    const lang = config?.audioType === 'US' ? 'en-US' : 'en-GB';
    const rate = speed === 'slow' ? 0.75 : 1.0;
    await SpeechPlayer.speak(currentWord.text, { lang, rate });
    setIsSpeaking(false);
  }, [currentWord, config, audioSpeed]);

  // Autoplay audio on word transition
  useEffect(() => {
    if (currentWord) {
      setShowPhonics(false);
      playAudio('normal');
    }
  }, [currentIndex, currentWord]);

  const handleNext = async () => {
    if (currentWord) {
      try {
        await api.markWordLearned(currentWord.id);
      } catch (e) {
        console.error(e);
      }
    }

    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Completed current batch
      navigate('/words/review');
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-stone-500 text-sm">正在加载今日学习单词...</p>
      </div>
    );
  }

  if (!currentWord) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-stone-900">暂无待学单词</h2>
        <p className="text-stone-500 text-sm">今日单词已全部完成学习，前往复习或学习句子。</p>
        <button
          onClick={() => navigate('/words/review')}
          className="px-6 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-medium"
        >
          前往背单词
        </button>
      </div>
    );
  }

  const activePhonetic = config?.phoneticType === 'US'
    ? (currentWord.phoneticUs || currentWord.phoneticUk)
    : (currentWord.phoneticUk || currentWord.phoneticUs);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Header & Progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
          <span className="uppercase tracking-wider">第一阶段：学单词</span>
          <span>·</span>
          <span>{config?.englishDict || 'Oxford'} 辞书</span>
        </div>

        <div className="text-sm font-mono text-stone-700 bg-stone-100 px-3 py-1 rounded-full">
          {currentIndex + 1} / {words.length}
        </div>
      </div>

      {/* Main Big Word Card */}
      <div className="bg-white border border-stone-200 rounded-3xl p-8 sm:p-14 text-center shadow-sm space-y-8 transition-all">
        {/* Dominant Word Typography (Visual Center) */}
        <div className="space-y-3">
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-stone-950 font-serif">
            {currentWord.text}
          </h1>

          {/* Phonetic & Accent indication */}
          <div className="flex items-center justify-center gap-3 text-stone-500 text-lg sm:text-xl font-mono">
            <span>{activePhonetic}</span>
            <span className="text-xs uppercase font-sans text-stone-400">
              ({config?.phoneticType || 'UK'})
            </span>
          </div>
        </div>

        {/* Audio Player Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => playAudio('normal')}
            className={`px-5 py-2.5 rounded-full border transition-all flex items-center gap-2 text-sm font-medium ${
              !isSpeaking
                ? 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
                : 'bg-amber-400 border-amber-400 text-stone-950 scale-105'
            }`}
          >
            <Volume2 className="w-4 h-4 text-amber-700" />
            <span>标准朗读</span>
          </button>

          <button
            onClick={() => {
              setAudioSpeed(s => s === 'normal' ? 'slow' : 'normal');
              playAudio(audioSpeed === 'normal' ? 'slow' : 'normal');
            }}
            className="px-4 py-2.5 rounded-full border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition-all flex items-center gap-1.5 text-xs font-medium"
            title="慢速朗读"
          >
            <Snail className="w-3.5 h-3.5 text-stone-500" />
            <span>慢速 (0.75x)</span>
          </button>

          <button
            onClick={() => setShowPhonics(prev => !prev)}
            className={`px-4 py-2.5 rounded-full border transition-all flex items-center gap-1.5 text-xs font-medium ${
              showPhonics
                ? 'bg-stone-900 text-white border-stone-900'
                : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            <span>{showPhonics ? '收起拆分' : '自然拼读拆分'}</span>
          </button>
        </div>

        {/* Phonics Splitter Card (Conditional Reveal) */}
        {showPhonics && (
          <div className="pt-2">
            <PhonicsSplitter
              wordText={currentWord.text}
              phonics={currentWord.phonics}
              audioType={config?.audioType || 'UK'}
            />
          </div>
        )}

        {/* Meaning and Example */}
        <div className="pt-4 border-t border-stone-100 max-w-lg mx-auto text-left space-y-4">
          {currentWord.meanings.map((m, idx) => (
            <div key={m.id || idx} className="space-y-1.5">
              <div className="flex items-baseline gap-2">
                <span className="font-serif italic font-semibold text-amber-800 text-base">
                  {m.pos}
                </span>
                <span className="text-xl font-bold text-stone-800">
                  {m.definitionCn}
                </span>
              </div>

              {m.definitionEn && (
                <p className="text-xs text-stone-500">
                  {m.definitionEn}
                </p>
              )}

              {m.exampleEn && (
                <div className="bg-stone-50 rounded-xl p-3 text-xs space-y-1 mt-2 border border-stone-100">
                  <div className="text-stone-800 font-medium">{m.exampleEn}</div>
                  <div className="text-stone-500">{m.exampleCn}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Step Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="px-5 py-3 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-1 text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>上一个</span>
        </button>

        <button
          onClick={handleNext}
          className="px-8 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white transition-all flex items-center gap-2 text-sm font-semibold shadow-sm"
        >
          <span>{currentIndex === words.length - 1 ? '完成并进入背单词' : '下一个单词'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
