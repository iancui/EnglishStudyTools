import React, { useEffect, useState } from 'react';
import { Check, Settings, Save, Sparkles, BookOpen, FolderKanban } from 'lucide-react';
import { api } from '../api/client.ts';
import { DictionaryConfig, DictionaryItem } from '../types/index.ts';

interface DictionarySettingsViewProps {
  navigate: (route: string) => void;
  onConfigUpdated: (cfg: DictionaryConfig) => void;
}

export const DictionarySettingsView: React.FC<DictionarySettingsViewProps> = ({
  navigate,
  onConfigUpdated
}) => {
  const [config, setConfig] = useState<DictionaryConfig>({
    id: '',
    userId: '',
    defaultDictionaryId: 'dict-primary-6',
    englishDict: 'Oxford',
    ecDict: 'Oxford',
    phoneticType: 'UK',
    audioType: 'UK',
    enablePhonics: true
  });
  const [dictionaries, setDictionaries] = useState<DictionaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cfgRes, dictsRes] = await Promise.all([
        api.getDictionaryConfig(),
        api.getDictionaries()
      ]);
      if (cfgRes) setConfig(cfgRes);
      if (dictsRes) setDictionaries(dictsRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const updated = await api.updateDictionaryConfig(config);
      setConfig(updated);
      onConfigUpdated(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-stone-500 text-sm">正在读取辞书配置...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
          学习偏好 · 辞书引擎
        </div>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight mt-1">
          辞书与语音配置
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          配置默认学习辞书、英美音标显示模式、朗读发音口音以及自然拼读音节拆分。
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
        {/* Section 1: Default Dictionary */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-stone-900 block">
              1. 默认首选学习辞书
            </label>
            <button
              type="button"
              onClick={() => navigate('/dictionaries')}
              className="text-xs text-amber-800 hover:underline flex items-center gap-1"
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>管理词库 →</span>
            </button>
          </div>
          <select
            value={config.defaultDictionaryId || 'dict-primary-6'}
            onChange={e => setConfig(prev => ({ ...prev, defaultDictionaryId: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm font-medium text-stone-900 focus:bg-white focus:border-stone-900 outline-none cursor-pointer"
          >
            {dictionaries.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.wordCount || 0} 词) {d.isSystem ? '· [系统辞书]' : '· [我的生词本]'}
              </option>
            ))}
          </select>
          <p className="text-xs text-stone-400">
            当开始快速背单词时，系统将默认以该辞书作为单词候选池。
          </p>
        </div>

        {/* Section 2: Phonetic Preference */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-stone-900 block">
            2. 音标显示偏好
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setConfig(prev => ({ ...prev, phoneticType: 'UK' }))}
              className={`p-4 rounded-xl border text-left transition-all ${
                config.phoneticType === 'UK'
                  ? 'bg-amber-50/70 border-amber-400 text-stone-900 ring-1 ring-amber-400'
                  : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              <div className="font-bold text-sm">英式音标 (UK / DJ)</div>
              <div className="text-xs text-stone-500 mt-1 font-mono">如 /ˈhɒlədeɪ/</div>
            </button>

            <button
              type="button"
              onClick={() => setConfig(prev => ({ ...prev, phoneticType: 'US' }))}
              className={`p-4 rounded-xl border text-left transition-all ${
                config.phoneticType === 'US'
                  ? 'bg-amber-50/70 border-amber-400 text-stone-900 ring-1 ring-amber-400'
                  : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              <div className="font-bold text-sm">美式音标 (US / KK)</div>
              <div className="text-xs text-stone-500 mt-1 font-mono">如 /ˈhɑːlədeɪ/</div>
            </button>
          </div>
        </div>

        {/* Section 3: Audio Pronunciation */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-stone-900 block">
            3. 语音发音口音偏好
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setConfig(prev => ({ ...prev, audioType: 'UK' }))}
              className={`p-4 rounded-xl border text-left transition-all ${
                config.audioType === 'UK'
                  ? 'bg-stone-900 border-stone-900 text-white shadow-sm'
                  : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              <div className="font-bold text-sm">英式标准音 (RP)</div>
              <div className={`text-xs mt-1 ${config.audioType === 'UK' ? 'text-stone-300' : 'text-stone-500'}`}>
                纯正英伦口音 · en-GB
              </div>
            </button>

            <button
              type="button"
              onClick={() => setConfig(prev => ({ ...prev, audioType: 'US' }))}
              className={`p-4 rounded-xl border text-left transition-all ${
                config.audioType === 'US'
                  ? 'bg-stone-900 border-stone-900 text-white shadow-sm'
                  : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              <div className="font-bold text-sm">美式标准音 (GA)</div>
              <div className={`text-xs mt-1 ${config.audioType === 'US' ? 'text-stone-300' : 'text-stone-500'}`}>
                清晰美音口音 · en-US
              </div>
            </button>
          </div>
        </div>

        {/* Section 4: Natural Phonics Toggle */}
        <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100">
          <div>
            <div className="font-bold text-sm text-stone-900">启用自然拼读音节拆分</div>
            <div className="text-xs text-stone-500 mt-0.5">
              在单词“学”阶段提供 hol · i · day 多音节点击独立发音
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.enablePhonics}
              onChange={e => setConfig(prev => ({ ...prev, enablePhonics: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
          </label>
        </div>

        {/* Submit action */}
        <div className="pt-2 flex items-center justify-between">
          <span className="text-xs text-stone-500">
            {savedSuccess ? '✅ 配置已成功保存并实时生效！' : '修改后点击下方保存'}
          </span>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2 text-sm"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? '正在保存...' : '保存配置'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
