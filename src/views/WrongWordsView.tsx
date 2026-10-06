import React, { useEffect, useState } from 'react';
import { RotateCcw, Volume2, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client.ts';
import { WordItem } from '../types/index.ts';
import { SpeechPlayer } from '../utils/speech.ts';

interface WrongWordsViewProps {
  navigate: (route: string) => void;
  config: any;
}

export const WrongWordsView: React.FC<WrongWordsViewProps> = ({ navigate, config }) => {
  const [words, setWords] = useState<WordItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWrongWords();
  }, []);

  const loadWrongWords = async () => {
    try {
      setLoading(true);
      const data = await api.getWrongWords();
      setWords(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const playWordAudio = (text: string) => {
    const lang = config?.audioType === 'US' ? 'en-US' : 'en-GB';
    SpeechPlayer.speak(text, { lang });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-stone-500 text-sm">正在加载错词本...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-rose-700 tracking-wider uppercase">
            查漏补缺 · 重点攻坚
          </div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight mt-1">
            错词本
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            背诵中回答错误的单词将自动进入此处，按记忆遗忘规律优先安排复习。
          </p>
        </div>

        {words.length > 0 && (
          <button
            onClick={() => navigate('/words/review')}
            className="px-5 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-semibold hover:bg-stone-800 transition-all flex items-center gap-2 shrink-0 self-start sm:self-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>进入复习</span>
          </button>
        )}
      </div>

      {words.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-3xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-stone-900">太棒了，目前暂无错词！</h3>
          <p className="text-stone-500 text-sm max-w-sm mx-auto">
            你在背诵中展现了出色的准确度。继续保持，去学习新的单词或渐进句子吧。
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/words/learn')}
              className="px-6 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-medium"
            >
              学习新单词
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {words.map(w => {
            const wrongCount = w.progress?.wrongCount || 1;
            const streak = w.progress?.streak || 0;
            return (
              <div
                key={w.id}
                className="bg-white border border-stone-200 rounded-2xl p-5 hover:border-stone-400 transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-stone-900 font-serif">
                        {w.text}
                      </span>
                      <button
                        onClick={() => playWordAudio(w.text)}
                        className="p-1 rounded-full text-stone-400 hover:text-amber-800 hover:bg-stone-100 transition-colors"
                        title="朗读"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-xs font-mono text-stone-400 mt-0.5">
                      {w.activePhonetic || w.phoneticUk}
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700">
                    错误 {wrongCount} 次
                  </span>
                </div>

                <div className="text-sm text-stone-700 font-medium">
                  {w.meanings[0]?.pos} {w.meanings[0]?.definitionCn}
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
                  <span>当前连续正确: {streak} 次</span>
                  <span>掌握度: {w.progress?.mastery || 0}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
