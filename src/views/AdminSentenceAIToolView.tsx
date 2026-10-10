import React, { useEffect, useState } from 'react';
import { Sparkles, Database, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../api/client.ts';
import { Dictionary } from '../types/index.ts';

interface Props {
  navigate: (route: string) => void;
  user?: any;
}

export function AdminSentenceAIToolView({ navigate, user }: Props) {
  const [sentencesText, setSentencesText] = useState('');
  const [dictionaries, setDictionaries] = useState<Dictionary[]>([]);
  const [dictionaryId, setDictionaryId] = useState('');
  const [chapters, setChapters] = useState<any[]>([]);
  const [chapterId, setChapterId] = useState('');
  const [model, setModel] = useState('gemini-3.8-flash');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.getDictionaries().then(list => {
      const system = (list || []).filter((d: Dictionary) => d.isSystem);
      setDictionaries(system);
      if (system[0]) setDictionaryId(system[0].id);
    }).catch(e => setMessage(e?.message || '读取辞书失败'));
  }, []);

  useEffect(() => {
    setChapterId('');
    if (!dictionaryId) { setChapters([]); return; }
    api.getDictionaryChapters(dictionaryId).then(setChapters).catch(() => setChapters([]));
  }, [dictionaryId]);

  if (user && user.role !== 'ADMIN') {
    return <div className="max-w-3xl mx-auto px-6 py-20 text-center">无权限访问</div>;
  }

  const analyze = async () => {
    const sentences = sentencesText.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    if (!sentences.length) return setMessage('请先输入英文句子，每行一个');
    setLoading(true);
    setMessage('');
    try {
      const data = await api.analyzeSentencesWithAI(sentences, model);
      setResults(data || []);
      setMessage(`AI 分析完成，共 ${data?.length || 0} 条`);
    } catch (e: any) {
      setMessage(e?.message || 'AI 分析失败');
    } finally {
      setLoading(false);
    }
  };

  const importAll = async () => {
    if (!dictionaryId || !results.length) return;
    if (!confirm(`确定把 ${results.length} 条句子写入 MySQL 5.7？`)) return;
    setImporting(true);
    setMessage('');
    try {
      const data = await api.importAISentences(dictionaryId, results, chapterId || undefined);
      setMessage(`入库完成：成功 ${data.imported} 条，跳过 ${data.skipped} 条`);
      setResults([]);
      setSentencesText('');
    } catch (e: any) {
      setMessage(e?.message || '入库失败');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2"><Sparkles size={22}/> Gemini 句子入库工具</h1>
          <p className="text-sm text-stone-500 mt-1">批量输入英文句子 → Gemini 分词/翻译/步骤/语法分析 → 预览 → MySQL 5.7</p>
        </div>
        <button onClick={() => navigate('/admin')} className="text-sm text-stone-500 hover:text-stone-900">返回后台</button>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <section className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
          <label className="block text-sm font-semibold text-stone-900">1. 输入英文句子</label>
          <textarea
            value={sentencesText}
            onChange={e => setSentencesText(e.target.value)}
            placeholder={'I go to school every day.\nShe likes reading books.'}
            className="w-full min-h-64 border border-stone-200 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-stone-200"
          />
          <div className="flex gap-3 items-center">
            <select value={model} onChange={e => setModel(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
              <option value="gemini-3.8-flash">Gemini 3.8 Flash</option>
              <option value="gemini-3.7-flash">Gemini 3.7 Flash</option>
            </select>
            <button disabled={loading} onClick={analyze} className="px-5 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>} {loading ? '分析中…' : 'Gemini 分析'}
            </button>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
          <label className="block text-sm font-semibold text-stone-900">2. 选择句子辞书</label>
          <select value={dictionaryId} onChange={e => setDictionaryId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
            {dictionaries.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <label className="block text-sm font-semibold text-stone-900">导入章节（可选）</label>
          <select value={chapterId} onChange={e => setChapterId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="">未分章（整本辞书）</option>
            {chapters.map(ch => <option key={ch.id} value={ch.id}>{ch.sequence}. {ch.name}</option>)}
          </select>
          <div className="rounded-xl bg-stone-50 p-4 text-sm text-stone-600">
            <Database size={16} className="inline mr-2"/> AI 分析阶段不会写数据库；只有点击“确认入库”后才写入。
          </div>
          <button disabled={importing || !results.length} onClick={importAll} className="w-full px-5 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40">
            {importing ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle2 size={16}/>} 确认入库 MySQL
          </button>
        </section>
      </div>

      {message && <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-700 flex gap-2"><AlertCircle size={17}/>{message}</div>}

      {results.length > 0 && (
        <section className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
          <div className="font-semibold text-stone-900">3. AI 结果预览（{results.length} 条）</div>
          <div className="space-y-4">
            {results.map((item, index) => (
              <article key={index} className="border border-stone-200 rounded-xl p-4">
                <div className="font-semibold text-stone-900">{item.content}</div>
                <div className="text-sm text-stone-600 mt-1">{item.translation}</div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {(item.words || []).map((w: any, i: number) => (
                    <span key={i} className="px-2 py-1 bg-stone-100 rounded-lg text-xs">{w.text} · {w.meaningCn}</span>
                  ))}
                </div>
                <div className="mt-3 text-xs text-stone-500">
                  {item.steps?.length || 0} 个学习步骤 · {item.analyses?.length || 0} 个语法分析 · {item.level}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
