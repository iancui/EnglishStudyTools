import React, { useEffect, useState } from 'react';
import {
  Headphones,
  PenLine,
  AlertTriangle,
  MessageSquareText,
  CalendarCheck2,
  ArrowRight,
  Loader2,
  Play
} from 'lucide-react';
import { api } from '../api/client.ts';
import { DictionaryConfig, StudySessionItem } from '../types/index.ts';
import { SentencePracticeSetupModal } from './SentencePracticeSetupModal.tsx';

interface ReviewViewProps {
  navigate: (route: string) => void;
  config: DictionaryConfig;
}

export const ReviewView: React.FC<ReviewViewProps> = ({ navigate, config }) => {
  const [activeSession, setActiveSession] = useState<StudySessionItem | null>(null);
  const [todayReviewCount, setTodayReviewCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [starting, setStarting] = useState('');
  const [sentenceModalOpen, setSentenceModalOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getActiveStudySession(),
      api.getTodayReview(),
      api.getWrongWords()
    ]).then(([session, today, wrong]) => {
      setActiveSession(session);
      setTodayReviewCount(Array.isArray(today) ? today.length : 0);
      setWrongCount(Array.isArray(wrong) ? wrong.length : 0);
    }).catch(err => {
      console.error('Failed to load review center:', err);
    });
  }, []);

  const confirmReplaceActive = () => {
    if (!activeSession) return true;
    return window.confirm(
      '当前有一个正在进行的学习批次。开始新的复习任务会结束当前批次，是否继续？'
    );
  };

  const startWordSession = async (
    kind: 'WRITE' | 'DICTATION' | 'TODAY',
    wordIds?: string[]
  ) => {
    if (!confirmReplaceActive()) return;
    try {
      setStarting(kind);
      const session = await api.createStudySession({
        ...(wordIds?.length ? { wordIds } : {
          dictionaryId: config.defaultDictionaryId,
          chapterId: config.wordStudyChapterId,
          count: config.wordStudyCount || 20,
          excludeMastered: config.wordStudyExcludeMastered !== false,
          sortMode: config.wordStudySortMode || 'RANDOM'
        }),
        mode: kind === 'DICTATION' ? 'WRITE_ONLY' : 'LEARN_AND_WRITE',
        writeSortMode: config.wordStudyWriteOrder || 'SEQUENCE',
        dictationSortMode: config.wordStudyDictationOrder || 'RANDOM',
        includeWrite: kind === 'DICTATION'
          ? false
          : kind === 'TODAY'
            ? config.wordStudyIncludeWrite !== false
            : true,
        includeDictation: kind === 'DICTATION'
          ? true
          : kind === 'TODAY'
            ? config.wordStudyIncludeDictation !== false
            : false
      });
      navigate('/study/' + session.id);
    } catch (e: any) {
      alert('开始复习失败：' + (e?.message || '没有符合条件的单词'));
    } finally {
      setStarting('');
    }
  };

  const startTodayReview = async () => {
    try {
      const words = await api.getTodayReview();
      const ids = (words || []).map((w: any) => w.id).filter(Boolean);
      if (!ids.length) {
        alert('当前没有到期复习的单词。');
        return;
      }
      await startWordSession('TODAY', ids);
    } catch (e: any) {
      alert('加载今日复习失败：' + (e?.message || '未知错误'));
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-8 animate-fadeIn">
      <div>
        <div className="text-xs font-bold text-[#4F7DF3] tracking-wider">REVIEW CENTER</div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#29466F] mt-1">复习</h1>
        <p className="text-sm text-[#8BA0BD] mt-2">把已经学过的单词和句子重新练一遍，强化记忆。</p>
      </div>

      {activeSession && (
        <div className="bg-[#EBF2FE] border border-[#D5E3FC] rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-sm text-[#29466F]">
            <span className="font-bold">当前学习批次</span>
            <span className="mx-2 text-[#8BA0BD]">·</span>
            <span>{activeSession.phase === 'DICTATION' ? '强化听写' : '背单词'}</span>
            <span className="ml-2 font-mono font-bold">{activeSession.completedCount}/{activeSession.totalCount}</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/study/' + activeSession.id)}
            className="px-4 py-2 rounded-xl bg-[#4F7DF3] text-white text-xs font-bold flex items-center justify-center gap-1.5"
          >
            继续当前任务 <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ReviewCard
          icon={<PenLine className="w-5 h-5" />}
          title="单词背写"
          description="看中文释义和音标，主动回忆英文拼写。"
          meta={'每次 ' + (config.wordStudyCount || 20) + ' 词 · ' + (config.wordStudyWriteOrder === 'RANDOM' ? '随机顺序' : '顺序')}
          buttonText="开始背写"
          loading={starting === 'WRITE'}
          onClick={() => startWordSession('WRITE')}
        />

        <ReviewCard
          icon={<Headphones className="w-5 h-5" />}
          title="单词听写"
          description="播放英文发音，隐藏音标，听音输入英文拼写。"
          meta={'每次 ' + (config.wordStudyCount || 20) + ' 词 · ' + (config.wordStudyDictationOrder === 'SEQUENCE' ? '顺序' : '随机')}
          buttonText="开始听写"
          loading={starting === 'DICTATION'}
          onClick={() => startWordSession('DICTATION')}
        />

        <ReviewCard
          icon={<AlertTriangle className="w-5 h-5" />}
          title="错词复习"
          description="集中处理最近拼写错误的单词，可勾选、随机抽取并专项复习。"
          meta={'当前 ' + wrongCount + ' 个错词'}
          buttonText="进入错词本"
          onClick={() => navigate('/words/wrong')}
        />

        <ReviewCard
          icon={<MessageSquareText className="w-5 h-5" />}
          title="句子复习"
          description="按章节复习句子，从短语理解逐步重建完整英文句子。"
          meta="渐进式短语 → 完整句子"
          buttonText="开始句子复习"
          onClick={() => setSentenceModalOpen(true)}
        />

        <ReviewCard
          icon={<CalendarCheck2 className="w-5 h-5" />}
          title="今日到期复习"
          description="优先复习已经到达复习时间的单词。"
          meta={'当前 ' + todayReviewCount + ' 个到期词'}
          buttonText="开始今日复习"
          loading={starting === 'TODAY'}
          onClick={startTodayReview}
        />
      </div>

      <div className="rounded-2xl border border-[#E7EEF8] bg-white px-5 py-4 text-xs text-[#8BA0BD]">
        复习任务不会改变原有单词掌握状态的定义；复习结果仍会进入学习记录和间隔复习系统。
      </div>

      <SentencePracticeSetupModal
        isOpen={sentenceModalOpen}
        onClose={() => setSentenceModalOpen(false)}
        onStarted={sessionId => navigate('/sentence-practice/' + sessionId)}
        dictionaryId={config.sentenceDictionaryId || config.defaultDictionaryId}
      />
    </div>
  );
};

const ReviewCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  meta: string;
  buttonText: string;
  onClick: () => void;
  loading?: boolean;
}> = ({ icon, title, description, meta, buttonText, onClick, loading }) => (
  <div className="bg-white border border-[#E7EEF8] rounded-3xl p-6 shadow-xs flex flex-col min-h-52">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-2xl bg-[#EBF2FE] text-[#4F7DF3] flex items-center justify-center">
        {icon}
      </div>
      <h2 className="text-lg font-bold text-[#29466F]">{title}</h2>
    </div>
    <p className="text-sm text-[#6F86A5] leading-6 mt-4 flex-1">{description}</p>
    <div className="text-xs text-[#8BA0BD] mb-3">{meta}</div>
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full py-3 rounded-2xl bg-[#4F7DF3] hover:bg-[#3D6CE5] text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
      {loading ? '正在准备…' : buttonText}
    </button>
  </div>
);
