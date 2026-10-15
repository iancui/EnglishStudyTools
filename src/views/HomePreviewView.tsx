import React, { useMemo, useState } from 'react';
import {
  ArrowRight, BookOpen, CheckCircle2, ChevronDown, ChevronRight,
  GraduationCap, Layers3, ListFilter, Search, Sparkles, Target, X
} from 'lucide-react';

type StudyKind = 'words' | 'sentences';
type UnitStatus = '未开始' | '学习中' | '已完成';
type Unit = { id: string; name: string; total: number; learned: number; mastered: number; status: UnitStatus };
type Stage = { id: string; name: string; units: Unit[] };

const demoStages: Record<StudyKind, Stage[]> = {
  words: [
    { id: 'w1', name: '第一阶段 · 入门', units: [
      { id: 'w1-1', name: 'Lesson 1&2 Excurse me!', total: 25, learned: 25, mastered: 25, status: '已完成' },
      { id: 'w1-2', name: 'Lesson 3&4 Sorry, sir.', total: 15, learned: 12, mastered: 4, status: '学习中' },
      { id: 'w1-3', name: 'Lesson 5&6 Nice to meet you.', total: 31, learned: 20, mastered: 5, status: '学习中' },
      { id: 'w1-4', name: 'Lesson 7&8 Are you a teacher?', total: 21, learned: 0, mastered: 0, status: '未开始' },
      { id: 'w1-5', name: 'Lesson 9&10 How are you today?', total: 22, learned: 0, mastered: 0, status: '未开始' },
      { id: 'w1-6', name: 'Lesson 11&12 Is this your shirt?', total: 13, learned: 0, mastered: 0, status: '未开始' },
      { id: 'w1-7', name: 'Lesson 13&14 A new dress', total: 18, learned: 0, mastered: 0, status: '未开始' },
      { id: 'w1-8', name: 'Lesson 15&16 Your passport, please', total: 20, learned: 0, mastered: 0, status: '未开始' }
    ]},
    { id: 'w2', name: '第二阶段 · 基础', units: [
      { id: 'w2-1', name: 'Lesson 17&18', total: 24, learned: 8, mastered: 2, status: '学习中' },
      { id: 'w2-2', name: 'Lesson 19&20', total: 20, learned: 0, mastered: 0, status: '未开始' },
      { id: 'w2-3', name: 'Lesson 21&22', total: 19, learned: 0, mastered: 0, status: '未开始' },
      { id: 'w2-4', name: 'Lesson 23&24', total: 22, learned: 0, mastered: 0, status: '未开始' }
    ]},
    { id: 'w3', name: '第三阶段 · 进阶', units: [
      { id: 'w3-1', name: 'Lesson 25&26', total: 25, learned: 0, mastered: 0, status: '未开始' },
      { id: 'w3-2', name: 'Lesson 27&28', total: 20, learned: 0, mastered: 0, status: '未开始' }
    ]}
  ],
  sentences: [
    { id: 's1', name: '第一阶段 · 入门', units: [
      { id: 's1-1', name: 'Lesson 1&2 Excuse me!', total: 25, learned: 25, mastered: 10, status: '已完成' },
      { id: 's1-2', name: 'Lesson 3&4 Sorry, sir.', total: 15, learned: 15, mastered: 0, status: '已完成' },
      { id: 's1-3', name: 'Lesson 5&6 Nice to meet you.', total: 16, learned: 6, mastered: 0, status: '学习中' },
      { id: 's1-4', name: 'Lesson 7&8 Are you a teacher?', total: 21, learned: 0, mastered: 0, status: '未开始' },
      { id: 's1-5', name: 'Lesson 9&10 How are you today?', total: 14, learned: 0, mastered: 0, status: '未开始' },
      { id: 's1-6', name: 'Lesson 11&12 Is this your shirt?', total: 15, learned: 0, mastered: 0, status: '未开始' }
    ]},
    { id: 's2', name: '第二阶段 · 基础', units: [
      { id: 's2-1', name: 'Lesson 13&14', total: 18, learned: 3, mastered: 0, status: '学习中' },
      { id: 's2-2', name: 'Lesson 15&16', total: 16, learned: 0, mastered: 0, status: '未开始' }
    ]},
    { id: 's3', name: '第三阶段 · 进阶', units: [
      { id: 's3-1', name: 'Lesson 17&18', total: 22, learned: 0, mastered: 0, status: '未开始' }
    ]}
  ]
};

const statusStyle: Record<UnitStatus, string> = {
  '未开始': 'bg-slate-100 text-slate-500',
  '学习中': 'bg-blue-50 text-blue-700',
  '已完成': 'bg-emerald-50 text-emerald-700',
};

export const HomePreviewView: React.FC<{ navigate: (route: string) => void }> = ({ navigate }) => {
  const [kind, setKind] = useState<StudyKind>('words');
  const [filter, setFilter] = useState<'全部' | '已完成' | '未完成'>('未完成');
  const [sortByProgress, setSortByProgress] = useState(false);
  const [expanded, setExpanded] = useState<string[]>(['w1']);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Unit | null>(null);
  const [notice, setNotice] = useState('');
  const stages = demoStages[kind];

  const visibleStages = useMemo(() => stages.map(stage => {
    let units = stage.units.filter(unit => {
      const matchesFilter = filter === '全部' || (filter === '已完成' ? unit.status === '已完成' : unit.status !== '已完成');
      const matchesQuery = unit.name.toLowerCase().includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
    if (sortByProgress) units = [...units].sort((a, b) => {
      const order: Record<UnitStatus, number> = { '学习中': 0, '未开始': 1, '已完成': 2 };
      return order[a.status] - order[b.status] || a.name.localeCompare(b.name, 'zh-CN', { numeric: true });
    });
    return { ...stage, units };
  }).filter(stage => stage.units.length > 0), [stages, filter, query, sortByProgress]);

  const switchKind = (next: StudyKind) => {
    setKind(next);
    setFilter('全部');
    setQuery('');
    setExpanded([next === 'words' ? 'w1' : 's1']);
    setSelected(null);
    setNotice('');
  };

  const startUnit = (unit: Unit) => {
    setSelected(unit);
    setNotice('');
  };

  // 先按课程目录顺序找正在学习的单元；没有进行中的单元时，选择顺序最靠前的未开始单元。
  const orderedUnits = stages.flatMap(stage => stage.units);
  const activeUnit = orderedUnits.find(unit => unit.status === '学习中');
  const nextNewUnit = orderedUnits.find(unit => unit.status === '未开始');
  const quickUnit = activeUnit || nextNewUnit;
  const continueLast = () => {
    if (quickUnit) startUnit(quickUnit);
    else setNotice(`所有${kind === 'words' ? '单词' : '句子'}单元都已完成。`);
  };

  const stagePercent = (stage: Stage) => {
    const total = stage.units.reduce((sum, unit) => sum + unit.total, 0);
    const learned = stage.units.reduce((sum, unit) => sum + unit.learned, 0);
    return total ? Math.round(learned / total * 100) : 0;
  };

  const wordStats = { total: 1021, learned: 60, mastered: 15 };
  const sentenceStats = { total: 1128, learned: 11, mastered: 0 };
  // 与正式首页 LearningCard 保持一致：已掌握、已学未掌握、未学习三段圆环。
  const Ring = ({ learned, total, mastered, color, label }: { learned: number; total: number; mastered: number; color: string; label: string }) => {
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
    return <div className="flex items-center gap-4"><div className="relative h-28 w-28 shrink-0"><svg viewBox="0 0 120 120" className="h-full w-full -rotate-90"><circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-[#EEF2F7]"/>{safeTotal > 0 && <><circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="butt" strokeDasharray={`${masteredLength} ${circumference - masteredLength}`} strokeDashoffset={masteredOffset} className="text-emerald-500 transition-all duration-700"/><circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="butt" strokeDasharray={`${learnedLength} ${circumference - learnedLength}`} strokeDashoffset={learnedOffset} className="text-[#4F7DF3] transition-all duration-700"/><circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="butt" strokeDasharray={`${unlearnedLength} ${circumference - unlearnedLength}`} strokeDashoffset={unlearnedOffset} className="text-[#DCE5F2] transition-all duration-700"/></>}</svg><div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-3xl font-extrabold text-[#29466F] leading-none">{safeTotal}</span><span className="mt-1 text-[11px] text-[#8BA0BD]">{label}</span></div></div><div className="min-w-0 flex-1 space-y-2.5 text-sm"><p className="font-semibold text-[#8BA0BD]">词库总体进度</p><div className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500"/>已掌握</span><b className="text-emerald-600">{safeMastered}</b></div><div className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#4F7DF3]"/>已学未掌握</span><b className="text-[#4F7DF3]">{learnedUnmastered}</b></div><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-[#8BA0BD]"><span className="h-2.5 w-2.5 rounded-full bg-[#DCE5F2]"/>未学习</span><b className="text-[#8BA0BD]">{unlearned}</b></div></div></div>;
  };

  return (
    <div className="min-h-screen bg-[#F5F8FE] text-[#29466F]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-9">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-bold text-blue-700">
              <Sparkles className="h-3.5 w-3.5" /> 临时首页预览
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">今天学一点</h1>
            <p className="mt-2 text-sm text-[#8094B2]">把继续学习放在前面，把课程目录整理得更清楚。</p>
          </div>
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 rounded-xl border border-[#DDE7F5] bg-white px-4 py-2.5 text-sm font-semibold text-[#526987] hover:bg-blue-50">
            <X className="h-4 w-4" /> 返回正式首页
          </button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <section className="rounded-3xl border border-[#E4ECF8] bg-white p-5 shadow-sm sm:p-6"><div className="mb-4 flex items-center gap-2 font-extrabold"><BookOpen className="h-5 w-5 text-blue-600"/>单词学习进度</div><Ring {...wordStats} color="#4F7DFF" label="已学进度" /></section>
          <section className="rounded-3xl border border-[#E4ECF8] bg-white p-5 shadow-sm sm:p-6"><div className="mb-4 flex items-center gap-2 font-extrabold"><GraduationCap className="h-5 w-5 text-violet-600"/>句子学习进度</div><Ring {...sentenceStats} color="#8B7CF6" label="已学进度" /></section>
        </div>

        <section className="mb-8 rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50 p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div><div className="flex items-center gap-2 text-lg font-extrabold"><Target className="h-5 w-5 text-blue-600" />快速继续</div><p className="mt-1 text-sm text-[#8094B2]">无论单元有多少，都不必滚动到页面底部找开始按钮。</p></div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">快捷入口</span>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <button onClick={continueLast} className="group rounded-2xl border border-[#E3EBF8] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><BookOpen className="h-5 w-5" /></div><div><div className="font-bold">{kind === 'words' ? (activeUnit ? '继续背单词' : '学个新单元') : (activeUnit ? '继续学句子' : '学个新单元')}</div><div className="mt-1 text-xs text-[#8094B2]">{quickUnit ? quickUnit.name : '所有单元已完成'}</div></div></div>
                <ArrowRight className="h-5 w-5 text-blue-500 transition group-hover:translate-x-1" />
              </div>
              {quickUnit && <><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-500" style={{ width: `${quickUnit.total ? Math.round(quickUnit.learned / quickUnit.total * 100) : 0}%` }} /></div><div className="mt-2 flex justify-between text-xs text-[#8094B2]"><span>{activeUnit ? '学习中' : '按课程顺序开始'}</span><span>{quickUnit.total ? Math.round(quickUnit.learned / quickUnit.total * 100) : 0}%</span></div></>}
            </button>
            <button onClick={() => { const sentenceUnits = demoStages.sentences.flatMap(stage => stage.units); const active = sentenceUnits.find(unit => unit.status === '学习中'); const next = active || sentenceUnits.find(unit => unit.status === '未开始'); if (next) { setKind('sentences'); startUnit(next); } else setNotice('所有句子单元都已完成。'); }} className="group rounded-2xl border border-[#E3EBF8] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><GraduationCap className="h-5 w-5" /></div><div><div className="font-bold">{demoStages.sentences.flatMap(stage => stage.units).some(unit => unit.status === '学习中') ? '继续学句子' : '学个新单元'}</div><div className="mt-1 text-xs text-[#8094B2]">{(() => { const units = demoStages.sentences.flatMap(stage => stage.units); return (units.find(unit => unit.status === '学习中') || units.find(unit => unit.status === '未开始'))?.name || '所有单元已完成'; })()}</div></div></div>
                <ArrowRight className="h-5 w-5 text-violet-500 transition group-hover:translate-x-1" />
              </div>
              {(() => { const units = demoStages.sentences.flatMap(stage => stage.units); const target = units.find(unit => unit.status === '学习中') || units.find(unit => unit.status === '未开始'); const percent = target?.total ? Math.round(target.learned / target.total * 100) : 0; return target ? <><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-500" style={{ width: `${percent}%` }} /></div><div className="mt-2 flex justify-between text-xs text-[#8094B2]"><span>{target.status === '学习中' ? '学习中' : '按课程顺序开始'}</span><span>{percent}%</span></div></> : null; })()}
            </button>
          </div>
          {notice && <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">{notice}</div>}
        </section>

        <section className="rounded-3xl border border-[#E4ECF8] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div><h2 className="text-xl font-extrabold">选择学习单元</h2><p className="mt-1 text-sm text-[#8094B2]">按阶段展开，随时切换单元；这里的示例数据仅用于预览布局。</p></div>
            <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1">
              <button onClick={() => switchKind('words')} className={`rounded-lg px-4 py-2 text-sm font-bold transition ${kind === 'words' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>单词单元</button>
              <button onClick={() => switchKind('sentences')} className={`rounded-lg px-4 py-2 text-sm font-bold transition ${kind === 'sentences' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500'}`}>句子单元</button>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <label className="flex items-center gap-2 rounded-xl border border-[#E2EAF5] px-3 py-2.5 focus-within:border-blue-300">
              <Search className="h-4 w-4 text-[#8094B2]" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索单元名称…" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" />
            </label>
            <div className="flex gap-2">
              <label className="flex min-w-0 items-center gap-2 rounded-xl border border-[#E2EAF5] px-3 py-2.5 text-sm">
                <ListFilter className="h-4 w-4 text-[#8094B2]" />
                <select value={filter} onChange={e => setFilter(e.target.value as any)} className="min-w-0 bg-transparent outline-none">
                  <option>全部</option><option>未完成</option><option>已完成</option>
                </select>
              </label>
              <button onClick={() => setSortByProgress(v => !v)} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold ${sortByProgress ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-[#E2EAF5] text-[#526987]'}`}><Layers3 className="h-4 w-4" /><span className="hidden sm:inline">{sortByProgress ? '按进度' : '课程顺序'}</span></button>
            </div>
          </div>

          <div className="space-y-3">
            {visibleStages.map(stage => {
              const isOpen = expanded.includes(stage.id);
              const complete = stage.units.filter(unit => unit.status === '已完成').length;
              const percent = stagePercent(stage);
              return <div key={stage.id} className="overflow-hidden rounded-2xl border border-[#E4ECF8]">
                <button onClick={() => setExpanded(prev => isOpen ? prev.filter(id => id !== stage.id) : [...prev, stage.id])} className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-blue-50/50 sm:p-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">{isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}</span>
                  <span className="min-w-0 flex-1"><span className="block font-bold">{stage.name}</span><span className="mt-1 block text-xs text-[#8094B2]">{stage.units.length} 个单元 · 已完成 {complete} 个</span></span>
                  <span className="text-sm font-extrabold text-blue-700">{percent}%</span>
                </button>
                <div className="mx-4 h-1 overflow-hidden rounded-full bg-slate-100 sm:mx-5"><div className="h-full rounded-full bg-blue-500" style={{ width: percent + '%' }} /></div>
                {isOpen && <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5">
                  {stage.units.map(unit => {
                    const percent = unit.total ? Math.round(unit.learned / unit.total * 100) : 0;
                    const isSelected = selected?.id === unit.id;
                    return <div key={unit.id} className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-sm ${isSelected ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-100' : 'border-[#E4ECF8] bg-white hover:border-blue-200'}`}>
                      <button type="button" onClick={() => startUnit(unit)} className="w-full text-left">
                        <div className="flex items-start justify-between gap-2"><span className="min-w-0 text-sm font-bold leading-5">{unit.name}</span><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${statusStyle[unit.status]}`}>{unit.status}</span></div>
                        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-[#8094B2]"><span>已学 {unit.learned}/{unit.total} · 已掌握 {unit.mastered}</span><span className="font-bold text-[#526987]">{percent}%</span></div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${unit.status === '已完成' ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: percent + '%' }} /></div>
                      </button>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => startUnit(unit)} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold ${unit.status === '学习中' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-[#526987]'}`}><span>{unit.status === '已完成' ? '复习单元' : unit.status === '未开始' ? '开始学习' : '继续学习'}</span><ArrowRight className="h-3.5 w-3.5"/></button>
                        {unit.status === '学习中' ? <button type="button" onClick={() => { startUnit(unit); setNotice('预览：这里会重新开始当前单元；正式接入时保留原有重新开始逻辑。'); }} className="rounded-xl border border-[#DCE5F2] bg-white px-3 py-2.5 text-xs font-bold text-[#29466F] hover:bg-slate-50">重新开始</button> : <div />}
                      </div>
                    </div>;
                  })}
                </div>}
              </div>;
            })}
            {visibleStages.length === 0 && <div className="rounded-2xl border border-dashed border-[#D8E3F2] py-12 text-center"><Search className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-3 font-semibold">没有找到符合条件的单元</p><button onClick={() => { setFilter('未完成'); setQuery(''); }} className="mt-2 text-sm font-bold text-blue-600">清除筛选</button></div>}
          </div>
        </section>

        {selected && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/30 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-blue-600">单元预览</p><h3 className="mt-1 text-xl font-extrabold">{selected.name}</h3></div><button onClick={() => setSelected(null)} className="rounded-full p-2 hover:bg-slate-100"><X className="h-4 w-4" /></button></div>
            <div className="rounded-2xl bg-slate-50 p-4"><div className="flex justify-between text-sm"><span className="text-slate-500">学习状态</span><span className="font-bold">{selected.status}</span></div><div className="mt-3 flex justify-between text-sm"><span className="text-slate-500">已学 / 总量</span><span className="font-bold">{selected.learned} / {selected.total}</span></div><div className="mt-3 flex justify-between text-sm"><span className="text-slate-500">已掌握</span><span className="font-bold">{selected.mastered}</span></div></div>
            <p className="mt-4 text-sm leading-6 text-[#8094B2]">这是临时首页的交互预览。此处使用示例数据，点击操作不会创建真实学习会话，也不会修改你的学习记录。</p>
            <div className="mt-5 grid grid-cols-2 gap-3"><button onClick={() => setSelected(null)} className="rounded-xl border border-[#DDE7F5] px-4 py-3 text-sm font-bold">返回目录</button><button onClick={() => { setSelected(null); setNotice('当前为临时首页，学习入口尚未连接真实会话。确认设计后再接入真实学习逻辑。'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white">预览开始流程</button></div>
          </div>
        </div>}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 px-4 py-3 text-xs text-blue-800"><span className="flex items-center gap-2"><Sparkles className="h-4 w-4" />这是独立临时页面，不会替换正式首页。</span><button onClick={() => navigate('/')} className="font-bold underline underline-offset-2">返回正式首页</button></div>
      </div>
    </div>
  );
};
