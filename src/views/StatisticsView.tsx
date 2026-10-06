import React, { useEffect, useState } from 'react';
import { Award, Clock, BookOpen, Brain, CheckCircle2, XCircle, Flame, BarChart2 } from 'lucide-react';
import { api } from '../api/client.ts';
import { StatisticsData } from '../types/index.ts';

interface StatisticsViewProps {
  navigate: (route: string) => void;
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({ navigate }) => {
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [todayData, overviewData] = await Promise.all([
        api.getTodayStatistics(),
        api.getOverviewStatistics()
      ]);
      setStats(todayData);
      setOverview(overviewData);
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
        <p className="text-stone-500 text-sm">正在加载学习报告...</p>
      </div>
    );
  }

  const accuracy = stats?.accuracyRate ?? 0;
  const progressPercent = stats?.progressPercent ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Title */}
      <div>
        <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
          学习报告 · 科学复盘
        </div>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight mt-1">
          学习记录与统计
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          直观呈现今日战绩与长期记忆曲线沉淀。
        </p>
      </div>

      {/* Hero Stats Card */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-6">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-stone-500 uppercase">词库综合掌握进度</span>
            <div className="text-3xl font-bold font-mono text-stone-900">
              {progressPercent}%
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              <div>
                <div className="text-xs text-stone-400">连续打卡</div>
                <div className="text-sm font-bold text-stone-800 font-mono">
                  {overview?.currentStreakDays ?? 0} 天
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              <div>
                <div className="text-xs text-stone-400">背诵准确率</div>
                <div className="text-sm font-bold text-emerald-600 font-mono">
                  {accuracy}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Visual Bar (Section Eighteen) */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-stone-500 font-medium">
            <span>基础核心词汇库 (已掌握 {stats?.masteredWords ?? 0} 词 / 总 {stats?.totalWords ?? 0} 词)</span>
            <span className="font-mono">{progressPercent}%</span>
          </div>
          <div className="h-3.5 w-full bg-stone-100 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${stats?.totalWords ? Math.round(((stats.masteredWords || 0) / stats.totalWords) * 100) : 0}%` }}
              title="已掌握"
            />
            <div
              className="bg-amber-400 h-full transition-all duration-500"
              style={{ width: `${stats?.totalWords ? Math.round(((stats.learningWords || 0) / stats.totalWords) * 100) : 0}%` }}
              title="学习中"
            />
          </div>
          <div className="flex items-center gap-4 text-[11px] text-stone-400 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>已掌握 ({stats?.masteredWords ?? 0})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>学习中 ({stats?.learningWords ?? 0})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-stone-200" />
              <span>未学习 ({Math.max(0, (stats?.totalWords || 0) - (stats?.masteredWords || 0) - (stats?.learningWords || 0))})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Key Numerical Indicators (Section Eighteen) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-1">
          <div className="text-xs text-stone-500">今日学习单词</div>
          <div className="text-3xl font-bold font-mono text-stone-900">
            {stats?.todayLearnedWords ?? 0}
          </div>
          <div className="text-[11px] text-stone-400">词汇新知与回顾</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-1">
          <div className="text-xs text-stone-500">今日正确拼写</div>
          <div className="text-3xl font-bold font-mono text-emerald-600">
            {stats?.todayCorrect ?? 0}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">精准记忆反馈</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-1">
          <div className="text-xs text-stone-500">今日拼写错误</div>
          <div className="text-3xl font-bold font-mono text-rose-500">
            {stats?.todayWrong ?? 0}
          </div>
          <div className="text-[11px] text-stone-400">已列入错词本</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-1">
          <div className="text-xs text-stone-500">今日学语句</div>
          <div className="text-3xl font-bold font-mono text-sky-700">
            {stats?.todaySentences ?? 0}
          </div>
          <div className="text-[11px] text-stone-400">句法递进阶梯</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-1">
          <div className="text-xs text-stone-500">今日学习时间</div>
          <div className="text-3xl font-bold font-mono text-stone-900">
            {stats?.studyTimeMinutes ?? 0}
            <span className="text-xs font-normal text-stone-500 ml-1">分钟</span>
          </div>
          <div className="text-[11px] text-stone-400">高效专注时长</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-1">
          <div className="text-xs text-stone-500">累计掌握单词</div>
          <div className="text-3xl font-bold font-mono text-amber-600">
            {stats?.masteredWords ?? 0}
          </div>
          <div className="text-[11px] text-amber-700">长时记忆固化</div>
        </div>
      </div>

      {/* Quick Navigation Footer */}
      <div className="flex flex-wrap gap-3 pt-2">
        <button
          onClick={() => navigate('/words/learn')}
          className="px-6 py-3 bg-stone-900 text-white rounded-xl text-sm font-semibold hover:bg-stone-800 transition-colors"
        >
          继续学习单词
        </button>
        <button
          onClick={() => navigate('/sentences')}
          className="px-6 py-3 bg-stone-100 text-stone-800 rounded-xl text-sm font-semibold hover:bg-stone-200 transition-colors"
        >
          探索学语句
        </button>
      </div>
    </div>
  );
};
