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
  onOpenStudySetup: (dictId?: string, mode?: SessionMode) => void;
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
}> = ({ title, icon, total, learned, mastered, active, activeText, onStart, onContinue }) => {
  const percent = total > 0 ? Math.min(100, Math.round((mastered / total) * 100)) : 0;
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - percent / 100);
  return (
    <div className="bg-white border border-[#E7EEF8] rounded-3xl p-6 sm:p-7 shadow-xs">
      <div className="flex items-center gap-5">
        <div className="relative w-28 h-28 shrink-0">
          <svg viewBox="0 0 112 112" className="w-full h-full -rotate-90">
            <circle cx="56" cy="56" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-[#E7EEF8]" />
            <circle cx="56" cy="56" r={radius} fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset} className="text-[#4F7DF3] transition-all duration-500" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold text-[#29466F]">{percent}%</span>
            <span className="text-[10px] text-[#8BA0BD]">已掌握</span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">{icon}</span>
            <h2 className="text-xl font-bold text-[#29466F]">{title}</h2>
          </div>
          <div className="flex gap-5 text-sm">
            <div><span className="font-bold text-[#29466F]">{total}</span><span className="text-[#8BA0BD] ml-1">总数</span></div>
            <div><span className="font-bold text-[#4F7DF3]">{learned}</span><span className="text-[#8BA0BD] ml-1">已学</span></div>
            <div><span className="font-bold text-emerald-600">{mastered}</span><span className="text-[#8BA0BD] ml-1">已掌握</span></div>
          </div>
        </div>
      </div>
      <button type="button" onClick={active && onContinue ? onContinue : onStart} className="w-full mt-6 py-3.5 px-5 bg-[#4F7DF3] hover:bg-[#3D6CE5] text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-sm">
        <span>{active ? (activeText || '继续学习') : '开始' + title}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export const HomeView: React.FC<HomeViewProps> = ({
  navigate,
  onOpenStudySetup,
  onStartSentencePractice,
  config
}) => {
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [activeSession, setActiveSession] = useState<StudySessionItem | null>(null);
  const [activeSentenceSession, setActiveSentenceSession] = useState<SentencePracticeSession | null>(null);
  const [loading, setLoading] = useState(true);

  // 今日复习：独立 state，加载成功才有值（避免闪烁先显示 0）
  const [reviewWords, setReviewWords] = useState<any[] | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

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
      // 今日复习独立加载，失败不影响主数据
      loadReviewWords();
    }
  };

  const handleStartWordStudy = async (modeOverride?: SessionMode) => {
    if (activeSession) {
      navigate('/study/' + activeSession.id);
      return;
    }

    try {
      const session = await api.createStudySession({
        dictionaryId: config.defaultDictionaryId,
        chapterId: config.wordStudyChapterId,
        count: config.wordStudyCount || 20,
        excludeMastered: config.wordStudyExcludeMastered !== false,
        sortMode: config.wordStudySortMode || 'RANDOM',
        mode: modeOverride || config.wordStudyMode || 'LEARN_AND_WRITE'
      });
      navigate('/study/' + session.id);
    } catch (e: any) {
      alert('开始学习失败：' + (e?.message || '没有符合条件的单词'));
    }
  };

  const loadReviewWords = async () => {
    try {
      setReviewError(null);
      const words = await api.getTodayReview();
      setReviewWords(words || []);
    } catch (e) {
      console.error('Failed to load today review:', e);
      setReviewError('复习数据加载失败');
    }
  };

  // 开始今日复习：用到期词直接创建 StudySession，不走 SetupModal
  const handleStartTodayReview = async () => {
    if (!reviewWords || reviewWords.length === 0) return;

    // 保护已有 IN_PROGRESS Session
    if (activeSession) {
      const ok = window.confirm(
        '已有一个正在进行的学习任务，开始今日复习会结束当前任务，是否继续？'
      );
      if (!ok) return;
    }

    try {
      const wordIds = reviewWords.map((w) => w.id).filter(Boolean);
      const session = await api.createStudySession({
        wordIds,
        mode: 'LEARN_AND_WRITE'
      });
      navigate(`/study/${session.id}`);
    } catch (e: any) {
      alert('创建今日复习任务失败：' + (e?.message || '未知错误'));
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-10 animate-fadeIn">
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#29466F]">今天学一点</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LearningCard title="背单词" icon="📚" total={stats?.totalWords || 0} learned={stats?.learnedWords || 0} mastered={stats?.masteredWords || 0} active={!!activeSession} activeText="继续背单词" onStart={() => handleStartWordStudy()} onContinue={() => navigate('/study/' + activeSession!.id)} />
        <LearningCard title="学句子" icon="💬" total={stats?.totalSentences || 0} learned={stats?.learnedSentences || 0} mastered={stats?.masteredSentences || 0} active={!!activeSentenceSession} activeText="继续学句子" onStart={() => onStartSentencePractice?.()} onContinue={() => navigate('/sentence-practice/' + activeSentenceSession!.id)} />
      </div>

      <div className="flex flex-wrap gap-3">
        {reviewWords !== null && (
          <button type="button" onClick={handleStartTodayReview} disabled={reviewWords.length === 0}
            className="px-4 py-2.5 rounded-xl bg-white border border-[#E7EEF8] text-sm font-semibold text-[#29466F] hover:border-[#4F7DF3]/40 disabled:opacity-50">
            今日复习{reviewWords.length > 0 ? ` · ${reviewWords.length}` : ''}
          </button>
        )}
        <button type="button" onClick={() => handleStartWordStudy('WRITE_ONLY')}
          className="px-4 py-2.5 rounded-xl bg-white border border-[#E7EEF8] text-sm font-semibold text-[#29466F] hover:border-[#4F7DF3]/40">
          单词听写
        </button>
        <button type="button" onClick={() => navigate('/words/wrong')}
          className="px-4 py-2.5 rounded-xl bg-white border border-[#E7EEF8] text-sm font-semibold text-[#29466F] hover:border-[#4F7DF3]/40">
          错词本
        </button>
        <button type="button" onClick={() => navigate('/statistics')}
          className="px-4 py-2.5 rounded-xl bg-white border border-[#E7EEF8] text-sm font-semibold text-[#29466F] hover:border-[#4F7DF3]/40">
          学习记录
        </button>
        <button type="button" onClick={() => navigate('/settings')}
          className="px-4 py-2.5 rounded-xl bg-white border border-[#E7EEF8] text-sm font-semibold text-[#29466F] hover:border-[#4F7DF3]/40">
          设置
        </button>
      </div>
    </div>
  );
};
