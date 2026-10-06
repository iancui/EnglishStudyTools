import React, { useEffect, useState, useCallback } from 'react';
import { Volume2, ChevronLeft, ChevronRight, Snail, CheckCircle, Info, Sparkles, BookOpen } from 'lucide-react';
import { api } from '../api/client.ts';
import { SentenceItem, SentenceStep } from '../types/index.ts';
import { SpeechPlayer } from '../utils/speech.ts';

interface SentenceStudyViewProps {
  sentenceId: string;
  navigate: (route: string) => void;
  config: any;
}

export const SentenceStudyView: React.FC<SentenceStudyViewProps> = ({
  sentenceId,
  navigate,
  config
}) => {
  const [sentence, setSentence] = useState<SentenceItem | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [audioSpeed, setAudioSpeed] = useState<'normal' | 'slow'>('normal');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  useEffect(() => {
    loadSentence();
  }, [sentenceId]);

  const loadSentence = async () => {
    try {
      setLoading(true);
      const data = await api.getSentenceById(sentenceId);
      setSentence(data);
      // Resume from previous step if saved
      const savedStep = data.progress?.currentStep || 1;
      setCurrentStepIndex(Math.max(0, Math.min(savedStep - 1, data.steps.length - 1)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const steps = sentence?.steps || [];
  const currentStep = steps[currentStepIndex];
  const prevStep = currentStepIndex > 0 ? steps[currentStepIndex - 1] : null;

  const playStepAudio = useCallback(async (speed: 'normal' | 'slow' = audioSpeed) => {
    if (!currentStep) return;
    setIsSpeaking(true);
    const lang = config?.audioType === 'US' ? 'en-US' : 'en-GB';
    const rate = speed === 'slow' ? 0.75 : 1.0;
    await SpeechPlayer.speak(currentStep.content, { lang, rate });
    setIsSpeaking(false);
  }, [currentStep, config, audioSpeed]);

  // Autoplay audio on step change
  useEffect(() => {
    if (currentStep) {
      playStepAudio('normal');
    }
  }, [currentStepIndex, currentStep]);

  const handleNextStep = async () => {
    if (!sentence) return;

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStepIndex(nextIndex);
      try {
        await api.completeSentenceStep(sentence.id, nextIndex + 1);
      } catch (e) {
        console.error(e);
      }
    } else {
      // Completed all steps of this sentence!
      try {
        await api.completeSentenceStep(sentence.id, steps.length);
      } catch (e) {
        console.error(e);
      }
      setShowAnalysis(true);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-stone-500 text-sm">正在加载学语句...</p>
      </div>
    );
  }

  if (!sentence || !currentStep) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-stone-900">未找到该句子</h2>
        <button
          onClick={() => navigate('/sentences')}
          className="px-6 py-2.5 bg-stone-900 text-white rounded-xl text-sm"
        >
          返回句子列表
        </button>
      </div>
    );
  }

  // Calculate animated incremental addition for Section Fourteen
  // If currentStep starts with or extends prevStep, highlight the newly appended section
  const currentText = currentStep.content;
  const prevText = prevStep ? prevStep.content : '';

  let existingText = '';
  let newlyAddedText = currentText;

  if (prevText && currentText.toLowerCase().startsWith(prevText.toLowerCase())) {
    existingText = currentText.slice(0, prevText.length);
    newlyAddedText = currentText.slice(prevText.length);
  }

  const isFinalStep = currentStepIndex === steps.length - 1;

  // Type labels in Chinese
  const typeLabelMap: Record<string, string> = {
    WORD: '单词基石',
    PHRASE: '实用短语',
    STRUCTURE: '语法骨架',
    SENTENCE: '完整句子'
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/sentences')}
          className="text-xs font-medium text-stone-500 hover:text-stone-900 flex items-center gap-1 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>返回句子目录</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-400 font-sans">
            递进第 {currentStepIndex + 1} 步 / 共 {steps.length} 步
          </span>
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-stone-100 text-stone-700">
            {typeLabelMap[currentStep.type] || currentStep.type}
          </span>
        </div>
      </div>

      {/* Step Progress Pill Indicator */}
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1.5">
        {steps.map((st, idx) => (
          <button
            key={st.id}
            onClick={() => setCurrentStepIndex(idx)}
            className={`h-2 rounded-full transition-all ${
              idx === currentStepIndex
                ? 'bg-stone-950 scale-105'
                : idx < currentStepIndex
                ? 'bg-amber-400'
                : 'bg-stone-200 hover:bg-stone-300'
            }`}
            title={`第 ${idx + 1} 步: ${st.content}`}
          />
        ))}
      </div>

      {/* Main Focal Learning Card (Section Thirteen & Fourteen) */}
      <div className="bg-white border border-stone-200 rounded-3xl p-8 sm:p-14 text-center shadow-sm space-y-8 transition-all">
        {/* Progressive Text with Animation on newly added tokens */}
        <div className="space-y-4">
          <div className="text-xs uppercase tracking-wider text-amber-700 font-semibold flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>当前渐进阶梯：{typeLabelMap[currentStep.type]}</span>
          </div>

          <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-stone-950 font-serif leading-tight">
            {existingText ? (
              <span>
                <span>{existingText}</span>
                <span className="text-amber-800 bg-amber-100/70 px-1 rounded animate-fadeIn transition-colors">
                  {newlyAddedText}
                </span>
              </span>
            ) : (
              <span className="animate-fadeIn">{currentText}</span>
            )}
          </h2>

          {/* Phonetic transcription */}
          {currentStep.phonetic && (
            <div className="text-stone-500 font-mono text-base sm:text-lg">
              {currentStep.phonetic}
            </div>
          )}

          {/* Translation */}
          <div className="text-xl sm:text-2xl font-medium text-stone-800">
            {currentStep.translation}
          </div>
        </div>

        {/* Audio Playback Controls (Section Fifteen) */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => playStepAudio('normal')}
            className={`px-5 py-2.5 rounded-full border transition-all flex items-center gap-2 text-sm font-medium ${
              !isSpeaking
                ? 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
                : 'bg-amber-400 border-amber-400 text-stone-950 scale-105'
            }`}
          >
            <Volume2 className="w-4 h-4 text-amber-700" />
            <span>朗读当前阶段</span>
          </button>

          <button
            onClick={() => {
              setAudioSpeed(s => s === 'normal' ? 'slow' : 'normal');
              playStepAudio(audioSpeed === 'normal' ? 'slow' : 'normal');
            }}
            className="px-4 py-2.5 rounded-full border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition-all flex items-center gap-1.5 text-xs font-medium"
            title="慢速朗读"
          >
            <Snail className="w-3.5 h-3.5 text-stone-500" />
            <span>慢速 (0.75x)</span>
          </button>

          <button
            onClick={() => setShowAnalysis(prev => !prev)}
            className={`px-4 py-2.5 rounded-full border transition-all flex items-center gap-1.5 text-xs font-medium ${
              showAnalysis
                ? 'bg-stone-900 text-white border-stone-900'
                : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>{showAnalysis ? '收起句法分析' : '句法结构分析'}</span>
          </button>
        </div>

        {/* Sentence Structural Analysis (Section Seventeen) */}
        {showAnalysis && sentence.analyses && sentence.analyses.length > 0 && (
          <div className="pt-6 border-t border-stone-100 text-left space-y-4 animate-fadeIn">
            <div className="text-xs font-semibold text-stone-600 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-amber-700" />
              <span>句法成分结构剖析（语法认知）</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sentence.analyses.map(item => (
                <div
                  key={item.id}
                  className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900 font-serif text-sm">
                      {item.text}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-medium text-[11px]">
                      {item.type}
                    </span>
                  </div>
                  <p className="text-stone-600 text-xs leading-relaxed">
                    {item.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Progressive Step Controls */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handlePrevStep}
          disabled={currentStepIndex === 0}
          className="px-5 py-3 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-1 text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>← 上一步</span>
        </button>

        {isFinalStep ? (
          <button
            onClick={() => navigate('/sentences')}
            className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all flex items-center gap-2 text-sm shadow-sm"
          >
            <CheckCircle className="w-4 h-4" />
            <span>完成本句，返回列表</span>
          </button>
        ) : (
          <button
            onClick={handleNextStep}
            className="px-8 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold transition-all flex items-center gap-2 text-sm shadow-sm"
          >
            <span>下一步递增 →</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
