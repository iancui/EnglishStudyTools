import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { HomeView } from './views/HomeView.tsx';
import { StudySessionView } from './views/StudySessionView.tsx';
import { StudySetupModal } from './views/StudySetupModal.tsx';
import { DictionariesView } from './views/DictionariesView.tsx';
import { AdminDictionariesView } from './views/AdminDictionariesView.tsx';
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
  const [isStudySetupOpen, setIsStudySetupOpen] = useState(false);
  const [setupInitialDictId, setSetupInitialDictId] = useState<string | undefined>(undefined);

  const [config, setConfig] = useState<DictionaryConfig>({
    id: 'cfg-default',
    userId: 'u-default',
    defaultDictionaryId: 'dict-primary-6',
    englishDict: 'Oxford',
    ecDict: 'Oxford',
    phoneticType: 'UK',
    audioType: 'UK',
    enablePhonics: true
  });

  useEffect(() => {
    initApp();

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

  const handleOpenStudySetup = (dictId?: string) => {
    setSetupInitialDictId(dictId || config.defaultDictionaryId || 'dict-primary-6');
    setIsStudySetupOpen(true);
  };

  const handleSessionStarted = (sessionId: string) => {
    navigate(`/study/${sessionId}`);
  };

  // Route parser for dynamic and nested routes
  const renderCurrentView = () => {
    if (currentRoute === '/') {
      return (
        <HomeView
          navigate={navigate}
          onOpenStudySetup={() => handleOpenStudySetup()}
        />
      );
    }

    // Study session routes
    if (currentRoute.startsWith('/study/')) {
      const sessionId = currentRoute.split('/')[2];
      return (
        <StudySessionView
          sessionId={sessionId}
          navigate={navigate}
          config={config}
        />
      );
    }

    // Direct /words/learn or /words/review fallback triggers active session or setup
    if (currentRoute === '/words/learn' || currentRoute === '/words/review') {
      return (
        <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
          <h2 className="text-xl font-bold text-stone-900">开启新一轮单词任务</h2>
          <p className="text-xs text-stone-500">
            单词学习与背写已升级为一体化定制 Session。请选择词库与偏好开启学习。
          </p>
          <button
            onClick={() => handleOpenStudySetup()}
            className="px-6 py-3 bg-stone-900 text-white rounded-xl text-sm font-semibold shadow-sm"
          >
            配置并开始背单词
          </button>
        </div>
      );
    }

    if (currentRoute === '/dictionaries') {
      return (
        <DictionariesView
          navigate={navigate}
          onOpenStudySetup={handleOpenStudySetup}
          user={user}
          defaultDictId={config.defaultDictionaryId}
          onDefaultDictChanged={id => setConfig(prev => ({ ...prev, defaultDictionaryId: id }))}
        />
      );
    }

    if (currentRoute === '/admin/dictionaries' || currentRoute === '/admin') {
      return (
        <AdminDictionariesView
          navigate={navigate}
          user={user}
        />
      );
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

    return (
      <HomeView
        navigate={navigate}
        onOpenStudySetup={() => handleOpenStudySetup()}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 flex flex-col font-sans selection:bg-amber-200">
      <Navbar
        currentRoute={currentRoute}
        navigate={navigate}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenStudySetup={() => handleOpenStudySetup()}
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
            基于认知闭环与学习会话架构 · 单词 (学 $\to$ 背写) $\to$ 渐进式长句
          </div>
        </div>
      </footer>

      {/* Study Session Configuration Modal */}
      <StudySetupModal
        isOpen={isStudySetupOpen}
        onClose={() => setIsStudySetupOpen(false)}
        onSessionStarted={handleSessionStarted}
        initialDictionaryId={setupInitialDictId}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={u => setUser(u)}
      />
    </div>
  );
}
