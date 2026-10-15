import React, { useMemo, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  Award,
  BookOpen,
  CalendarCheck2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Flame,
  MessageSquareText,
  RotateCcw,
  Sparkles,
  Target,
  Trophy
} from 'lucide-react';

interface StatisticsViewProps {
  navigate: (route: string) => void;
}

interface ActivityDay {
  key: string;
  date: Date;
  words: number;
  sentences: number;
  reviews: number;
  activityCount: number;
}

interface ActivityCalendar {
  weeks: ActivityDay[][];
  days: ActivityDay[];
  activeDays: number;
  currentStreak: number;
  longestStreak: number;
}

const dateKey = (date: Date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, '0'),
  String(date.getDate()).padStart(2, '0')
].join('-');

const startOfDay = (date: Date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const formatLongDate = (date: Date) => date.toLocaleDateString('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long'
});

const formatMonth = (date: Date) => date.toLocaleDateString('zh-CN', { month: 'short' });

/**
 * UI-only demo activity. This function will later be replaced by aggregated API data.
 * Dates are real calendar dates so the heatmap remains aligned to the current year.
 */
const buildDemoCalendar = (): ActivityCalendar => {
  const today = startOfDay(new Date());
  const weekdayOffset = (today.getDay() + 6) % 7; // Monday-first
  const start = new Date(today);
  start.setDate(start.getDate() - weekdayOffset - (52 * 7));

  const days: ActivityDay[] = [];
  for (let i = 0; i < 53 * 7; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const daysAgo = Math.round((today.getTime() - date.getTime()) / 86400000);
    const seed = (date.getDate() * 7 + (date.getMonth() + 1) * 11 + date.getFullYear()) % 19;
    let words = 0;
    let sentences = 0;
    let reviews = 0;

    if (date <= today) {
      if (daysAgo >= 0 && daysAgo < 12) {
        // The demo data deliberately shows a current 12-day streak.
        words = 2 + (daysAgo % 4);
        sentences = daysAgo % 3 === 0 ? 1 : 0;
        reviews = daysAgo % 4;
      } else if (seed >= 8) {
        words = seed < 12 ? 1 + (seed % 4) : 4 + (seed % 10);
        sentences = seed % 4 === 0 ? 1 + (seed % 2) : 0;
        reviews = seed % 5;
      }
    }

    days.push({
      key: dateKey(date),
      date,
      words,
      sentences,
      reviews,
      activityCount: words + sentences + reviews
    });
  }

  const weeks: ActivityDay[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  const activeDays = days.filter(day => day.date <= today && day.activityCount > 0).length;
  let currentStreak = 0;
  const map = new Map(days.map(day => [day.key, day]));
  for (let ago = 0; ; ago += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - ago);
    const day = map.get(dateKey(date));
    if (!day || day.activityCount === 0) break;
    currentStreak += 1;
  }

  let longestStreak = 0;
  let runningStreak = 0;
  days.forEach(day => {
    if (day.date <= today && day.activityCount > 0) {
      runningStreak += 1;
      longestStreak = Math.max(longestStreak, runningStreak);
    } else {
      runningStreak = 0;
    }
  });

  return { weeks, days, activeDays, currentStreak, longestStreak };
};

const demoWeekTrend = () => {
  const today = startOfDay(new Date());
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const seed = (date.getDate() * 3 + date.getMonth() * 7) % 13;
    return {
      key: dateKey(date),
      label: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
      words: [12, 18, 9, 26, 21, 15, 24][seed % 7],
      sentences: [1, 2, 0, 3, 1, 4, 2][seed % 7]
    };
  });
};

const heatLevel = (count: number) => {
  if (count <= 0) return 'bg-slate-100';
  if (count <= 4) return 'bg-emerald-100';
  if (count <= 8) return 'bg-emerald-300';
  if (count <= 14) return 'bg-emerald-500';
  return 'bg-emerald-700';
};

const todayDemo = {
  learnedWords: 24,
  practicedSentences: 5,
  spellingCorrect: 26,
  spellingWrong: 5,
  reviewCompleted: 18,
  reviewPlanned: 20
};

const wordDemo = {
  total: 1000,
  learned: 500,
  mastered: 320
};

const sentenceDemo = {
  total: 500,
  learned: 200,
  mastered: 80
};

const recentDemoActivity = [
  { icon: BookOpen, title: '单词学习', detail: '完成 20 个单词的学习批次', time: '今天 · 21:05', accent: 'text-blue-600', bg: 'bg-blue-50' },
  { icon: CheckCircle2, title: '强化背写', detail: '正确拼写 18 次，错误 4 次', time: '今天 · 20:42', accent: 'text-emerald-600', bg: 'bg-emerald-50' },
  { icon: MessageSquareText, title: '句子练习', detail: '完成 5 个句子的递进练习', time: '今天 · 20:10', accent: 'text-violet-600', bg: 'bg-violet-50' },
  { icon: RotateCcw, title: '到期复习', detail: '复习了 12 个需要巩固的单词', time: '昨天 · 22:16', accent: 'text-amber-600', bg: 'bg-amber-50' }
];

const ProgressBar = ({ mastered, learning }: { mastered: number; learning: number }) => (
  <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
    <div className="h-full bg-emerald-500 transition-all" style={{ width: String(mastered) + '%' }} />
    <div className="h-full bg-blue-400 transition-all" style={{ width: String(learning) + '%' }} />
  </div>
);

const ProgressOverviewCard = ({
  title,
  subtitle,
  icon: Icon,
  total,
  learned,
  mastered,
  unitLabel,
  onClick,
  accent
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  total: number;
  learned: number;
  mastered: number;
  unitLabel: string;
  onClick: () => void;
  accent: 'blue' | 'violet';
}) => {
  const coverage = total > 0 ? Math.round((learned / total) * 100) : 0;
  const mastery = total > 0 ? Math.round((mastered / total) * 100) : 0;
  const learning = Math.max(0, learned - mastered);
  const unlearned = Math.max(0, total - learned);
  const accentClass = accent === 'blue'
    ? 'bg-blue-50 text-blue-600'
    : 'bg-violet-50 text-violet-600';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={'flex h-11 w-11 items-center justify-center rounded-xl ' + accentClass}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">{title}</h3>
            <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClick}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
        >
          查看
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-6 flex items-end justify-between gap-3">
        <div>
          <div className="text-3xl font-extrabold tracking-tight text-slate-900">{learned.toLocaleString()}</div>
          <div className="mt-1 text-xs text-slate-500">已学过 / 共 {total.toLocaleString()} {unitLabel}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-emerald-600">{mastery}%</div>
          <div className="text-xs text-slate-500">掌握率</div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700">学习覆盖率</span>
          <span className="font-bold text-slate-900">{coverage}%</span>
        </div>
        <ProgressBar mastered={mastery} learning={total > 0 ? Math.round((learning / total) * 100) : 0} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
        <div>
          <div className="text-lg font-bold text-emerald-600">{mastered.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500">已掌握</div>
        </div>
        <div>
          <div className="text-lg font-bold text-blue-600">{learning.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500">学习中</div>
        </div>
        <div>
          <div className="text-lg font-bold text-slate-500">{unlearned.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500">未学习</div>
        </div>
      </div>
    </div>
  );
};

export const StatisticsView: React.FC<StatisticsViewProps> = ({ navigate }) => {
  const calendar = useMemo(() => buildDemoCalendar(), []);
  const weekTrend = useMemo(() => demoWeekTrend(), []);
  const [selectedDate, setSelectedDate] = useState(dateKey(startOfDay(new Date())));
  const selectedDay = calendar.days.find(day => day.key === selectedDate) || calendar.days[calendar.days.length - 1];
  const maxTrendTotal = Math.max(1, ...weekTrend.map(day => day.words + day.sentences));
  const todayAccuracy = Math.round((todayDemo.spellingCorrect / (todayDemo.spellingCorrect + todayDemo.spellingWrong)) * 100);

  return (
    <div className="min-h-full bg-slate-50/70">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-7 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
              <Activity className="h-4 w-4" />
              学习分析
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">学习记录与统计</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              看见每天的坚持、阶段性的进步，以及接下来值得投入的方向。
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
            <Sparkles className="h-3.5 w-3.5" />
            演示数据 · 暂未连接真实统计
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-5 text-white sm:p-6">
            <div className="absolute -right-5 -top-6 h-28 w-28 rounded-full bg-emerald-400/10 blur-2xl" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-slate-300">当前连续学习</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold tracking-tight">{calendar.currentStreak}</span>
                  <span className="text-sm text-slate-300">天</span>
                </div>
                <p className="mt-2 text-xs text-slate-400">今天继续学习，保持你的节奏</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-400/15 text-orange-300">
                <Flame className="h-6 w-6" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-slate-500">累计学习天数</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold tracking-tight text-slate-900">{calendar.activeDays}</span>
                  <span className="text-sm text-slate-500">天</span>
                </div>
                <p className="mt-2 text-xs text-slate-400">过去一年有学习记录的日期</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <CalendarCheck2 className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-slate-500">历史最长连续</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold tracking-tight text-slate-900">{calendar.longestStreak}</span>
                  <span className="text-sm text-slate-500">天</span>
                </div>
                <p className="mt-2 text-xs text-slate-400">给下一次坚持设个小目标</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Trophy className="h-5 w-5" />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">学习足迹</h2>
              <p className="mt-1 text-sm text-slate-500">过去 12 个月的每日学习活动，点击任意一天查看详情。</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700">过去一年</span>
              <span>颜色越深，活动越多</span>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto pb-2">
            <div className="min-w-[760px]">
              <div
                className="ml-8 grid h-5 gap-[3px] text-[10px] text-slate-400"
                style={{ gridTemplateColumns: 'repeat(' + calendar.weeks.length + ', 11px)' }}
              >
                {calendar.weeks.map((week, index) => {
                  const firstOfMonth = week.find(day => day.date.getDate() === 1);
                  return firstOfMonth ? (
                    <span key={index} style={{ gridColumn: String(index + 1) }}>{formatMonth(firstOfMonth.date)}</span>
                  ) : null;
                })}
              </div>

              <div className="flex gap-2">
                <div className="grid w-6 shrink-0 grid-rows-7 gap-[3px] text-[10px] leading-[11px] text-slate-400">
                  <span>一</span><span /><span>三</span><span /><span>五</span><span /><span />
                </div>
                <div className="flex gap-[3px]">
                  {calendar.weeks.map((week, weekIndex) => (
                    <div className="flex flex-col gap-[3px]" key={weekIndex}>
                      {week.map(day => {
                        const level = day.activityCount === 0 ? 0 : day.activityCount <= 4 ? 1 : day.activityCount <= 8 ? 2 : day.activityCount <= 14 ? 3 : 4;
                        const selected = selectedDate === day.key;
                        const future = day.date > startOfDay(new Date());
                        const label = formatLongDate(day.date) + ' · 单词 ' + day.words + '，句子 ' + day.sentences + '，复习 ' + day.reviews;
                        return (
                          <button
                            key={day.key}
                            type="button"
                            title={label}
                            aria-label={label}
                            disabled={future}
                            onClick={() => setSelectedDate(day.key)}
                            className={
                              'h-[11px] w-[11px] rounded-[3px] transition ' +
                              (future ? 'bg-white' : heatLevel(day.activityCount)) +
                              (selected ? ' outline outline-2 outline-blue-600 outline-offset-1' : ' hover:outline hover:outline-1 hover:outline-slate-400')
                            }
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span>少</span>
              <span className="h-3 w-3 rounded-[3px] bg-slate-100" />
              <span className="h-3 w-3 rounded-[3px] bg-emerald-100" />
              <span className="h-3 w-3 rounded-[3px] bg-emerald-300" />
              <span className="h-3 w-3 rounded-[3px] bg-emerald-500" />
              <span className="h-3 w-3 rounded-[3px] bg-emerald-700" />
              <span>多</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <CalendarCheck2 className="h-4 w-4 text-blue-600" />
              <span>{formatLongDate(selectedDay.date)}</span>
              <span className="text-slate-300">|</span>
              <span>单词 {selectedDay.words}</span>
              <span>句子 {selectedDay.sentences}</span>
              <span>复习 {selectedDay.reviews}</span>
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-5 text-slate-400">说明：热力图是演示数据；后续将使用真实的每日学习事件生成。</p>
        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">今日学习概况</h2>
              <p className="mt-1 text-sm text-slate-500">把学习内容、答题表现和复习任务分开看。</p>
            </div>
            <span className="hidden text-xs text-slate-400 sm:inline">示例：今日</span>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500">学习单词</span>
                <BookOpen className="h-4 w-4 text-blue-600" />
              </div>
              <div className="mt-3 text-3xl font-extrabold text-slate-900">{todayDemo.learnedWords}</div>
              <div className="mt-1 text-xs text-slate-500">个不同单词</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500">练习句子</span>
                <MessageSquareText className="h-4 w-4 text-violet-600" />
              </div>
              <div className="mt-3 text-3xl font-extrabold text-slate-900">{todayDemo.practicedSentences}</div>
              <div className="mt-1 text-xs text-slate-500">句</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500">拼写正确率</span>
                <Target className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-3 text-3xl font-extrabold text-emerald-600">{todayAccuracy}%</div>
              <div className="mt-1 text-xs text-slate-500">正确 {todayDemo.spellingCorrect} / 错误 {todayDemo.spellingWrong}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500">完成复习</span>
                <RotateCcw className="h-4 w-4 text-amber-600" />
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-900">{todayDemo.reviewCompleted}</span>
                <span className="text-sm text-slate-500">/ {todayDemo.reviewPlanned}</span>
              </div>
              <div className="mt-1 text-xs text-slate-500">项复习任务</div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">学习覆盖与掌握进度</h2>
            <p className="mt-1 text-sm text-slate-500">覆盖率表示已经学过多少，掌握率表示达到掌握标准的比例。</p>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ProgressOverviewCard
              title="单词"
              subtitle="当前单词词库"
              icon={BookOpen}
              total={wordDemo.total}
              learned={wordDemo.learned}
              mastered={wordDemo.mastered}
              unitLabel="词"
              accent="blue"
              onClick={() => navigate('/words/learn')}
            />
            <ProgressOverviewCard
              title="句子"
              subtitle="当前句子词库"
              icon={MessageSquareText}
              total={sentenceDemo.total}
              learned={sentenceDemo.learned}
              mastered={sentenceDemo.mastered}
              unitLabel="句"
              accent="violet"
              onClick={() => navigate('/sentences')}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">近 7 天学习趋势</h2>
              <p className="mt-1 text-sm text-slate-500">每天涉及的不同单词与句子数量（演示数据）。</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-blue-500" />单词</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-violet-400" />句子</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-7 gap-2">
            {weekTrend.map(day => {
              const total = day.words + day.sentences;
              const wordHeight = (day.words / maxTrendTotal) * 100;
              const sentenceHeight = (day.sentences / maxTrendTotal) * 100;
              return (
                <div key={day.key} className="min-w-0 text-center">
                  <div className="flex h-36 items-end justify-center border-b border-slate-100 pb-1">
                    <div className="flex h-full w-full max-w-9 flex-col-reverse justify-start overflow-hidden rounded-t-md" title={day.key + '：单词 ' + day.words + '，句子 ' + day.sentences}>
                      <div className="w-full rounded-t-sm bg-blue-500" style={{ height: String(wordHeight) + '%' }} />
                      <div className="w-full bg-violet-400" style={{ height: String(sentenceHeight) + '%' }} />
                    </div>
                  </div>
                  <div className="mt-2 text-xs font-semibold text-slate-600">周{day.label}</div>
                  <div className="mt-1 text-[10px] text-slate-400">{total} 项</div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">最近学习活动</h2>
              <p className="mt-1 text-sm text-slate-500">按时间回看最近完成的学习任务。</p>
            </div>
            <Clock3 className="h-5 w-5 text-slate-400" />
          </div>
          <div className="mt-4 divide-y divide-slate-100">
            {recentDemoActivity.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.title + index} className="flex items-center gap-3 py-4 first:pt-1 last:pb-1">
                  <div className={'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ' + item.bg + ' ' + item.accent}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-800">{item.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{item.detail}</div>
                  </div>
                  <div className="shrink-0 text-right text-[11px] text-slate-400">{item.time}</div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <div className="font-bold text-slate-900">下一步，继续积累</div>
            <p className="mt-1 text-sm text-slate-600">每天稳步学一点，比一次学习很多更容易形成长期习惯。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate('/words/learn')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#4F7DF3] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#3D6CE5]"
            >
              继续学单词
              <ArrowUpRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/sentences')}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              学句子
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        <p className="pb-2 text-center text-[11px] text-slate-400">
          当前页面使用测试数据，仅用于确认布局与交互；后续将逐项接入真实学习记录和统计接口。
        </p>
      </div>
    </div>
  );
};
