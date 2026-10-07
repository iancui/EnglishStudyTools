import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { ArrowLeft, CheckCircle2, FileSpreadsheet, Loader2, UploadCloud } from 'lucide-react';
import { api } from '../api/client.ts';

type RawSheet = { name: string; rows: any[][] };

const normalize = (value: any) => String(value ?? '').trim().replace(/\\s+/g, '').toLowerCase();

const findHeaderIndex = (headers: string[], aliases: string[]) => {
  const normalized = headers.map(normalize);
  return normalized.findIndex(h => aliases.some(a => h === normalize(a)));
};

const parseSheet = (name: string, rows: any[][], kind: 'word' | 'sentence') => {
  if (!rows.length) return { name, headers: [], data: [], mapping: {} as Record<string, number> };
  const headers = (rows[0] || []).map(v => String(v ?? '').trim());
  const mapping: Record<string, number> = {};

  if (kind === 'word') {
    mapping.text = findHeaderIndex(headers, ['单词', '词汇', 'word', '英文单词']);
    mapping.phonetic = findHeaderIndex(headers, ['音标', '音标/发音', 'phonetic', '英式音标']);
    mapping.pos = findHeaderIndex(headers, ['词性', 'pos', 'part of speech']);
    mapping.meaningCn = findHeaderIndex(headers, ['中文释义', '中文解释', '释义', 'meaning', '中文']);
  } else {
    mapping.content = findHeaderIndex(headers, ['英文句子', '句子', '英语句子', 'sentence', 'english sentence']);
    mapping.translation = findHeaderIndex(headers, ['中文翻译', '中文译文', '翻译', 'translation', '中文']);
  }

  return {
    name,
    headers,
    data: rows.slice(1).filter(row => row.some(v => String(v ?? '').trim())),
    mapping
  };
};

const toWordRows = (sheet: ReturnType<typeof parseSheet>) => {
  const idx = sheet.mapping;
  return sheet.data.map(row => ({
    text: String(row[idx.text] ?? '').trim(),
    phonetic: String(row[idx.phonetic] ?? '').trim(),
    pos: String(row[idx.pos] ?? '').trim(),
    meaningCn: String(row[idx.meaningCn] ?? '').trim()
  })).filter(row => row.text);
};

const toSentenceRows = (sheet: ReturnType<typeof parseSheet>) => {
  const idx = sheet.mapping;
  return sheet.data.map(row => ({
    content: String(row[idx.content] ?? '').trim(),
    translation: String(row[idx.translation] ?? '').trim()
  })).filter(row => row.content);
};

export const AdminExcelImportView: React.FC<{ navigate: (route: string) => void; user: any }> = ({ navigate, user }) => {
  const [sheets, setSheets] = useState<RawSheet[]>([]);
  const [fileName, setFileName] = useState('');
  const [wordSheetName, setWordSheetName] = useState('');
  const [sentenceSheetName, setSentenceSheetName] = useState('');
  const [wordDictionaryId, setWordDictionaryId] = useState('');
  const [sentenceDictionaryId, setSentenceDictionaryId] = useState('');
  const [dictionaries, setDictionaries] = useState<any[]>([]);
  const [wordMapping, setWordMapping] = useState<Record<string, number>>({});
  const [sentenceMapping, setSentenceMapping] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'ADMIN';

  React.useEffect(() => {
    if (!isAdmin) return;
    api.getAdminDictionaries().then(list => {
      setDictionaries(list.filter(d => d.status === 'ACTIVE'));
    }).catch(e => setError(e.message || '加载辞书失败'));
  }, [isAdmin]);

  const selectedWordSheet = sheets.find(s => s.name === wordSheetName);
  const selectedSentenceSheet = sheets.find(s => s.name === sentenceSheetName);

  const wordHeaders = selectedWordSheet ? selectedWordSheet.rows[0].map(v => String(v ?? '').trim()) : [];
  const sentenceHeaders = selectedSentenceSheet ? selectedSentenceSheet.rows[0].map(v => String(v ?? '').trim()) : [];

  const mappingOptions = (headers: string[]) => headers.map((h, i) => ({ label: h || `列 ${i + 1}`, value: i }));

  const applyAutoMapping = (headers: string[], kind: 'word' | 'sentence') => {
    const mapping: Record<string, number> = {};
    const fields = kind === 'word'
      ? {
          text: ['单词', '词汇', 'word', '英文单词'],
          phonetic: ['音标', '音标/发音', 'phonetic', '英式音标'],
          pos: ['词性', 'pos', 'part of speech'],
          meaningCn: ['中文释义', '中文解释', '释义', 'meaning', '中文']
        }
      : {
          content: ['英文句子', '句子', '英语句子', 'sentence', 'english sentence'],
          translation: ['中文翻译', '中文译文', '翻译', 'translation', '中文']
        };
    Object.entries(fields).forEach(([field, aliases]) => {
      mapping[field] = findHeaderIndex(headers, aliases);
    });
    return mapping;
  };

  const handleFile = async (file: File) => {
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const parsed: RawSheet[] = workbook.SheetNames.map(name => ({
        name,
        rows: XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: '' }) as any[][]
      }));
      setSheets(parsed);
      setFileName(file.name);

      const wordCandidate = parsed.find(s => {
        const headers = (s.rows[0] || []).map(v => String(v ?? ''));
        return findHeaderIndex(headers, ['单词', '词汇', 'word', '英文单词']) >= 0;
      });
      const sentenceCandidate = parsed.find(s => {
        const headers = (s.rows[0] || []).map(v => String(v ?? ''));
        return findHeaderIndex(headers, ['英文句子', '句子', '英语句子', 'sentence']) >= 0;
      });

      const w = wordCandidate || parsed[0];
      const s = sentenceCandidate || parsed.find(x => x.name !== w?.name) || parsed[1] || parsed[0];
      setWordSheetName(w?.name || '');
      setSentenceSheetName(s?.name || '');
      if (w) setWordMapping(applyAutoMapping((w.rows[0] || []).map(v => String(v ?? '')), 'word'));
      if (s) setSentenceMapping(applyAutoMapping((s.rows[0] || []).map(v => String(v ?? '')), 'sentence'));
    } catch (e: any) {
      setError(e?.message || 'Excel 文件解析失败');
    } finally {
      setLoading(false);
    }
  };

  const currentWordMapping = Object.keys(wordMapping).length ? wordMapping : (selectedWordSheet ? applyAutoMapping(wordHeaders, 'word') : {});
  const currentSentenceMapping = Object.keys(sentenceMapping).length ? sentenceMapping : (selectedSentenceSheet ? applyAutoMapping(sentenceHeaders, 'sentence') : {});

  const getRows = (sheet: RawSheet | undefined, mapping: Record<string, number>) => {
    if (!sheet) return [];
    return sheet.rows.slice(1).map(row => ({
      row,
      values: Object.fromEntries(Object.entries(mapping).map(([k, i]) => [k, i >= 0 ? String(row[i] ?? '').trim() : '']))
    })).filter(x => Object.values(x.values).some(Boolean));
  };

  const wordRows = useMemo(() => getRows(selectedWordSheet, currentWordMapping), [selectedWordSheet, currentWordMapping]);
  const sentenceRows = useMemo(() => getRows(selectedSentenceSheet, currentSentenceMapping), [selectedSentenceSheet, currentSentenceMapping]);

  const canImport = Boolean(
    wordDictionaryId &&
    sentenceDictionaryId &&
    wordRows.length &&
    sentenceRows.length &&
    currentWordMapping.text >= 0 &&
    currentWordMapping.meaningCn >= 0 &&
    currentSentenceMapping.content >= 0 &&
    currentSentenceMapping.translation >= 0
  );

  const doImport = async () => {
    if (!canImport) return;
    setImporting(true);
    setError('');
    try {
      const words = wordRows.map(x => ({
        text: x.values.text,
        phonetic: x.values.phonetic,
        pos: x.values.pos,
        meaningCn: x.values.meaningCn
      }));
      const sentences = sentenceRows.map(x => ({
        content: x.values.content,
        translation: x.values.translation
      }));
      const res = await api.importExcelWorkbook({
        wordDictionaryId,
        sentenceDictionaryId,
        words,
        sentences
      });
      setResult(res);
    } catch (e: any) {
      setError(e?.message || '导入失败');
    } finally {
      setImporting(false);
    }
  };

  if (!isAdmin) {
    return <div className="max-w-md mx-auto py-20 text-center text-stone-500">只有管理员可以导入 Excel。</div>;
  }

  const activeDicts = dictionaries;
  const selectClass = "w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm outline-none focus:border-stone-900";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">管理员 · Excel 数据导入</div>
          <h1 className="text-3xl font-bold text-stone-900 mt-1">批量导入课程数据</h1>
          <p className="text-sm text-stone-500 mt-1">支持“单词表 + 句子表”两个 Sheet，并可自动识别列名。</p>
        </div>
        <button onClick={() => navigate('/admin')} className="px-4 py-2 rounded-xl border border-stone-200 text-sm flex items-center gap-2 hover:bg-stone-50">
          <ArrowLeft className="w-4 h-4" /> 返回辞书管理
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-3xl p-5 sm:p-7 space-y-6 shadow-sm">
        <label className="border-2 border-dashed border-stone-200 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/30 transition-colors">
          <UploadCloud className="w-9 h-9 text-emerald-600 mb-2" />
          <span className="font-semibold text-stone-800">{fileName || '选择 Excel 文件'}</span>
          <span className="text-xs text-stone-400 mt-1">支持 .xlsx / .xls</span>
          <input type="file" accept=".xlsx,.xls" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </label>

        {loading && <div className="text-center text-sm text-stone-500 flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />正在解析 Excel...</div>}

        {sheets.length > 0 && (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-stone-700">单词 Sheet</label>
                <select className={selectClass} value={wordSheetName} onChange={e => { setWordSheetName(e.target.value); const s=sheets.find(x=>x.name===e.target.value); setWordMapping(s ? applyAutoMapping((s.rows[0]||[]).map(v=>String(v??'')), 'word') : {}); }}>
                  {sheets.map(s => <option key={s.name} value={s.name}>{s.name}（{Math.max(0,s.rows.length-1)} 行）</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-stone-700">句子 Sheet</label>
                <select className={selectClass} value={sentenceSheetName} onChange={e => { setSentenceSheetName(e.target.value); const s=sheets.find(x=>x.name===e.target.value); setSentenceMapping(s ? applyAutoMapping((s.rows[0]||[]).map(v=>String(v??'')), 'sentence') : {}); }}>
                  {sheets.map(s => <option key={s.name} value={s.name}>{s.name}（{Math.max(0,s.rows.length-1)} 行）</option>)}
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-stone-50 rounded-2xl p-4 space-y-3">
                <div className="font-bold text-sm text-stone-800">目标单词辞书</div>
                <select className={selectClass} value={wordDictionaryId} onChange={e => setWordDictionaryId(e.target.value)}>
                  <option value="">请选择</option>
                  {activeDicts.map(d => <option key={d.id} value={d.id}>{d.name}（{d.wordCount || 0} 词）</option>)}
                </select>
              </div>
              <div className="bg-stone-50 rounded-2xl p-4 space-y-3">
                <div className="font-bold text-sm text-stone-800">目标句子辞书</div>
                <select className={selectClass} value={sentenceDictionaryId} onChange={e => setSentenceDictionaryId(e.target.value)}>
                  <option value="">请选择</option>
                  {activeDicts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-stone-200 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 bg-stone-50 font-bold text-sm">单词数据预览</div>
                <div className="p-4 text-xs space-y-1 max-h-48 overflow-auto">
                  <div>识别：<b>{wordRows.length}</b> 条</div>
                  {wordRows.slice(0, 5).map((x,i)=><div key={i} className="text-stone-600">{x.values.text} · {x.values.pos} · {x.values.meaningCn}</div>)}
                </div>
              </div>
              <div className="border border-stone-200 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 bg-stone-50 font-bold text-sm">句子数据预览</div>
                <div className="p-4 text-xs space-y-1 max-h-48 overflow-auto">
                  <div>识别：<b>{sentenceRows.length}</b> 条</div>
                  {sentenceRows.slice(0, 5).map((x,i)=><div key={i} className="text-stone-600">{x.values.content} → {x.values.translation}</div>)}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={doImport} disabled={!canImport || importing} className="px-6 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white rounded-xl font-semibold text-sm flex items-center gap-2">
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                {importing ? '正在导入数据库...' : '确认导入'}
              </button>
            </div>
          </>
        )}

        {error && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">{error}</div>}
        {result && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl">
            <div className="font-bold flex items-center gap-2"><CheckCircle2 className="w-5 h-5" />导入完成</div>
            <div className="text-sm mt-2">单词：{result.words.imported} 条，新增单词 {result.words.newWords} 个；句子：{result.sentences.imported} 条，新增句子 {result.sentences.newSentences} 个。</div>
          </div>
        )}
      </div>
    </div>
  );
};
