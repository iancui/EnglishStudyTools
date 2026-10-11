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
  onDirectStartSentencePractice?: (restart?: boolean) => void;
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
  const [wordDictionaryName, setWordDictionaryName] = useState('');
  const [wordChapters, setWordChapters] = useState<{ id: string; name: string; sequence?: number }[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    loadHomeData();
    // 所选句子单元变化时刷新句子进度与进行中会话
  }, [config.sentenceChapterId, config.sentenceDictionaryId, config.defaultDictionaryId, config.wordStudyChapterId]);

  useEffect(() => {
    let cancelled = false;
    const loadWordDictionaryInfo = async () => {
      const dictionaryId = config.defaultDictionaryId || '';
      if (!dictionaryId) {
        setWordDictionaryName('');
        setWordChapters([]);
        return;
      }
      try {
        const [dictionaries, chapters] = await Promise.all([
          api.getDictionaries(),
          api.getDictionaryChapters(dictionaryId)
        ]);
        if (cancelled) return;
        const dictionary = (Array.isArray(dictionaries) ? dictionaries : [])
          .find((item: any) => item?.id === dictionaryId);
        setWordDictionaryName(typeof dictionary?.name === 'string' ? dictionary.name : '');
        setWordChapters(Array.isArray(chapters)
          ? chapters.filter((item: any) => item && typeof item.id === 'string' && typeof item.name === 'string')
              .map((item: any) => ({ id: item.id, name: item.name, sequence: item.sequence }))
          : []);
      } catch (e) {
        if (cancelled) return;
        console.error('Failed to load word dictionary info:', e);
        setWordDictionaryName('');
        setWordChapters([]);
      }
    };
    void loadWordDictionaryInfo();
    return () => { cancelled = true; };
  }, [config.defaultDictionaryId]);

  const handleWordChapterChange = async (chapterId: string) => {
    if (chapterId === (config.wordStudyChapterId || '')) return;
    try {
      await onUpdateConfig?.({ wordStudyChapterId: chapterId || undefined });
    } catch (e) {
      console.error('Failed to switch word chapter:', e);
    }
  };

  const loadHomeData = async () => {
    try {
      setLoading(true);
      const [statsRes, sessionRes, sentenceSessionRes] = await Promise.all([
        api.getTodayStatistics(),
        api.getActiveStudySession(config.defaultDictionaryId, config.wordStudyChapterId),
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

  // 词库没有单元，或配置里残留了已删除的单元 ID 时，回退到整本词库，避免创建会话时报错。
  const effectiveWordChapterId = wordChapters.some(ch => ch.id === config.wordStudyChapterId)
    ? config.wordStudyChapterId
    : undefined;

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
              dictionaryId: config.defaultDictionaryId,
              chapterId: effectiveWordChapterId,
              mode: modeOverride || activeSession!.mode,
              writeSortMode: config.wordStudyWriteOrder || activeSession!.writeSortMode || 'SEQUENCE',
              dictationSortMode: config.wordStudyDictationOrder || activeSession!.dictationSortMode || 'RANDOM',
              includeWrite: configuredIncludeWrite,
              includeDictation: configuredIncludeDictation
            }
          : {
              dictionaryId: config.defaultDictionaryId,
              chapterId: effectiveWordChapterId,
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
          subtitle={wordDictionaryName || (config.defaultDictionaryId ? '当前词库' : '')}
          footerExtra={
            <div className="mt-6 rounded-2xl border border-[#E7EEF8] bg-gradient-to-br from-[#F8FAFF] to-white p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-xs font-bold text-[#526987]">
                  <BookOpen className="h-4 w-4 text-[#4F7DF3]" />
                  学习单元
                </span>
                <span className="max-w-[65%] truncate rounded-full bg-[#EAF0FF] px-2.5 py-1 text-[11px] font-semibold text-[#4269C5]">
                  {wordChapters.find(ch => ch.id === (config.wordStudyChapterId || ''))?.name || (wordChapters.length > 0 ? '请选择单元' : (config.defaultDictionaryId ? '整本词库' : '尚未选择词库'))}
                </span>
              </div>
              {wordChapters.length > 0 ? (
                <>
                  <p className="mb-2 text-xs text-[#8BA0BD]">各单元进度独立保留，点击单元即可开始学习</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {wordChapters.map(ch => {
                      const selected = (config.wordStudyChapterId || '') === ch.id;
                      const progress = stats?.wordChapters?.find(item => item.id === ch.id);
                      const total = Math.max(0, progress?.total || 0);
                      const learned = Math.min(total, Math.max(0, progress?.learned || 0));
                      const mastered = Math.min(learned, Math.max(0, progress?.mastered || 0));
                      const percent = total > 0 ? Math.round((learned / total) * 100) : 0;
                      const hasActiveHere = selected && !!activeSession;
                      const status = hasActiveHere
                        ? '继续学习'
                        : total > 0 && mastered >= total
                          ? '已掌握'
                          : total > 0 && learned >= total
                            ? '待复习'
                            : learned > 0 ? '继续学习' : '开始学习';
                      const statusColor = hasActiveHere
                        ? 'text-amber-600'
                        : status === '已掌握' ? 'text-emerald-600'
                          : status === '待复习' || status === '继续学习' ? 'text-[#4F7DF3]' : 'text-[#8BA0BD]';
                      return (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => handleWordChapterChange(ch.id)}
                          className={`rounded-2xl border p-3 text-left transition-all ${
                            selected
                              ? 'border-[#4F7DF3] bg-[#EAF0FF] ring-2 ring-[#D9E4FF]'
                              : 'border-[#E7EEF8] bg-white hover:border-[#C7D7F5] hover:bg-[#F8FAFF]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="min-w-0 break-words text-sm font-bold text-[#29466F]">{ch.name}</span>
                            <span className={`shrink-0 text-[11px] font-extrabold ${statusColor}`}>
                              {status}
                              {selected && <CheckCircle2 className="ml-1 inline h-3 w-3" />}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[11px] text-[#8BA0BD]">
                            <span>已学 {learned}/{total} · 已掌握 {mastered}</span>
                            <span className="font-bold text-[#526987]">{percent}%</span>
                          </div>
                          {total === 0 ? (
                            <p className="mt-2 text-[11px] text-amber-600">本单元暂无关联单词</p>
                          ) : (
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E7EEF8]">
                              <div className="h-full rounded-full bg-[#4F7DF3] transition-all" style={{ width: `${percent}%` }} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex items-start gap-3 rounded-xl border border-dashed border-[#D5E0F0] bg-white/80 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EAF0FF] text-[#4F7DF3]">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#29466F]">整本词库学习</p>
                    <p className="mt-1 text-xs leading-5 text-[#8BA0BD]">
                      {config.defaultDictionaryId
                        ? '这个词库暂未设置单元，将自动从整本词库中选词，不影响学习。'
                        : '请先在设置中选择词库；没有单元也可以正常学习。'}
                    </p>
                  </div>
                  {config.defaultDictionaryId && (
                    <span className="ml-auto shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">无需分单元</span>
                  )}
                </div>
              )}
            </div>
          }
        />
        <LearningCard
          title="学句子"
          icon="💬"
          total={stats?.totalSentences ?? 0}
          learned={stats?.learnedSentences ?? 0}
          mastered={stats?.masteredSentences ?? 0}
          active={activeSentenceInSelectedUnit}
          activeText="继续学句子"
          startText={selectedUnitStartText}
          onStart={() => onDirectStartSentencePractice?.(false)}
          onContinue={() => navigate('/sentence-practice/' + activeSentenceSession!.id)}
          onRestart={() => onDirectStartSentencePractice?.(true)}
          batchCompleted={(activeSentenceSession?.currentSentenceIndex || 0) + 1}
          batchTotal={activeSentenceSession?.totalCount || 0}
          subtitle={stats?.sentenceDictionaryName || ''}
          footerExtra={
            (stats?.sentenceChapters || []).length > 0 ? (
              <div className="mt-6 rounded-2xl border border-[#E7EEF8] bg-gradient-to-br from-[#F8FAFF] to-white p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-xs font-bold text-[#526987]">
                    <BookOpen className="h-4 w-4 text-[#4F7DF3]" />
                    学习单元
                  </span>
                  <span className="max-w-[65%] truncate rounded-full bg-[#EAF0FF] px-2.5 py-1 text-[11px] font-semibold text-[#4269C5]">
                    {stats?.sentenceChapterName || '选择一个单元'}
                  </span>
                </div>
                <p className="mb-2 text-xs text-[#8BA0BD]">每个单元独立记录进度，点击即可切换学习范围</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(stats?.sentenceChapters || []).map(ch => {
                    const selected = (config.sentenceChapterId || '') === ch.id;
                    const total = Math.max(0, ch.total || 0);
                    const learned = Math.min(total, Math.max(0, ch.learned || 0));
                    const mastered = Math.min(learned, Math.max(0, ch.mastered || 0));
                    const percent = total > 0 ? Math.round((learned / total) * 100) : 0;
                    const status = unitStateLabel(ch);
                    const statusColor = unitStateColor(ch);
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => handleChapterChange(ch.id)}
                        className={`rounded-2xl border p-3 text-left transition-all ${
                          selected
                            ? 'border-[#4F7DF3] bg-[#EAF0FF] ring-2 ring-[#D9E4FF]'
                            : 'border-[#E7EEF8] bg-white hover:border-[#C7D7F5] hover:bg-[#F8FAFF]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="min-w-0 break-words text-sm font-bold text-[#29466F]">{ch.name}</span>
                          <span className={`shrink-0 text-[11px] font-extrabold ${statusColor}`}>
                            {status}
                            {selected && <CheckCircle2 className="ml-1 inline h-3 w-3" />}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-[#8BA0BD]">
                          <span>已学 {learned}/{total} · 已掌握 {mastered}</span>
                          <span className="font-bold text-[#526987]">{percent}%</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E7EEF8]">
                          <div className="h-full rounded-full bg-[#4F7DF3] transition-all" style={{ width: `${percent}%` }} />
                        </div>
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
