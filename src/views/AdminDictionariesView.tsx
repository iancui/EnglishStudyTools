import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Plus,
  Trash2,
  Edit2,
  FileUp,
  CheckCircle2,
  XCircle,
  X,
  Search,
  Sparkles
} from 'lucide-react';
import { api } from '../api/client.ts';
import { DictionaryItem } from '../types/index.ts';

interface AdminDictionariesViewProps {
  navigate: (route: string) => void;
  user: any;
}

export const AdminDictionariesView: React.FC<AdminDictionariesViewProps> = ({
  navigate,
  user
}) => {
  const [dictionaries, setDictionaries] = useState<DictionaryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Create/Edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDict, setEditingDict] = useState<any | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formIsPublic, setFormIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Import modal
  const [importDict, setImportDict] = useState<any | null>(null);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);

  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const isAdmin = user?.role === 'ADMIN' || roles.includes('SUPER_ADMIN') || permissions.includes('dictionary.read') || permissions.includes('word.import');

  useEffect(() => {
    if (isAdmin) {
      loadAdminDicts();
    }
  }, [isAdmin]);

  const loadAdminDicts = async () => {
    try {
      setLoading(true);
      const list = await api.getAdminDictionaries();
      setDictionaries(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingDict(null);
    setFormName('');
    setFormCode('');
    setFormDesc('');
    setFormIsPublic(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d: DictionaryItem) => {
    setEditingDict(d);
    setFormName(d.name);
    setFormCode(d.code);
    setFormDesc(d.description || '');
    setFormIsPublic(d.isPublic);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    try {
      setSubmitting(true);
      if (editingDict) {
        await api.updateAdminDictionary(editingDict.id, {
          name: formName.trim(),
          description: formDesc.trim(),
          isPublic: formIsPublic
        });
      } else {
        await api.createAdminDictionary({
          name: formName.trim(),
          code: formCode.trim() || `sys_${Date.now()}`,
          description: formDesc.trim(),
          isPublic: formIsPublic,
          isSystem: true
        });
      }
      setIsModalOpen(false);
      await loadAdminDicts();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`确定要删除辞书 "${name}" 吗？此操作不可逆！`)) return;
    try {
      await api.deleteAdminDictionary(id);
      await loadAdminDicts();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStatus = async (d: DictionaryItem) => {
    const newStatus = d.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.updateAdminDictionary(d.id, { status: newStatus });
      await loadAdminDicts();
    } catch (e) {
      console.error(e);
    }
  };

  const handleImportWords = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importDict || !importText.trim()) return;

    // Parse lines: format text, phonetic, pos, definition
    const lines = importText.split('\n').filter(l => l.trim().length > 0);
    const parsedWords = lines.map(line => {
      const parts = line.split(/[,，\t]/);
      return {
        text: parts[0]?.trim(),
        phoneticUk: parts[1]?.trim() || `/${parts[0]?.trim()}/`,
        pos: parts[2]?.trim() || 'n.',
        definitionCn: parts[3]?.trim() || '通用释义'
      };
    });

    try {
      setImporting(true);
      const res = await api.importAdminWords(importDict.id, parsedWords);
      setImportResult(res);
      setTimeout(() => {
        setImportDict(null);
        setImportResult(null);
        setImportText('');
        loadAdminDicts();
      }, 1500);
    } catch (err: any) {
      alert(err.message || '导入失败');
    } finally {
      setImporting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-stone-900">管理后台受限</h2>
        <p className="text-xs text-stone-500 leading-relaxed">
          当前登录账户 ({user?.username || '访客'}) 不是系统管理员 (Role: ADMIN)。
        </p>
        <div className="pt-2">
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-semibold"
          >
            返回学习首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
            <span>管理员专属控制台 · 系统辞书引擎</span>
          </div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight mt-1">
            系统辞书管理
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            创建官方课程辞书、维护词条结构、执行批量导入与上下架控制。
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => navigate('/admin/rbac')}
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>角色权限</span>
          </button>
          <button
            onClick={() => navigate('/admin/sentence-ai')}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Gemini 句子工具</span>
          </button>
          <button
            onClick={() => navigate('/admin/excel-import')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2"
          >
            <FileUp className="w-4 h-4" />
            <span>Excel 批量导入</span>
          </button>
          <button
            onClick={handleOpenCreate}
          className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>新增系统辞书</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-stone-400 text-sm">加载中...</div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-100 text-stone-500 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">辞书名称</th>
                  <th className="py-3.5 px-4">编码</th>
                  <th className="py-3.5 px-4">词数</th>
                  <th className="py-3.5 px-4">类型</th>
                  <th className="py-3.5 px-4">状态</th>
                  <th className="py-3.5 px-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {dictionaries.map(d => (
                  <tr key={d.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-stone-900">{d.name}</div>
                      <div className="text-[11px] text-stone-400 mt-0.5 truncate max-w-xs">
                        {d.description || '无描述'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-stone-500">{d.code}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-800">
                      {d.wordCount || 0}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          d.isSystem ? 'bg-amber-100 text-amber-900' : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {d.isSystem ? 'SYSTEM' : 'USER'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleStatus(d)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                          d.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {d.status === 'ACTIVE' ? '启用中' : '已停用'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setImportDict(d);
                          setImportText('');
                          setImportResult(null);
                        }}
                        className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700"
                        title="批量导入词汇"
                      >
                        <FileUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(d)}
                        className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700"
                        title="编辑"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(d.id, d.name)}
                        className="p-1.5 rounded-lg border border-rose-100 hover:bg-rose-50 text-rose-600"
                        title="删除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-stone-100">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-stone-400 hover:text-stone-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-stone-900 mb-1">
              {editingDict ? '编辑辞书' : '新增系统辞书'}
            </h3>
            <p className="text-xs text-stone-500 mb-5">配置系统词库基本元数据</p>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">辞书名称</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="例如: 考研核心词汇"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-stone-900 outline-none"
                />
              </div>

              {!editingDict && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">唯一标识编码 (Code)</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={e => setFormCode(e.target.value)}
                    placeholder="例如: postgrad_vocab"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-stone-900 outline-none font-mono"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">说明描述</label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-stone-900 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                <span className="text-xs font-semibold text-stone-800">全员公开可见</span>
                <input
                  type="checkbox"
                  checked={formIsPublic}
                  onChange={e => setFormIsPublic(e.target.checked)}
                  className="w-4 h-4 text-stone-900 rounded"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !formName.trim()}
                className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold transition-all mt-2"
              >
                {submitting ? '正在保存...' : '确认保存'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Batch Import Modal */}
      {importDict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-stone-100">
            <button
              onClick={() => setImportDict(null)}
              className="absolute top-5 right-5 p-1 rounded-full text-stone-400 hover:text-stone-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-stone-900 mb-1">
              批量导入单词到：{importDict.name}
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              格式：每行一条，以逗号或 Tab 分隔（例如: apple, /ˈæpl/, n., 苹果）
            </p>

            {importResult && (
              <div className="p-3 mb-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs">
                ✅ 成功导入 {importResult.importedCount} 个词汇 (新增入库: {importResult.newWordsCount})
              </div>
            )}

            <form onSubmit={handleImportWords} className="space-y-4">
              <textarea
                rows={7}
                required
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder="holiday, /ˈhɒlədeɪ/, n., 假期&#10;school, /skuːl/, n., 学校&#10;teacher, /ˈtiːtʃə/, n., 老师"
                className="w-full p-3 rounded-xl border border-stone-200 text-xs font-mono focus:border-stone-900 outline-none resize-none"
              />

              <button
                type="submit"
                disabled={importing || !importText.trim()}
                className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold transition-all"
              >
                {importing ? '正在处理导入...' : '执行批量导入'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
