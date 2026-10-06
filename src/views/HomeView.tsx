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
  Clock
} from 'lucide-react';
import { api } from '../api/client.ts';
import { StatisticsData, StudySessionItem, SentencePracticeSession } from '../types/index.ts';

interface HomeViewProps {
  navigate: (route: string) => void;
  onOpenStudySetup: (dictId?: string) => void;
  onOpenSentencePracticeSetup?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  navigate,
  onOpenStudySetup,
  onOpenSentencePracticeSetup
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      {/* Platform Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>英语单词 + 句子渐进式学习平台</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 font-serif">
          学习中心
        </h1>
        <p className="text-sm text-stone-500">
          基于认知闭环设计：单词“学 + 背写”一体化沉淀，进阶渐进长句掌握真实语境表达。
        </p>
      </div>

      {/* Two Core Learning Portals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* ============================================================ */}
        {/* 入口 1：背单词 (学习 + 背写) */}
        {/* ============================================================ */}
        <div className="bg-white border-2 border-amber-200/80 rounded-3xl p-6 sm:p-8 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="space-y-5 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl" role="img" aria-label="book">📖</span>
                <div>
                  <h2 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
                    背单词
                  </h2>
                  <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mt-0.5">
                    学习 + 背写
                  </p>
                </div>
              </div>

              {activeSession ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                  <span>进行中</span>
                </span>
              ) : (
                <span className="text-xs text-stone-400 font-medium">
                  认知闭环
                </span>
              )}
            </div>

            <p className="text-sm text-stone-600 leading-relaxed">
              每个单词必经“音形义认知拆分”与“汉译英默写检测”两个阶段，全方位完成记忆与拼写攻克。
            </p>

            {/* If user has an ongoing IN_PROGRESS session */}
            {activeSession ? (
              <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-4.5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-semibold text-stone-800">
                    {activeSession.dictionary?.name || '当前学习任务'}
                  </div>
                  <div className="font-mono font-bold text-amber-900">
                    继续学习 {activeSession.completedCount} / {activeSession.totalCount}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full bg-amber-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (activeSession.completedCount / activeSession.totalCount) * 100
                        )
                      )}%`
                    }}
                  />
                </div>

                <div className="text-[11px] text-amber-700/90 flex items-center justify-between">
                  <span>当前进度已自动暂存</span>
                  <span>
                    完成度{' '}
                    {Math.round(
                      (activeSession.completedCount / activeSession.totalCount) * 100
                    )}
                    %
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-stone-50 rounded-2xl p-4 text-xs text-stone-500 space-y-1">
                <div className="font-medium text-stone-700">自由定制背单词参数</div>
                <div>支持自选词库、设定单词量、顺序/乱序抽词并自动剔除已掌握熟词。</div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-6 relative z-10 border-t border-stone-100 mt-6">
            {activeSession ? (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate(`/study/${activeSession.id}`)}
                  className="flex-1 py-3.5 px-6 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm"
                >
                  <span>继续学习</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onOpenStudySetup(activeSession.dictionaryId)}
                  className="py-3.5 px-4 bg-white hover:bg-stone-50 text-stone-600 hover:text-stone-900 font-medium rounded-xl border border-stone-200 transition-colors text-xs"
                  title="重新配置并开启新的背诵任务"
                >
                  重新设置
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onOpenStudySetup()}
                className="w-full py-3.5 px-6 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm"
              >
                <span>开始学习</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* ============================================================ */}
        {/* 入口 2：渐进句子 (从短语到完整句子) */}
        {/* ============================================================ */}
        <div className="bg-white border-2 border-emerald-200/80 rounded-3xl p-6 sm:p-8 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="space-y-5 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl" role="img" aria-label="speech">💬</span>
                <div>
                  <h2 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
                    渐进句子
                  </h2>
                  <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mt-0.5">
                    从短语到完整句子
                  </p>
                </div>
              </div>

              <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
                语块进阶
              </span>
            </div>

            <p className="text-sm text-stone-600 leading-relaxed">
              核心学习理念：单词 $\to$ 短语逐步拼写 $\to$ 完整长句精准重建。彻底告别被动阅读，实现主动输出。
            </p>

            {/* If user has an ongoing IN_PROGRESS sentence practice session */}
            {activeSentenceSession ? (
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4.5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-semibold text-stone-800">
                    难度：{activeSentenceSession.difficulty}
                  </div>
                  <div className="font-mono font-bold text-emerald-900">
                    继续练习 {activeSentenceSession.currentSentenceIndex} / {activeSentenceSession.totalCount} 句
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full bg-emerald-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (activeSentenceSession.currentSentenceIndex / activeSentenceSession.totalCount) * 100
                        )
                      )}%`
                    }}
                  />
                </div>

                <div className="text-[11px] text-emerald-800 flex items-center justify-between">
                  <span>句子顺序与阶段已固定</span>
                  <span>
                    完成度{' '}
                    {Math.round(
                      (activeSentenceSession.currentSentenceIndex / activeSentenceSession.totalCount) * 100
                    )}
                    %
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 space-y-2 text-xs">
                <div className="font-semibold text-emerald-950 flex items-center gap-1.5">
                  <GitCommit className="w-3.5 h-3.5 text-emerald-600" />
                  <span>递进式阶梯路径</span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-center font-mono text-[11px] pt-1">
                  <div className="bg-white/80 py-1 rounded border border-emerald-200 text-stone-700">1. 单词</div>
                  <div className="bg-white/80 py-1 rounded border border-emerald-200 text-stone-700">2. 短语</div>
                  <div className="bg-white/80 py-1 rounded border border-emerald-200 text-stone-700">3. 句式</div>
                  <div className="bg-white/80 py-1 rounded border border-emerald-200 text-stone-700">4. 长句</div>
                </div>
              </div>
            )}
          </div>

          {/* Action button */}
          <div className="pt-6 relative z-10 border-t border-stone-100 mt-6">
            {activeSentenceSession ? (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate(`/sentence-practice/${activeSentenceSession.id}`)}
                  className="flex-1 py-3.5 px-6 bg-emerald-900 hover:bg-emerald-800 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm"
                >
                  <span>继续练习</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onOpenSentencePracticeSetup?.()}
                  className="py-3.5 px-4 bg-white hover:bg-stone-50 text-stone-600 hover:text-stone-900 font-medium rounded-xl border border-stone-200 transition-colors text-xs"
                  title="重新配置并开启新的句子练习任务"
                >
                  重新设置
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onOpenSentencePracticeSetup?.()}
                className="w-full py-3.5 px-6 bg-emerald-900 hover:bg-emerald-800 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm"
              >
                <span>开始练习</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        </div>
      </div>

      {/* Auxiliary Learning Shortcuts (错词本、学习记录、设置) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => navigate('/words/wrong')}
          className="p-5 rounded-2xl bg-white border border-stone-200 hover:border-stone-400 hover:bg-stone-50 transition-all text-left flex items-center justify-between group shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-stone-900 text-sm">错词本复习</div>
              <div className="text-xs text-stone-500 mt-0.5">自动收录易错难词优先巩固</div>
            </div>
          </div>
          <span className="text-xs text-stone-400 group-hover:translate-x-1 transition-transform">→</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/statistics')}
          className="p-5 rounded-2xl bg-white border border-stone-200 hover:border-stone-400 hover:bg-stone-50 transition-all text-left flex items-center justify-between group shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-stone-900 text-sm">学习记录</div>
              <div className="text-xs text-stone-500 mt-0.5">每日背诵量与艾宾浩斯曲线</div>
            </div>
          </div>
          <span className="text-xs text-stone-400 group-hover:translate-x-1 transition-transform">→</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="p-5 rounded-2xl bg-white border border-stone-200 hover:border-stone-400 hover:bg-stone-50 transition-all text-left flex items-center justify-between group shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-stone-900 text-sm">设置中心</div>
              <div className="text-xs text-stone-500 mt-0.5">默认辞书、音标与自然拼读配置</div>
            </div>
          </div>
          <span className="text-xs text-stone-400 group-hover:translate-x-1 transition-transform">→</span>
        </button>
      </div>

      {/* Today Statistics Board */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-stone-900">今日学习数据</h3>
            <p className="text-xs text-stone-500 mt-0.5">记录每一次努力积累</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/statistics')}
            className="text-xs font-semibold text-stone-700 hover:text-stone-900 flex items-center gap-1"
          >
            <span>完整报告</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-stone-50 rounded-2xl p-4 text-center">
            <div className="text-xs text-stone-500">今日学习单词</div>
            <div className="text-2xl font-bold font-mono text-stone-900 mt-1">
              {stats?.todayLearnedWords ?? 20}
            </div>
          </div>

          <div className="bg-stone-50 rounded-2xl p-4 text-center">
            <div className="text-xs text-stone-500">拼写正确</div>
            <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
              {stats?.todayCorrect ?? 18}
            </div>
          </div>

          <div className="bg-stone-50 rounded-2xl p-4 text-center">
            <div className="text-xs text-stone-500">今日掌握长句</div>
            <div className="text-2xl font-bold font-mono text-stone-900 mt-1">
              {stats?.todaySentences ?? 5}
            </div>
          </div>

          <div className="bg-stone-50 rounded-2xl p-4 text-center">
            <div className="text-xs text-stone-500">累计掌握词汇</div>
            <div className="text-2xl font-bold font-mono text-amber-600 mt-1">
              {stats?.masteredWords ?? 120}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
