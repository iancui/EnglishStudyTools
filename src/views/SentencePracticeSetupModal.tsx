import React, { useEffect, useState } from 'react';
import { X, Play, BookOpen, Layers } from 'lucide-react';
import { api } from '../api/client.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onStarted: (sessionId: string) => void;
  dictionaryId?: string;
}

export const SentencePracticeSetupModal: React.FC<Props> = ({ isOpen, onClose, onStarted, dictionaryId }) => {
  const [chapters, setChapters] = useState<any[]>([]);
  const [chapterId, setChapterId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setChapterId('');
    setError('');
    if (!dictionaryId) { setChapters([]); return; }
    api.getDictionaryChapters(dictionaryId).then(setChapters).catch(() => setChapters([]));
  }, [isOpen, dictionaryId]);

  if (!isOpen) return null;

  const start = async () => {
    if (!dictionaryId) { setError('请先在设置中选择句子辞书'); return; }
    try {
      setLoading(true);
      setError('');
      const session = await api.createSentencePracticeSession({ dictionaryId, chapterId: chapterId || undefined });
      onClose();
      onStarted(session.id);
    } catch (e: any) {
      setError(e?.message || '开始句子学习失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#E7EEF8]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-[#4F7DF3] text-xs font-bold"><Layers className="w-4 h-4" />句子学习</div>
            <h2 className="text-2xl font-bold text-[#29466F] mt-1">选择学习范围</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-stone-400 hover:bg-stone-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 rounded-2xl bg-[#F7FAFF] border border-[#E7EEF8] mb-5">
          <div className="flex items-center gap-2 text-sm font-bold text-[#29466F]"><BookOpen className="w-4 h-4 text-[#4F7DF3]" />当前句子辞书</div>
          <div className="mt-2 text-sm text-[#8BA0BD]">{dictionaryId || '未选择辞书'}</div>
        </div>
        <label className="text-xs font-bold text-[#29466F]">学习章节</label>
        <select value={chapterId} onChange={e => setChapterId(e.target.value)} className="mt-2 w-full px-4 py-3 rounded-xl border border-[#E7EEF8] bg-white text-sm text-[#29466F]">
          <option value="">整本辞书（按章节顺序）</option>
          {chapters.map(ch => <option key={ch.id} value={ch.id}>{ch.sequence}. {ch.name}</option>)}
        </select>
        {chapters.length === 0 && <p className="mt-2 text-xs text-[#8BA0BD]">该辞书暂时没有章节，将按辞书句子顺序学习。</p>}
        {error && <div className="mt-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">{error}</div>}
        <button onClick={start} disabled={loading} className="mt-6 w-full py-3.5 rounded-2xl bg-[#4F7DF3] text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
          <Play className="w-4 h-4 fill-white" />{loading ? '正在生成学习任务…' : '开始句子学习'}
        </button>
      </div>
    </div>
  );
};
