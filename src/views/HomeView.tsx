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
  onDirectStartSentencePractice?: () => void;
  config: DictionaryConfig;
  onUpdateConfig?: (patch: Partial<DictionaryConfig>) => Promise<void>;
}


const LearningCard: React.FC<{
  title: string;
  icon: string;
  total: number;
  learned: number;
  mastered: number;
  active?: boolean;
  activeText?: string;
  startText?: string;
  onStart: () => void;
  onContinue?: () => void;
  onRestart?: () => void;
  batchCompleted?: number;
  batchTotal?: number;
  subtitle?: string;
  footerExtra?: React.ReactNode;
}> = ({
  title,
  icon,
  total,
  learned,
  mastered,
  active,
  activeText,
  startText,
  onStart,
  onContinue,
  onRestart,
  batchCompleted = 0,
  batchTotal = 0,
  subtitle,
  footerExtra
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
              {subtitle && (
                <p className="text-xs font-semibold text-[#4F7DF3] mt-1.5 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />{subtitle}
                </p>
              )}
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

      {footerExtra}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6">
        <button
          type="button"
          onClick={active && onContinue ? onContinue : onStart}
          className="py-3.5 px-5 bg-[#4F7DF3] hover:bg-[#3D6CE5] text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-sm"
        >
          <span>
            {active
              ? (activeText || '继续学习') + (batchTotal > 0 ? ' ' + batchCompleted + '/' + batchTotal : '')
              : (startText || '开始' + title)}
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
  onDirectStartSentencePractice,
  config,
  onUpdateConfig,
}) => {
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [activeSession, setActiveSession] = useState<StudySessionItem | null>(null);
  const [activeSentenceSession, setActiveSentenceSession] = useState<SentencePracticeSession | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    loadHomeData();
    // 所选单元变化时（初始加载/切换单元）自动按新单元刷新进行中会话与统计
  }, [config.sentenceChapterId]);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      const [statsRes, sessionRes, sentenceSessionRes] = await Promise.all([
        api.getTodayStatistics(),
        api.getActiveStudySession(),
        api.getActiveSentencePracticeSession(config.sentenceChapterId || '')
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

  /* 切换“学句子”单元：保存到用户配置；统计与进行中会话由 config 变化触发的 effect 自动刷新 */
  const handleChapterChange = async (chapterId: string) => {
    if (chapterId === (config.sentenceChapterId || '')) return;
    try {
      await onUpdateConfig?.({ sentenceChapterId: chapterId || undefined });
    } catch (e) {
      console.error('Failed to switch chapter:', e);
    }
  };

  /* ---------- 学句子卡片：按当前所选单元显示“继续/开始”状态 ---------- */
  const selectedChapterId = config.sentenceChapterId || '';
  const chapterList = stats?.sentenceChapters || [];
  const selectedChapter = chapterList.find(c => c.id === selectedChapterId);
  // 进行中的句子会话是否属于当前所选单元（无单元辞书两侧都是 ''，视为匹配）
  const activeSentenceInSelectedUnit =
    !!activeSentenceSession && (activeSentenceSession.chapterId || '') === selectedChapterId;
  // 句子学完不代表掌握；全学过后仍可进入复习
  const selectedUnitStartText = selectedChapter
    ? (selectedChapter.total > 0 && selectedChapter.learned >= selectedChapter.total
        ? (selectedChapter.mastered >= selectedChapter.total ? '重新学本单元' : '复习本单元')
        : selectedChapter.learned > 0 ? '继续学本单元' : '开始学本单元')
    : '开始学句子';

  /* 单元 chip 上的状态标签：进行中会话 > 进度判断 */
  const unitStateLabel = (ch: { id: string; total: number; learned: number; mastered: number }) => {
    const hasActiveHere = !!activeSentenceSession && (activeSentenceSession.chapterId || '') === ch.id;
    if (hasActiveHere) return '继续学习';
    if (ch.total > 0 && ch.mastered >= ch.total) return '已掌握';
    if (ch.total > 0 && ch.learned >= ch.total) return '待复习';
    return ch.learned > 0 ? '继续学习' : '开始学习';
  };
  const unitStateColor = (ch: { id: string; total: number; learned: number; mastered: number }) => {
    const hasActiveHere = !!activeSentenceSession && (activeSentenceSession.chapterId || '') === ch.id;
    if (hasActiveHere) return 'text-amber-600';
    if (ch.total > 0 && ch.mastered >= ch.total) return 'text-emerald-600';
    if (ch.total > 0 && ch.learned >= ch.total) return 'text-[#4F7DF3]';
    return ch.learned > 0 ? 'text-[#4F7DF3]' : 'text-stone-400';
  };

  const handleStartWordStudy = async (modeOverride?: SessionMode, restart = false) => {
    const configuredIncludeWrite = config.wordStudyIncludeWrite !== false;
    const configuredIncludeDictation = config.wordStudyIncludeDictation !== false;

    // An in-progress session keeps the settings it was created with. If the
    // learner changed the write/dictation settings afterward, don't silently
    // resume that old session and make it look as if the new settings failed.
    const activeSettingsMismatch = !!activeSession && (
      activeSession.includeWrite !== configuredIncludeWrite ||
      activeSession.includeDictation !== configuredIncludeDictation
    );

    if (activeSession && !restart) {
      if (!activeSettingsMismatch) {
        navigate('/study/' + activeSession.id);
        return;
      }

      const restartWithCurrentSettings = window.confirm(
        '当前未完成的学习任务使用的是旧配置。是否保留本批次单词，按当前“背写 / 强化听写”配置重新开始？取消则继续旧任务。'
      );
      if (!restartWithCurrentSettings) {
        navigate('/study/' + activeSession.id);
        return;
      }
      restart = true;
    }

    try {
      const isSameBatchRestart = restart && !modeOverride && !!activeSession;
      const session = await api.createStudySession(
        isSameBatchRestart
          ? {
              wordIds: activeSession!.words.map((w) => w.wordId),
              mode: modeOverride || activeSession!.mode,
              writeSortMode: config.wordStudyWriteOrder || activeSession!.writeSortMode || 'SEQUENCE',
              dictationSortMode: config.wordStudyDictationOrder || activeSession!.dictationSortMode || 'RANDOM',
              includeWrite: configuredIncludeWrite,
              includeDictation: configuredIncludeDictation
            }
          : {
              dictionaryId: config.defaultDictionaryId,
              chapterId: config.wordStudyChapterId,
              count: config.wordStudyCount || 20,
              excludeMastered: true,
              sortMode: 'SEQUENCE',
              writeSortMode: config.wordStudyWriteOrder || 'SEQUENCE',
              dictationSortMode: config.wordStudyDictationOrder || 'RANDOM',
              includeWrite: configuredIncludeWrite,
              includeDictation: configuredIncludeDictation,
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
          active={activeSentenceInSelectedUnit}
          activeText="继续学句子"
          startText={selectedUnitStartText}
          onStart={() => onDirectStartSentencePractice?.()}
          onContinue={() => navigate('/sentence-practice/' + activeSentenceSession!.id)}
          onRestart={() => onDirectStartSentencePractice?.()}
          batchCompleted={(activeSentenceSession?.currentSentenceIndex || 0) + 1}
          batchTotal={activeSentenceSession?.totalCount || 0}
          subtitle={
            stats?.sentenceDictionaryName
              ? [stats.sentenceDictionaryName, stats.sentenceChapterName].filter(Boolean).join(' · ')
              : ''
          }
          footerExtra={
            (stats?.sentenceChapters || []).length > 0 ? (
              <div className="mt-6">
                <label className="text-xs font-bold text-stone-500 block mb-2">切换单元（进度独立保留）</label>
                <div className="flex flex-wrap gap-2">
                  {(stats?.sentenceChapters || []).map(ch => {
                    const active = (config.sentenceChapterId || '') === ch.id;
                    const pct = ch.total > 0 ? Math.round((ch.learned / ch.total) * 100) : 0;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => handleChapterChange(ch.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all text-left ${
                          active
                            ? 'border-amber-400 bg-amber-50 text-stone-900 ring-2 ring-amber-200'
                            : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <span>{ch.name}</span>
                        <span className="ml-2 text-[10px] text-stone-400">
                          {ch.learned}/{ch.total} · {pct}%
                        </span>
                        <span className={`ml-1.5 text-[10px] font-extrabold ${unitStateColor(ch)}`}>
                          {unitStateLabel(ch)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : undefined
          }
        />
      </div>

    </div>
  );
};
