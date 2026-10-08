import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  GitCommit,
  RotateCcw,
  Sparkles,
  BarChart3,
  Settings,
  Flame,
  CheckCircle2,
  Clock,
  Headphones,
  GraduationCap
} from 'lucide-react';
import { api } from '../api/client.ts';
import { StatisticsData, StudySessionItem, SentencePracticeSession, SessionMode, DictionaryConfig } from '../types/index.ts';

interface HomeViewProps {
  navigate: (route: string) => void;
  onStartSentencePractice?: () => void;
  config: DictionaryConfig;
}


const LearningCard: React.FC<{
  title: string;
  icon: string;
  total: number;
  learned: number;
  mastered: number;
  active?: boolean;
  activeText?: string;
  onStart: () => void;
  onContinue?: () => void;
  onRestart?: () => void;
  batchCompleted?: number;
  batchTotal?: number;
}> = ({
  title,
  icon,
  total,
  learned,
  mastered,
  active,
  activeText,
  onStart,
  onContinue,
  onRestart,
  batchCompleted = 0,
  batchTotal = 0
}) => {
  const safeTotal = Math.max(0, total);
  const safeLearned = Math.min(safeTotal, Math.max(0, learned));
  const safeMastered = Math.min(safeLearned, Math.max(0, mastered));
  const learnedUnmastered = Math.max(0, safeLearned - safeMastered);
  const unlearned = Math.max(0, safeTotal - safeLearned);

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const gap = safeTotal > 0 ? 2 : 0;
  const usableCircumference = Math.max(0, circumference - gap * 3);
  const masteredLength = safeTotal > 0 ? usableCircumference * (safeMastered / safeTotal) : 0;
  const learnedLength = safeTotal > 0 ? usableCircumference * (learnedUnmastered / safeTotal) : 0;
  const unlearnedLength = safeTotal > 0 ? usableCircumference * (unlearned / safeTotal) : 0;

  let offset = 0;
  const masteredOffset = -offset;
  offset += masteredLength + gap;
  const learnedOffset = -offset;
  offset += learnedLength + gap;
  const unlearnedOffset = -offset;

  return (
    <div className="bg-white border border-[#E7EEF8] rounded-3xl p-6 sm:p-7 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="relative w-36 h-36 shrink-0 mx-auto sm:mx-0">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-[#EEF2F7]"
            />
            {safeTotal > 0 && (
              <>
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  strokeLinecap="butt"
                  strokeDasharray={`${masteredLength} ${circumference - masteredLength}`}
                  strokeDashoffset={masteredOffset}
                  className="text-emerald-500 transition-all duration-700"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  strokeLinecap="butt"
                  strokeDasharray={`${learnedLength} ${circumference - learnedLength}`}
                  strokeDashoffset={learnedOffset}
                  className="text-[#4F7DF3] transition-all duration-700"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  strokeLinecap="butt"
                  strokeDasharray={`${unlearnedLength} ${circumference - unlearnedLength}`}
                  strokeDashoffset={unlearnedOffset}
                  className="text-[#DCE5F2] transition-all duration-700"
                />
              </>
            )}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold text-[#29466F] leading-none">{safeTotal}</span>
            <span className="text-[11px] text-[#8BA0BD] mt-1">总单词</span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">{icon}</span>
            <div>
              <h2 className="text-xl font-bold text-[#29466F]">{title}</h2>
              <p className="text-xs text-[#8BA0BD] mt-0.5">词库总体进度</p>
            </div>
          </div>

          <div className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[#29466F]">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                已掌握
              </span>
              <span className="font-bold text-emerald-600">{safeMastered}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[#29466F]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4F7DF3]" />
                已学未掌握
              </span>
              <span className="font-bold text-[#4F7DF3]">{learnedUnmastered}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[#8BA0BD]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#DCE5F2]" />
                未学习
              </span>
              <span className="font-bold text-[#8BA0BD]">{unlearned}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6">
        <button
          type="button"
          onClick={active && onContinue ? onContinue : onStart}
          className="py-3.5 px-5 bg-[#4F7DF3] hover:bg-[#3D6CE5] text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-sm"
        >
          <span>
            {active
              ? (activeText || '继续学习') + (batchTotal > 0 ? ' ' + batchCompleted + '/' + batchTotal : '')
              : '开始' + title}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
        {active && onRestart && (
          <button
            type="button"
            onClick={onRestart}
            className="py-3.5 px-5 bg-white hover:bg-[#F7F9FC] border border-[#DCE5F2] text-[#29466F] font-bold rounded-2xl transition-all text-sm"
          >
            重新开始
          </button>
        )}
      </div>

    </div>
  );
};

export const HomeView: React.FC<HomeViewProps> = ({
  navigate,
  onStartSentencePractice,
  config
}) => {
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [activeSession, setActiveSession] = useState<StudySessionItem | null>(null);
  const [activeSentenceSession, setActiveSentenceSession] = useState<SentencePracticeSession | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      const [statsRes, sessionRes, sentenceSessionRes] = await Promise.all([
        api.getTodayStatistics(),
        api.getActiveStudySession(),
        api.getActiveSentencePracticeSession()
      ]);
      setStats(statsRes);
      setActiveSession(sessionRes);
      setActiveSentenceSession(sentenceSessionRes);
    } catch (e) {
      console.error('Failed to load home data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartWordStudy = async (modeOverride?: SessionMode, restart = false) => {
    if (activeSession && !restart) {
      navigate('/study/' + activeSession.id);
      return;
    }

    try {
      const isSameBatchRestart = restart && !modeOverride && !!activeSession;
      const session = await api.createStudySession(
        isSameBatchRestart
          ? {
              wordIds: activeSession!.words.map((w) => w.wordId),
              mode: activeSession!.mode,
              writeSortMode: activeSession!.writeSortMode,
              dictationSortMode: activeSession!.dictationSortMode
            }
          : {
              dictionaryId: config.defaultDictionaryId,
              chapterId: config.wordStudyChapterId,
              count: config.wordStudyCount || 20,
              excludeMastered: config.wordStudyExcludeMastered !== false,
              sortMode: config.wordStudySortMode || 'RANDOM',
              writeSortMode: config.wordStudyWriteOrder || 'SEQUENCE',
              dictationSortMode: config.wordStudyDictationOrder || 'RANDOM',
              includeWrite: config.wordStudyIncludeWrite !== false,
              includeDictation: config.wordStudyIncludeDictation !== false,
              mode: modeOverride || 'LEARN_AND_WRITE'
            }
      );
      navigate('/study/' + session.id);
    } catch (e: any) {
      alert('开始学习失败：' + (e?.message || '没有符合条件的单词'));
    }
  };



  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-10 animate-fadeIn">
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#29466F]">今天学一点</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LearningCard
          title="背单词"
          icon="📚"
          total={stats?.totalWords || 0}
          learned={stats?.learnedWords || 0}
          mastered={stats?.masteredWords || 0}
          active={!!activeSession}
          activeText={activeSession?.phase === 'DICTATION' ? '继续强化听写' : '继续背单词'}
          onStart={() => handleStartWordStudy()}
          onContinue={() => navigate('/study/' + activeSession!.id)}
          onRestart={() => handleStartWordStudy(undefined, true)}
          batchCompleted={activeSession?.completedCount || 0}
          batchTotal={activeSession?.totalCount || 0}
        />
        <LearningCard
          title="学句子"
          icon="💬"
          total={stats?.totalSentences || 0}
          learned={stats?.learnedSentences || 0}
          mastered={stats?.masteredSentences || 0}
          active={!!activeSentenceSession}
          activeText="继续学句子"
          onStart={() => onStartSentencePractice?.()}
          onContinue={() => navigate('/sentence-practice/' + activeSentenceSession!.id)}
          onRestart={() => onStartSentencePractice?.()}
        />
      </div>

>
    </div>
  );
};
