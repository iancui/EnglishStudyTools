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
import { StatisticsData, StudySessionItem, SentencePracticeSession, SessionMode } from '../types/index.ts';

interface HomeViewProps {
  navigate: (route: string) => void;
  onOpenStudySetup: (dictId?: string, mode?: SessionMode) => void;
  onStartSentencePractice?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  navigate,
  onOpenStudySetup,
  onStartSentencePractice
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
      {/* Platform Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF2FE] text-[#4F7DF3] text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>英语单词 + 句子渐进式学习平台</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#29466F]">
          你好，开始今天的学习吧
        </h1>
        <p className="text-sm text-[#8BA0BD] max-w-xl leading-relaxed">
          基于认知闭环设计：单词“学 + 背写”一体化沉淀，进阶渐进长句掌握真实语境表达。
        </p>
      </div>

      {/* Two Core Learning Portals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* ============================================================ */}
        {/* 入口 1：背单词 (学习 + 背写) */}
        {/* ============================================================ */}
        <div className="bg-white border border-[#E7EEF8] hover:border-[#4F7DF3]/40 rounded-3xl p-7 sm:p-8 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#F7FAFF] border border-[#E7EEF8] flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                  📖
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#29466F] tracking-tight">
                    背单词
                  </h2>
                  <p className="text-xs font-semibold text-[#8BA0BD] mt-0.5">
                    认知学习 + 汉译英背写
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* 今日到期徽章 */}
                {reviewWords && reviewWords.length > 0 && (
                  <button
                    type="button"
                    onClick={handleStartTodayReview}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                    title="点击开始今日复习"
                  >
                    <Clock className="w-3 h-3" />
                    <span>今日到期 {reviewWords.length}</span>
                  </button>
                )}

                {activeSession ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EBF2FE] text-[#4F7DF3] border border-[#D5E3FC]">
                    <Flame className="w-3.5 h-3.5 fill-[#4F7DF3]" />
                    <span>{activeSession.mode === 'WRITE_ONLY' ? '听写中' : '进行中'}</span>
                  </span>
                ) : (
                  <span className="text-xs text-[#8BA0BD] font-medium bg-[#F7FAFF] px-2.5 py-1 rounded-lg">
                    核心词库
                  </span>
                )}
              </div>
            </div>

            <p className="text-sm text-[#8BA0BD] leading-relaxed">
              支持“音形认知 + 汉译英背写”全流程学习，或直接开启“纯发音释义 · 单词听写”默写冲刺。
            </p>

            {/* If user has an ongoing IN_PROGRESS session */}
            {activeSession ? (
              <div className="bg-[#F7FAFF] border border-[#E7EEF8] rounded-2xl p-4.5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-semibold text-[#29466F] truncate max-w-[180px]">
                    {activeSession.mode === 'WRITE_ONLY' ? '单词听写' : (activeSession.dictionary?.name || '当前学习任务')}
                  </div>
                  <div className="font-mono font-bold text-[#4F7DF3]">
                    {activeSession.mode === 'WRITE_ONLY' ? '继续听写' : '继续学习'} {activeSession.completedCount} / {activeSession.totalCount} 词
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full bg-[#E7EEF8] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#4F7DF3] rounded-full transition-all duration-300"
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

                <div className="text-[11px] text-[#8BA0BD] flex items-center justify-between">
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
              <div className="bg-[#F7FAFF] border border-[#E7EEF8]/60 rounded-2xl p-4 text-xs text-[#8BA0BD] space-y-1">
                <div className="font-semibold text-[#29466F]">自由定制背单词与听写参数</div>
                <div>支持普通学习与纯听写模式，自选词库、设定词量、乱序或优先复习。</div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-6 border-t border-[#E7EEF8] mt-6 space-y-3">
            {reviewWords !== null && reviewWords.length > 0 && (
              <button
                type="button"
                onClick={handleStartTodayReview}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold rounded-2xl transition-all shadow-xs flex items-center justify-center gap-2 text-sm select-none cursor-pointer"
              >
                <Clock className="w-4 h-4" />
                <span>📚 开始今日复习 · {reviewWords.length} 个到期词</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {activeSession ? (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate(`/study/${activeSession.id}`)}
                  className="flex-1 py-3.5 px-6 bg-[#4F7DF3] hover:bg-[#3D6CE5] text-white font-bold rounded-2xl transition-all shadow-xs flex items-center justify-center gap-2 text-sm select-none cursor-pointer"
                >
                  <span>继续{activeSession.mode === 'WRITE_ONLY' ? '单词听写' : '背单词'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onOpenStudySetup(activeSession.dictionaryId, activeSession.mode)}
                  className="py-3.5 px-4 bg-white hover:bg-[#F7FAFF] text-[#8BA0BD] hover:text-[#29466F] font-semibold rounded-2xl border border-[#E7EEF8] transition-colors text-xs select-none cursor-pointer"
                  title="重新配置并开启新的背诵任务"
                >
                  重新开始
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onOpenStudySetup(undefined, 'LEARN_AND_WRITE')}
                  className="flex-1 w-full py-3.5 px-5 bg-[#4F7DF3] hover:bg-[#3D6CE5] text-white font-bold rounded-2xl transition-all shadow-xs flex items-center justify-center gap-2 text-sm select-none cursor-pointer"
                >
                  <span>普通学习</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onOpenStudySetup(undefined, 'WRITE_ONLY')}
                  className="w-full sm:w-auto py-3.5 px-5 bg-[#EBF2FE] hover:bg-[#D5E3FC] text-[#4F7DF3] font-bold rounded-2xl transition-all text-sm flex items-center justify-center gap-1.5 select-none cursor-pointer"
                  title="听发音看释义直接默写"
                >
                  <Headphones className="w-4 h-4" />
                  <span>单词听写</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* 入口 2：学语句 (从短语到完整句子) */}
        {/* ============================================================ */}
        <div className="bg-white border border-[#E7EEF8] hover:border-[#4F7DF3]/40 rounded-3xl p-7 sm:p-8 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#F7FAFF] border border-[#E7EEF8] flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                  💬
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#29466F] tracking-tight">
                    学语句
                  </h2>
                  <p className="text-xs font-semibold text-[#8BA0BD] mt-0.5">
                    从短语逐步输入到完整句子
                  </p>
                </div>
              </div>

              {activeSentenceSession ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EBF2FE] text-[#4F7DF3] border border-[#D5E3FC]">
                  <Flame className="w-3.5 h-3.5 fill-[#4F7DF3]" />
                  <span>进行中</span>
                </span>
              ) : (
                <span className="text-xs text-[#8BA0BD] font-medium bg-[#F7FAFF] px-2.5 py-1 rounded-lg">
                  语块进阶
                </span>
              )}
            </div>

            <p className="text-sm text-[#8BA0BD] leading-relaxed">
              核心学习理念：单词 $\to$ 短语逐步拼写 $\to$ 完整长句精准重建。彻底告别被动阅读，实现主动输出。
            </p>

            {/* If user has an ongoing IN_PROGRESS sentence practice session */}
            {activeSentenceSession ? (
              <div className="bg-[#F7FAFF] border border-[#E7EEF8] rounded-2xl p-4.5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-semibold text-[#29466F]">
                    {activeSentenceSession.dictionaryId ? `词库：${activeSentenceSession.dictionaryId}` : '当前词库'}
                  </div>
                  <div className="font-mono font-bold text-[#4F7DF3]">
                    继续练习 {activeSentenceSession.currentSentenceIndex} / {activeSentenceSession.totalCount} 句
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full bg-[#E7EEF8] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#4F7DF3] rounded-full transition-all duration-300"
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

                <div className="text-[11px] text-[#8BA0BD] flex items-center justify-between">
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
              <div className="bg-[#F7FAFF] border border-[#E7EEF8]/60 rounded-2xl p-4 space-y-2 text-xs">
                <div className="font-semibold text-[#29466F] flex items-center gap-1.5">
                  <GitCommit className="w-3.5 h-3.5 text-[#4F7DF3]" />
                  <span>递进式阶梯路径</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-[11px] pt-1">
                  <div className="bg-white py-1 rounded-lg border border-[#E7EEF8] text-[#29466F]">1. 单词</div>
                  <div className="bg-white py-1 rounded-lg border border-[#E7EEF8] text-[#29466F]">2. 短语</div>
                  <div className="bg-white py-1 rounded-lg border border-[#E7EEF8] text-[#29466F]">3. 句式</div>
                  <div className="bg-white py-1 rounded-lg border border-[#E7EEF8] text-[#29466F]">4. 长句</div>
                </div>
              </div>
            )}
          </div>

          {/* Action button */}
          <div className="pt-6 border-t border-[#E7EEF8] mt-6">
            {activeSentenceSession ? (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate(`/sentence-practice/${activeSentenceSession.id}`)}
                  className="flex-1 py-3.5 px-6 bg-[#4F7DF3] hover:bg-[#3D6CE5] text-white font-bold rounded-2xl transition-all shadow-xs flex items-center justify-center gap-2 text-sm select-none"
                >
                  <span>继续练习</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onStartSentencePractice?.()}
                  className="py-3.5 px-4 bg-white hover:bg-[#F7FAFF] text-[#8BA0BD] hover:text-[#29466F] font-semibold rounded-2xl border border-[#E7EEF8] transition-colors text-xs select-none"
                  title="按当前设置重新开启新的句子练习任务"
                >
                  重新设置
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onStartSentencePractice?.()}
                className="w-full py-3.5 px-6 bg-[#4F7DF3] hover:bg-[#3D6CE5] text-white font-bold rounded-2xl transition-all shadow-xs flex items-center justify-center gap-2 text-sm select-none"
              >
                <span>开始练习</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Auxiliary Learning Shortcuts (今日复习、单词听写、错词本、学习记录、设置) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Entry: 今日复习 (辅助入口) */}
        {reviewWords !== null && (
          <button
            type="button"
            onClick={handleStartTodayReview}
            disabled={reviewWords.length === 0}
            className={`p-5 rounded-2xl bg-white border transition-all text-left flex items-center justify-between group shadow-2xs cursor-pointer ${
              reviewWords.length > 0
                ? 'border-amber-200 hover:border-amber-400 hover:bg-amber-50'
                : 'border-[#E7EEF8] opacity-60 cursor-default'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                reviewWords.length > 0 ? 'bg-amber-50 text-amber-600' : 'bg-[#F7FAFF] text-[#8BA0BD]'
              }`}>
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-[#29466F] text-sm">今日复习</div>
                <div className="text-xs text-[#8BA0BD] mt-0.5">
                  {reviewWords.length > 0
                    ? `有 ${reviewWords.length} 个单词需要复习`
                    : '✓ 今日暂无待复习'}
                </div>
              </div>
            </div>
            {reviewWords.length > 0 && (
              <span className="text-xs text-[#8BA0BD] group-hover:text-amber-600 group-hover:translate-x-1 transition-transform">→</span>
            )}
          </button>
        )}

        {/* Entry: 单词听写 (辅助训练入口) */}
        <button
          type="button"
          onClick={() => onOpenStudySetup(undefined, 'WRITE_ONLY')}
          className="p-5 rounded-2xl bg-white border border-[#E7EEF8] hover:border-[#4F7DF3]/40 hover:bg-[#F7FAFF] transition-all text-left flex items-center justify-between group shadow-2xs cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-[#29466F] text-sm">单词听写</div>
              <div className="text-xs text-[#8BA0BD] mt-0.5">听发音 + 看释义，默写英文</div>
            </div>
          </div>
          <span className="text-xs text-[#8BA0BD] group-hover:text-[#4F7DF3] group-hover:translate-x-1 transition-transform">→</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/words/wrong')}
          className="p-5 rounded-2xl bg-white border border-[#E7EEF8] hover:border-[#4F7DF3]/40 hover:bg-[#F7FAFF] transition-all text-left flex items-center justify-between group shadow-2xs cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-[#29466F] text-sm">错词本复习</div>
              <div className="text-xs text-[#8BA0BD] mt-0.5">自动收录易错难词优先巩固</div>
            </div>
          </div>
          <span className="text-xs text-[#8BA0BD] group-hover:text-[#4F7DF3] group-hover:translate-x-1 transition-transform">→</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/statistics')}
          className="p-5 rounded-2xl bg-white border border-[#E7EEF8] hover:border-[#4F7DF3]/40 hover:bg-[#F7FAFF] transition-all text-left flex items-center justify-between group shadow-2xs cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#EBF2FE] text-[#4F7DF3] flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-[#29466F] text-sm">学习记录</div>
              <div className="text-xs text-[#8BA0BD] mt-0.5">每日背诵量与统计数据</div>
            </div>
          </div>
          <span className="text-xs text-[#8BA0BD] group-hover:text-[#4F7DF3] group-hover:translate-x-1 transition-transform">→</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="p-5 rounded-2xl bg-white border border-[#E7EEF8] hover:border-[#4F7DF3]/40 hover:bg-[#F7FAFF] transition-all text-left flex items-center justify-between group shadow-2xs cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#F7FAFF] text-[#29466F] border border-[#E7EEF8] flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-[#29466F] text-sm">设置中心</div>
              <div className="text-xs text-[#8BA0BD] mt-0.5">默认辞书、音标与自然拼读配置</div>
            </div>
          </div>
          <span className="text-xs text-[#8BA0BD] group-hover:text-[#4F7DF3] group-hover:translate-x-1 transition-transform">→</span>
        </button>
      </div>

      {/* Today Statistics Board */}
      <div className="bg-white border border-[#E7EEF8] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#29466F]">今日学习数据</h3>
            <p className="text-xs text-[#8BA0BD] mt-0.5">记录每一次努力积累</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/statistics')}
            className="text-xs font-semibold text-[#4F7DF3] hover:text-[#3D6CE5] flex items-center gap-1"
          >
            <span>完整报告</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-[#F7FAFF] border border-[#E7EEF8]/60 rounded-2xl p-4 text-center">
            <div className="text-xs text-[#8BA0BD]">总词量</div>
            <div className="text-2xl font-bold font-mono text-[#29466F] mt-1">{stats?.totalWords ?? 0}</div>
          </div>
          <div className="bg-[#F7FAFF] border border-[#E7EEF8]/60 rounded-2xl p-4 text-center">
            <div className="text-xs text-[#8BA0BD]">已经学习词量</div>
            <div className="text-2xl font-bold font-mono text-[#4F7DF3] mt-1">{stats?.learnedWords ?? 0}</div>
          </div>
          <div className="bg-[#F7FAFF] border border-[#E7EEF8]/60 rounded-2xl p-4 text-center">
            <div className="text-xs text-[#8BA0BD]">已经掌握词量</div>
            <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">{stats?.masteredWords ?? 0}</div>
          </div>
          <div className="bg-[#F7FAFF] border border-[#E7EEF8]/60 rounded-2xl p-4 text-center">
            <div className="text-xs text-[#8BA0BD]">本次学习词量</div>
            <div className="text-2xl font-bold font-mono text-[#29466F] mt-1">{activeSession?.totalCount ?? 0}</div>
          </div>
          <div className="bg-[#F7FAFF] border border-[#E7EEF8]/60 rounded-2xl p-4 text-center">
            <div className="text-xs text-[#8BA0BD]">本次已学词量</div>
            <div className="text-2xl font-bold font-mono text-[#29466F] mt-1">{activeSession?.completedCount ?? 0}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
