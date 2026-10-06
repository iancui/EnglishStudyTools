import React, { useEffect, useState } from 'react';
import {
  RotateCcw,
  Volume2,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CheckSquare,
  Square,
  Headphones,
  BookOpen,
  Sparkles,
  Loader2
} from 'lucide-react';
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
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const [startingSession, setStartingSession] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    loadWrongWords();
  }, []);

  const loadWrongWords = async () => {
    try {
      setLoading(true);
      const data = await api.getWrongWords();
      setWords(data);
      // Default: select all words
      setSelectedWordIds(data.map(w => w.id));
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

  const handleToggleSelect = (wordId: string) => {
    setSelectedWordIds(prev =>
      prev.includes(wordId) ? prev.filter(id => id !== wordId) : [...prev, wordId]
    );
  };

  const handleSelectAll = () => {
    setSelectedWordIds(words.map(w => w.id));
  };

  const handleDeselectAll = () => {
    setSelectedWordIds([]);
  };

  // 复习选中: LEARN_AND_WRITE
  const handleReviewSelected = async () => {
    if (selectedWordIds.length === 0) return;
    try {
      setStartingSession(true);
      setActionError('');
      const session = await api.createStudySession({
        wordIds: selectedWordIds,
        mode: 'LEARN_AND_WRITE'
      });
      navigate(`/study/${session.id}`);
    } catch (err: any) {
      setActionError(err.message || '创建复习任务失败');
      setStartingSession(false);
    }
  };

  // 听写选中: WRITE_ONLY
  const handleDictateSelected = async () => {
    if (selectedWordIds.length === 0) return;
    try {
      setStartingSession(true);
      setActionError('');
      const session = await api.createStudySession({
        wordIds: selectedWordIds,
        mode: 'WRITE_ONLY'
      });
      navigate(`/study/${session.id}`);
    } catch (err: any) {
      setActionError(err.message || '创建听写任务失败');
      setStartingSession(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="w-10 h-10 border-4 border-[#4F7DF3] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#8BA0BD] text-sm">正在加载错词本...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8 animate-fadeIn pb-28">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-rose-600 tracking-wider uppercase flex items-center gap-1.5">
            <span>查漏补缺 · 重点攻坚</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#29466F] tracking-tight mt-1">
            错词本
          </h1>
          <p className="text-[#8BA0BD] text-sm mt-1">
            背诵中拼写错误的单词自动汇聚于此。支持多选单词开启“专项复习”或“纯听写默写”。
          </p>
        </div>

        {words.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold font-mono px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
              共 {words.length} 个错词
            </span>
          </div>
        )}
      </div>

      {actionError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
          <span>{actionError}</span>
        </div>
      )}

      {words.length === 0 ? (
        <div className="bg-white border border-[#E7EEF8] rounded-3xl p-12 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-[#29466F]">太棒了，目前暂无错词！</h3>
          <p className="text-[#8BA0BD] text-sm max-w-sm mx-auto">
            你在背诵中展现了出色的准确度。继续保持，去学习新的单词或渐进句子吧。
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2.5 bg-[#4F7DF3] text-white rounded-xl text-sm font-semibold hover:bg-[#3D6CE5] transition-colors shadow-xs"
            >
              返回首页
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Top Operation Bar: Select All / Deselect All / Selected Count */}
          <div className="bg-white border border-[#E7EEF8] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3 text-xs font-medium">
              <span className="text-[#29466F] font-bold">
                错词列表（共 {words.length} 词）
              </span>
              <span className="text-stone-300">·</span>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[#4F7DF3] hover:underline cursor-pointer"
              >
                全选
              </button>
              <span className="text-stone-300">|</span>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-[#8BA0BD] hover:underline cursor-pointer"
              >
                取消全选
              </button>
            </div>

            <div className="text-xs">
              <span className="text-[#8BA0BD]">已选择 </span>
              <strong className="text-[#4F7DF3] font-mono text-sm font-bold">
                {selectedWordIds.length}
              </strong>
              <span className="text-[#8BA0BD]"> / {words.length} 个单词</span>
            </div>
          </div>

          {/* Word Cards Grid with Checkboxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {words.map(w => {
              const wrongCount = w.progress?.wrongCount || 1;
              const streak = w.progress?.streak || 0;
              const isSelected = selectedWordIds.includes(w.id);

              return (
                <div
                  key={w.id}
                  onClick={() => handleToggleSelect(w.id)}
                  className={`border rounded-2xl p-5 transition-all space-y-3 cursor-pointer select-none ${
                    isSelected
                      ? 'bg-white border-[#4F7DF3] shadow-xs ring-2 ring-[#4F7DF3]/10'
                      : 'bg-white/70 border-[#E7EEF8] hover:border-stone-300 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="pt-1 text-[#4F7DF3]">
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-[#4F7DF3]" />
                        ) : (
                          <Square className="w-5 h-5 text-[#8BA0BD]" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-[#29466F] font-serif">
                            {w.text}
                          </span>
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              playWordAudio(w.text);
                            }}
                            className="p-1 rounded-full text-[#8BA0BD] hover:text-[#4F7DF3] hover:bg-[#F7FAFF] transition-colors"
                            title="朗读"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-xs font-mono text-[#8BA0BD] mt-0.5">
                          {w.activePhonetic || w.phoneticUk}
                        </div>
                      </div>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                      错误 {wrongCount} 次
                    </span>
                  </div>

                  <div className="text-sm text-[#29466F] font-medium pl-8">
                    {w.meanings[0]?.pos} {w.meanings[0]?.definitionCn}
                  </div>

                  <div className="pt-2 border-t border-[#E7EEF8] flex items-center justify-between text-xs text-[#8BA0BD] pl-8">
                    <span>当前连续正确: {streak} 次</span>
                    <span>掌握度: {w.progress?.mastery || 0}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Bottom Action Bar */}
      {words.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E7EEF8] py-4 px-4 shadow-lg">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <span className="text-[#8BA0BD]">当前已选：</span>
              <span className="font-bold text-[#29466F] font-mono text-base">
                {selectedWordIds.length}
              </span>
              <span className="text-[#8BA0BD]">个错词</span>
              {selectedWordIds.length === 0 && (
                <span className="text-rose-500 text-xs ml-2">（请勾选单词后开启练习）</span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                disabled={selectedWordIds.length === 0 || startingSession}
                onClick={handleReviewSelected}
                className="flex-1 sm:flex-initial py-3 px-6 bg-white hover:bg-[#F7FAFF] border border-[#4F7DF3] text-[#4F7DF3] disabled:opacity-40 disabled:border-[#E7EEF8] disabled:text-[#8BA0BD] font-bold rounded-2xl text-xs sm:text-sm transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
                title="学 -> 发音 -> 释义 -> 背写"
              >
                {startingSession ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                <span>复习选中 ({selectedWordIds.length})</span>
              </button>

              <button
                type="button"
                disabled={selectedWordIds.length === 0 || startingSession}
                onClick={handleDictateSelected}
                className="flex-1 sm:flex-initial py-3 px-6 bg-[#4F7DF3] hover:bg-[#3D6CE5] disabled:opacity-40 text-white font-bold rounded-2xl text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                title="直接播放发音，输入英文背写"
              >
                {startingSession ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Headphones className="w-4 h-4" />
                )}
                <span>听写选中 ({selectedWordIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
