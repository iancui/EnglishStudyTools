import React, { useState, useEffect } from 'react';
import { Star, Bookmark, Check } from 'lucide-react';
import { api } from '../api/client.ts';
import { AddToDictionaryModal } from './AddToDictionaryModal.tsx';

interface AddToDictionaryButtonProps {
  word: {
    id: string;
    text: string;
    phoneticUk?: string;
    phoneticUs?: string;
    meanings?: any[];
    pos?: string;
  } | null;
  variant?: 'pill' | 'compact' | 'ghost';
  className?: string;
  onChanged?: (dictionaryIds: string[]) => void;
}

export const AddToDictionaryButton: React.FC<AddToDictionaryButtonProps> = ({
  word,
  variant = 'pill',
  className = '',
  onChanged
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addedCount, setAddedCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (word?.id) {
      checkStatus();
    } else {
      setAddedCount(0);
    }
  }, [word?.id]);

  const checkStatus = async () => {
    if (!word?.id) return;
    try {
      setLoading(true);
      const res = await api.getWordMyDictionaries(word.id);
      const count = res.dictionaryIds?.length || 0;
      setAddedCount(count);
    } catch (e) {
      // Non-blocking
    } finally {
      setLoading(false);
    }
  };

  const handleSaved = (dictionaryIds: string[]) => {
    setAddedCount(dictionaryIds.length);
    onChanged?.(dictionaryIds);
  };

  if (!word) return null;

  const isCollected = addedCount > 0;

  let buttonContent: React.ReactNode;
  if (variant === 'compact') {
    buttonContent = (
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        title={isCollected ? `已加入 ${addedCount} 本辞书` : '加入我的辞书'}
        className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all flex items-center gap-1.5 select-none ${
          isCollected
            ? 'bg-amber-50/90 border-amber-300 text-amber-900 hover:bg-amber-100 shadow-xs'
            : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-stone-300'
        } ${className}`}
      >
        <Star
          className={`w-3.5 h-3.5 transition-colors ${
            isCollected
              ? 'text-amber-500 fill-amber-400'
              : 'text-stone-400'
          }`}
        />
        <span>{isCollected ? `已加入 (${addedCount})` : '加入我的辞书'}</span>
      </button>
    );
  } else if (variant === 'ghost') {
    buttonContent = (
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        title={isCollected ? `已加入 ${addedCount} 本辞书` : '加入我的辞书'}
        className={`text-xs font-medium transition-colors flex items-center gap-1 py-1 px-2 rounded-lg ${
          isCollected
            ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
            : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
        } ${className}`}
      >
        <Star
          className={`w-3.5 h-3.5 ${
            isCollected
              ? 'text-amber-500 fill-amber-400'
              : 'text-stone-400'
          }`}
        />
        <span>{isCollected ? `已加入辞书 (${addedCount})` : '加入我的辞书'}</span>
      </button>
    );
  } else {
    // Default prominent pill button
    buttonContent = (
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={`px-4 py-2.5 rounded-full border transition-all flex items-center gap-2 text-xs font-semibold shadow-xs select-none ${
          isCollected
            ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100 ring-2 ring-amber-200/50'
            : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50 hover:border-stone-300'
        } ${className}`}
      >
        <Star
          className={`w-4 h-4 transition-transform ${
            isCollected
              ? 'text-amber-500 fill-amber-400 scale-110'
              : 'text-stone-400 hover:text-amber-500'
          }`}
        />
        <span>{isCollected ? `已加入我的辞书 (${addedCount})` : '☆ 加入我的辞书'}</span>
      </button>
    );
  }

  return (
    <>
      {buttonContent}
      <AddToDictionaryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        word={word}
        onSaved={handleSaved}
      />
    </>
  );
};
