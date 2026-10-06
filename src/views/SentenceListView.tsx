import React, { useEffect, useState } from 'react';
import { ArrowRight, GitCommit, CheckCircle2, ChevronRight, BookOpen } from 'lucide-react';
import { api } from '../api/client.ts';
import { SentenceItem } from '../types/index.ts';

interface SentenceListViewProps {
  navigate: (route: string) => void;
}

export const SentenceListView: React.FC<SentenceListViewProps> = ({ navigate }) => {
  const [sentences, setSentences] = useState<SentenceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSentences();
  }, []);

  const loadSentences = async () => {
    try {
      setLoading(true);
      const data = await api.getAllSentences();
      setSentences(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-stone-500 text-sm">正在加载渐进式句子库...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Title & Philosophy Header */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-amber-700 tracking-wider uppercase">
          特色功能 · 渐进式认知构建
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
          渐进式句子学习
        </h1>
        <p className="text-stone-600 text-sm sm:text-base leading-relaxed max-w-2xl">
          打破“死记长句”的枯燥模式：从核心词汇、功能短语、句型骨架到完整语境，逐步递增，配有句法语法成分精解。
        </p>
      </div>

      {/* Sentence Catalogue Cards */}
      <div className="grid grid-cols-1 gap-4">
        {sentences.map((s, index) => {
          const isCompleted = s.progress?.status === 'COMPLETED';
          return (
            <div
              key={s.id}
              onClick={() => navigate(`/sentences/${s.id}`)}
              className="group cursor-pointer bg-white border border-stone-200 hover:border-stone-400 rounded-2xl p-6 transition-all shadow-sm hover:shadow-md flex items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3 text-xs text-stone-500">
                  <span className="font-mono text-stone-400">#{index + 1}</span>
                  <span>·</span>
                  <span className="font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    等级 {s.level}
                  </span>
                  <span>·</span>
                  <span>{s.steps.length} 个递进步骤</span>
                  {isCompleted && (
                    <>
                      <span>·</span>
                      <span className="text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 已掌握
                      </span>
                    </>
                  )}
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-stone-900 group-hover:text-amber-800 transition-colors font-serif">
                  {s.content}
                </h3>

                <p className="text-sm text-stone-600">
                  {s.translation}
                </p>
              </div>

              <div className="flex items-center text-stone-400 group-hover:text-stone-900 transition-colors shrink-0">
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
