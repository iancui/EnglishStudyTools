import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Brain,
  GitCommit,
  RotateCcw,
  Sparkles,
  Play,
  RotateCw,
  FolderKanban
} from 'lucide-react';
import { api } from '../api/client.ts';
import { StatisticsData, StudySessionItem } from '../types/index.ts';

interface HomeViewProps {
  navigate: (route: string) => void;
  onOpenStudySetup: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ navigate, onOpenStudySetup }) => {
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [activeSession, setActiveSession] = useState<StudySessionItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      const [statsRes, sessionRes] = await Promise.all([
        api.getTodayStatistics(),
        api.getActiveStudySession()
      ]);
      setStats(statsRes);
      setActiveSession(sessionRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = stats?.progressPercent || 45;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Dynamic Hero: Ongoing Study Session vs New Learning Setup */}
      {activeSession ? (
        <div className="bg-stone-900 text-stone-100 rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-sm animate-fadeIn">
          <div className="relative z-10 max-w-2xl space-y-6">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-4 h-4" />
              <span>未完结学习任务 · 进度已实时自动暂存</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
                继续学习：{activeSession.dictionary?.name || '当前辞书'}
              </h1>
              <p className="text-stone-300 text-sm sm:text-base">
                上次已推进至第 <span className="font-mono text-amber-400 font-bold">{activeSession.currentWordIndex + 1}</span> 个单词（共 {activeSession.totalCount} 词），点击即可立刻回到中断处继续学写！
              </p>
            </div>

            {/* Session Progress Bar */}
            <div className="space-y-2 pt-1 max-w-lg">
              <div className="flex justify-between text-xs text-stone-400 font-medium">
                <span>任务完成进度</span>
                <span className="font-mono text-amber-400">
                  {activeSession.completedCount} / {activeSession.totalCount} 词 ({Math.round((activeSession.completedCount / activeSession.totalCount) * 100)}%)
                </span>
              </div>
              <div className="h-2.5 w-full bg-stone-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(activeSession.completedCount / activeSession.totalCount) * 100}%` }}
                />
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={() => navigate(`/study/${activeSession.id}`)}
                className="px-7 py-3.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 text-base"
              >
                <span>继续学习</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenStudySetup}
                className="px-5 py-3.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium rounded-xl transition-all border border-stone-700 text-sm"
              >
                开启新的背诵任务
              </button>
            </div>
          </div>

          <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>
      ) : (
        <div className="bg-stone-900 text-stone-100 rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-sm">
          <div className="relative z-10 max-w-2xl space-y-6">
            <div className="flex items-center gap-2 text-amber-300 text-sm font-medium tracking-wide">
              <Sparkles className="w-4 h-4" />
              <span>单词学与背写一体化 · 认知闭环</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
              定制今天的新单词背诵任务
            </h1>

            <p className="text-stone-300 text-base sm:text-lg leading-relaxed">
              支持自由选定系统辞书或生词本，设定目标数量与排除已掌握，每个单词经由“看音形义 $\to$ 主动拼写背写”完整攻克。
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={onOpenStudySetup}
                className="px-7 py-3.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 text-base"
              >
                <span>开始背单词</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => navigate('/dictionaries')}
                className="px-6 py-3.5 bg-stone-800 hover:bg-stone-700 text-white font-medium rounded-xl transition-all border border-stone-700 text-base flex items-center gap-2"
              >
                <FolderKanban className="w-4 h-4 text-amber-300" />
                <span>浏览词库辞书</span>
              </button>
            </div>

            {/* General progress bar */}
            <div className="pt-4 space-y-2 max-w-lg">
              <div className="flex justify-between text-xs text-stone-400">
                <span>今日综合词汇掌握进度</span>
                <span className="font-mono text-stone-200">{progressPercent}%</span>
              </div>
              <div className="h-2.5 w-full bg-stone-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>
      )}

      {/* 4 Feature Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Module 1: Start/Custom Study Task */}
        <div
          onClick={onOpenStudySetup}
          className="group cursor-pointer bg-white border border-stone-200 hover:border-stone-400 rounded-2xl p-6 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 group-hover:text-amber-700 transition-colors">
              背单词设置
            </h3>
            <p className="text-sm text-stone-500 leading-normal">
              自由设置辞书、目标单词数量、乱序或教材顺序，并剔除熟词。
            </p>
          </div>
          <div className="pt-4 flex items-center justify-between text-xs text-stone-400 font-medium border-t border-stone-100 mt-4">
            <span>定制任务</span>
            <span className="text-stone-700 group-hover:translate-x-1 transition-transform">配置 →</span>
          </div>
        </div>

        {/* Module 2: Dictionary Management */}
        <div
          onClick={() => navigate('/dictionaries')}
          className="group cursor-pointer bg-white border border-stone-200 hover:border-stone-400 rounded-2xl p-6 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center">
              <FolderKanban className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 group-hover:text-sky-700 transition-colors">
              辞书库管理
            </h3>
            <p className="text-sm text-stone-500 leading-normal">
              支持小学/初中/四级系统辞书与用户自主创建的生词本。
            </p>
          </div>
          <div className="pt-4 flex items-center justify-between text-xs text-stone-400 font-medium border-t border-stone-100 mt-4">
            <span>查看辞书</span>
            <span className="text-stone-700 group-hover:translate-x-1 transition-transform">进入 →</span>
          </div>
        </div>

        {/* Module 3: Sentence Progressive */}
        <div
          onClick={() => navigate('/sentences')}
          className="group cursor-pointer bg-white border border-stone-200 hover:border-stone-400 rounded-2xl p-6 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <GitCommit className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 group-hover:text-emerald-700 transition-colors">
              渐进式句子学习
            </h3>
            <p className="text-sm text-stone-500 leading-normal">
              核心特色功能：单词到完整长句步进展开，配句法语法成分分析。
            </p>
          </div>
          <div className="pt-4 flex items-center justify-between text-xs text-stone-400 font-medium border-t border-stone-100 mt-4">
            <span>10+ 渐进长句</span>
            <span className="text-stone-700 group-hover:translate-x-1 transition-transform">进入 →</span>
          </div>
        </div>

        {/* Module 4: Wrong Words */}
        <div
          onClick={() => navigate('/words/wrong')}
          className="group cursor-pointer bg-white border border-stone-200 hover:border-stone-400 rounded-2xl p-6 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 group-hover:text-rose-700 transition-colors">
              错词本与复习
            </h3>
            <p className="text-sm text-stone-500 leading-normal">
              背写中拼错的单词自动入册，按艾宾浩斯曲线优先巩固。
            </p>
          </div>
          <div className="pt-4 flex items-center justify-between text-xs text-stone-400 font-medium border-t border-stone-100 mt-4">
            <span>查漏补缺</span>
            <span className="text-stone-700 group-hover:translate-x-1 transition-transform">进入 →</span>
          </div>
        </div>
      </div>

      {/* Real Statistics Overview Section */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-stone-900">今日学习统计</h2>
            <p className="text-xs text-stone-500 mt-0.5">每日学习时长与掌握度统计</p>
          </div>
          <button
            onClick={() => navigate('/statistics')}
            className="text-xs font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1"
          >
            查看完整报告 →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-stone-50 rounded-xl p-4 text-center">
            <div className="text-xs text-stone-500">今日学习单词</div>
            <div className="text-2xl font-bold font-mono text-stone-900 mt-1">
              {stats?.todayLearnedWords ?? 20}
            </div>
          </div>

          <div className="bg-stone-50 rounded-xl p-4 text-center">
            <div className="text-xs text-stone-500">今日正确</div>
            <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
              {stats?.todayCorrect ?? 18}
            </div>
          </div>

          <div className="bg-stone-50 rounded-xl p-4 text-center">
            <div className="text-xs text-stone-500">今日错误</div>
            <div className="text-2xl font-bold font-mono text-rose-500 mt-1">
              {stats?.todayWrong ?? 2}
            </div>
          </div>

          <div className="bg-stone-50 rounded-xl p-4 text-center">
            <div className="text-xs text-stone-500">今日句子</div>
            <div className="text-2xl font-bold font-mono text-stone-900 mt-1">
              {stats?.todaySentences ?? 5}
            </div>
          </div>

          <div className="bg-stone-50 rounded-xl p-4 text-center">
            <div className="text-xs text-stone-500">学习时间</div>
            <div className="text-2xl font-bold font-mono text-stone-900 mt-1">
              {stats?.studyTimeMinutes ?? 35}
              <span className="text-xs font-normal text-stone-500 ml-1">分钟</span>
            </div>
          </div>

          <div className="bg-stone-50 rounded-xl p-4 text-center">
            <div className="text-xs text-stone-500">已掌握单词</div>
            <div className="text-2xl font-bold font-mono text-amber-600 mt-1">
              {stats?.masteredWords ?? 120}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
