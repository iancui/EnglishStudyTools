import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { HomeView } from './views/HomeView.tsx';
import { WordLearnView } from './views/WordLearnView.tsx';
import { WordReviewView } from './views/WordReviewView.tsx';
import { SentenceListView } from './views/SentenceListView.tsx';
import { SentenceStudyView } from './views/SentenceStudyView.tsx';
import { WrongWordsView } from './views/WrongWordsView.tsx';
import { StatisticsView } from './views/StatisticsView.tsx';
import { DictionarySettingsView } from './views/DictionarySettingsView.tsx';
import { UserSettingsView } from './views/UserSettingsView.tsx';
import { AuthModal } from './views/AuthModal.tsx';
import { api, authStorage } from './api/client.ts';
import { DictionaryConfig } from './types/index.ts';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    return window.location.pathname || '/';
  });
  const [user, setUser] = useState<any>(() => authStorage.getUser());
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [config, setConfig] = useState<DictionaryConfig>({
    id: 'cfg-default',
    userId: 'u-default',
    englishDict: 'Oxford',
    ecDict: 'Oxford',
    phoneticType: 'UK',
    audioType: 'UK',
    enablePhonics: true
  });

  useEffect(() => {
    // Initial data fetch
    initApp();

    // Listen to browser popstate
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const initApp = async () => {
    try {
      const cfg = await api.getDictionaryConfig();
      if (cfg) {
        setConfig(cfg);
      }
      const currentUser = await api.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        authStorage.setUser(currentUser);
      }
    } catch (e) {
      console.warn('Initial load fallback:', e);
    }
  };

  const navigate = (route: string) => {
    setCurrentRoute(route);
    window.history.pushState({}, '', route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    authStorage.clearToken();
    setUser(null);
    navigate('/');
  };

  // Route parser for dynamic routes like /sentences/:id
  const renderCurrentView = () => {
    if (currentRoute === '/') {
      return <HomeView navigate={navigate} />;
    }
    if (currentRoute === '/words/learn') {
      return <WordLearnView navigate={navigate} config={config} />;
    }
    if (currentRoute === '/words/review') {
      return <WordReviewView navigate={navigate} config={config} />;
    }
    if (currentRoute === '/words/wrong') {
      return <WrongWordsView navigate={navigate} config={config} />;
    }
    if (currentRoute === '/sentences') {
      return <SentenceListView navigate={navigate} />;
    }
    if (currentRoute.startsWith('/sentences/')) {
      const sentenceId = currentRoute.split('/')[2];
      return <SentenceStudyView sentenceId={sentenceId} navigate={navigate} config={config} />;
    }
    if (currentRoute === '/statistics') {
      return <StatisticsView navigate={navigate} />;
    }
    if (currentRoute === '/settings/dictionary') {
      return <DictionarySettingsView navigate={navigate} onConfigUpdated={setConfig} />;
    }
    if (currentRoute === '/settings') {
      return <UserSettingsView user={user} onLogout={handleLogout} navigate={navigate} />;
    }

    return <HomeView navigate={navigate} />;
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 flex flex-col font-sans selection:bg-amber-200">
      <Navbar
        currentRoute={currentRoute}
        navigate={navigate}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        config={config}
      />

      <main className="flex-1 pb-16">
        {renderCurrentView()}
      </main>

      <footer className="border-t border-stone-200 bg-white py-6 text-center text-xs text-stone-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-700">LinguaStep</span>
            <span>·</span>
            <span>英语单词 + 句子渐进式学习平台</span>
          </div>
          <div>
            基于认知规律与科学间隔复习构建 · 单词 → 短语 → 骨架 → 语境
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={u => setUser(u)}
      />
    </div>
  );
}
