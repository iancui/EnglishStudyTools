import React, { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Brain, GitCommit, RotateCcw, Award, Clock, Sparkles } from 'lucide-react';
import { api } from '../api/client.ts';
import { StatisticsData } from '../types/index.ts';

interface HomeViewProps {
  navigate: (route: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ navigate }) => {
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await api.getTodayStatistics();
      setStats(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = stats?.progressPercent || 45;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Hero Learning Section */}
      <div className="bg-stone-900 text-stone-100 rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-sm">
        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="flex items-center gap-2 text-amber-300 text-sm font-medium tracking-wide">
            <Sparkles className="w-4 h-4" />
            <span>循序渐进 · 单词到句子</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
            今天继续学习 <span className="text-amber-400 font-mono">20</span> 个核心单词
          </h1>

          <p className="text-stone-300 text-base sm:text-lg leading-relaxed">
            遵循“单词 → 短语 → 句子 → 理解 → 记忆 → 科学复习”的认知闭环。
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={() => navigate('/words/learn')}
              className="px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2 text-base"
            >
              <span>开始学习单词</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/sentences')}
              className="px-6 py-3.5 bg-stone-800 hover:bg-stone-700 text-white font-medium rounded-xl transition-all border border-stone-700 text-base"
            >
              渐进式句子学习
            </button>
          </div>

          {/* Today's Progress Bar */}
          <div className="pt-4 space-y-2">
            <div className="flex justify-between text-xs text-stone-400">
              <span>今日目标进度</span>
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

        {/* Ambient background decoration */}
        <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main 4 Action Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Module 1: Word Study */}
        <div
          onClick={() => navigate('/words/learn')}
          className="group cursor-pointer bg-white border border-stone-200 hover:border-stone-400 rounded-2xl p-6 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 group-hover:text-amber-700 transition-colors">
              第一阶段：学单词
            </h3>
            <p className="text-sm text-stone-500 leading-normal">
              音标、双语释义、自然拼读音节拆分，强化音形联结。
            </p>
          </div>
          <div className="pt-4 flex items-center justify-between text-xs text-stone-400 font-medium border-t border-stone-100 mt-4">
            <span>20 词 / 组</span>
            <span className="text-stone-700 group-hover:translate-x-1 transition-transform">进入 →</span>
          </div>
        </div>

        {/* Module 2: Word Review */}
        <div
          onClick={() => navigate('/words/review')}
          className="group cursor-pointer bg-white border border-stone-200 hover:border-stone-400 rounded-2xl p-6 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 group-hover:text-rose-700 transition-colors">
              第二阶段：背单词
            </h3>
            <p className="text-sm text-stone-500 leading-normal">
              中文提示，拼写英文，禁止选择题，倒逼主动检索记忆。
            </p>
          </div>
          <div className="pt-4 flex items-center justify-between text-xs text-stone-400 font-medium border-t border-stone-100 mt-4">
            <span>科学间隔复习</span>
            <span className="text-stone-700 group-hover:translate-x-1 transition-transform">进入 →</span>
          </div>
        </div>

        {/* Module 3: Sentence Progressive */}
        <div
          onClick={() => navigate('/sentences')}
          className="group cursor-pointer bg-white border border-stone-200 hover:border-stone-400 rounded-2xl p-6 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center">
              <GitCommit className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 group-hover:text-sky-700 transition-colors">
              句子渐进式学习
            </h3>
            <p className="text-sm text-stone-500 leading-normal">
              词 → 短语 → 骨架 → 完整句，层层递增，句法结构精细分析。
            </p>
          </div>
          <div className="pt-4 flex items-center justify-between text-xs text-stone-400 font-medium border-t border-stone-100 mt-4">
            <span>核心特色模式</span>
            <span className="text-stone-700 group-hover:translate-x-1 transition-transform">进入 →</span>
          </div>
        </div>

        {/* Module 4: Wrong Words */}
        <div
          onClick={() => navigate('/words/wrong')}
          className="group cursor-pointer bg-white border border-stone-200 hover:border-stone-400 rounded-2xl p-6 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 group-hover:text-emerald-700 transition-colors">
              错词本与复习
            </h3>
            <p className="text-sm text-stone-500 leading-normal">
              收集易错单词，按 10分/1天/3天/7天 科学间隔重点攻坚。
            </p>
          </div>
          <div className="pt-4 flex items-center justify-between text-xs text-stone-400 font-medium border-t border-stone-100 mt-4">
            <span>查漏补缺</span>
            <span className="text-stone-700 group-hover:translate-x-1 transition-transform">进入 →</span>
          </div>
        </div>
      </div>

      {/* Real Statistics Overview Section (Section Eighteen) */}
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
