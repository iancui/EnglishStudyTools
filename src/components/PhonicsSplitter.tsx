import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { WordPhonics } from '../types/index.ts';
import { SpeechPlayer } from '../utils/speech.ts';

interface PhonicsSplitterProps {
  wordText: string;
  phonics: WordPhonics[];
  audioType?: 'UK' | 'US';
}

export const PhonicsSplitter: React.FC<PhonicsSplitterProps> = ({
  wordText,
  phonics,
  audioType = 'UK'
}) => {
  const [activeSequence, setActiveSequence] = useState<number | null>(null);

  const handlePlaySyllable = async (p: WordPhonics) => {
    setActiveSequence(p.sequence);
    const lang = audioType === 'US' ? 'en-US' : 'en-GB';
    await SpeechPlayer.speakSyllable(p.text, lang);
    setTimeout(() => setActiveSequence(null), 300);
  };

  if (!phonics || phonics.length === 0) {
    return (
      <div className="text-stone-400 text-sm py-4">
        暂无自然拼读拆分数据
      </div>
    );
  }

  return (
    <div className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-6 transition-all">
      <div className="text-xs uppercase tracking-wider text-stone-500 font-semibold mb-3">
        自然拼读音节拆分（点击各音节单独发音）
      </div>

      {/* Syllable and phonetic horizontal composite representation */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
        {phonics.map((p, idx) => (
          <React.Fragment key={p.id}>
            <button
              onClick={() => handlePlaySyllable(p)}
              className={`group flex flex-col items-center px-4 py-3 rounded-xl border transition-all text-center ${
                activeSequence === p.sequence
                  ? 'bg-amber-100 border-amber-400 scale-105 shadow-sm'
                  : 'bg-white border-stone-200 hover:border-stone-400 hover:bg-stone-50'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold text-stone-900 group-hover:text-amber-800 transition-colors">
                  {p.text}
                </span>
                <Volume2 className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-600 transition-colors" />
              </div>
              <span className="text-sm font-mono text-stone-500 mt-1">
                {p.phonetic}
              </span>
            </button>
            {idx < phonics.length - 1 && (
              <span className="text-stone-300 font-bold text-xl select-none">·</span>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="text-center text-xs text-stone-500">
        💡 提示：自然拼读将单词拆分为可发音的音素/音节单元，有助于建立形音联结
      </div>
    </div>
  );
};
