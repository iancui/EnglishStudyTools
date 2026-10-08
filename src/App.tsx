import React, { useEffect, useState, useCallback } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { HomeView } from './views/HomeView.tsx';
import { StudySessionView } from './views/StudySessionView.tsx';
import { StudySetupModal } from './views/StudySetupModal.tsx';
import { SentencePracticeView } from './views/SentencePracticeView.tsx';
import { DictionariesView } from './views/DictionariesView.tsx';
import { AdminDictionariesView } from './views/AdminDictionariesView.tsx';
import { SentenceListView } from './views/SentenceListView.tsx';
import { SentenceStudyView } from './views/SentenceStudyView.tsx';
import { WrongWordsView } from './views/WrongWordsView.tsx';
import { StatisticsView } from './views/StatisticsView.tsx';
import { DictionarySettingsView } from './views/DictionarySettingsView.tsx';
import { UserSettingsView } from './views/UserSettingsView.tsx';
import { SettingsView } from './views/SettingsView.tsx';
import { AuthModal } from './views/AuthModal.tsx';
import { AdminSentenceAIToolView } from './views/AdminSentenceAIToolView.tsx';
import { AdminExcelImportView } from './views/AdminExcelImportView.tsx';
import { AdminRbacView } from './views/AdminRbacView.tsx';
import { api, authStorage } from './api/client.ts';
import { DictionaryConfig, SessionMode } from './types/index.ts';

let appRenderCount = 0;
export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    return window.location.pathname || '/';
  });
  const [user, setUser] = useState<any>(() => authStorage.getUser());
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [isStudySetupOpen, setIsStudySetupOpen] = useState(false);
  const [setupInitialDictId, setSetupInitialDictId] = useState<string | undefined>(undefined);
  const [setupInitialMode, setSetupInitialMode] = useState<SessionMode>('LEARN_AND_WRITE');

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

  React.useEffect(() => {
    console.log('[App MOUNT]');
    return () => console.log('[App UNMOUNT]');
  }, []);

  React.useEffect(() => {
    console.log('[App] config reference changed');
  }, [config]);

  React.useEffect(() => {
    console.log('[App] user reference changed, hasUser=', !!user);
  }, [user]);

  appRenderCount++;
  console.log(`[App RENDER] #${appRenderCount}`, { route: currentRoute, hasUser: !!user, configId: config.id });

  const navigate = useCallback((route: string) => {
    const target = route.startsWith('/') ? route : `/${route}`;
    window.history.pushState({}, '', target);
    setCurrentRoute(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const handleAuthRequired = () => {
      authStorage.clearToken();
      setUser(null);
      setAuthRequired(true);
      if (window.location.pathname !== '/login') {
        window.history.replaceState({}, '', '/login');
        setCurrentRoute('/login');
      }
    };
    window.addEventListener('linguastep:auth-required', handleAuthRequired);
    initApp();

    const handlePopState = () => {
      setCurrentRoute(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('linguastep:auth-required', handleAuthRequired);
    };
  }, []);

  const initApp = async () => {
    try {
      if (!authStorage.getToken()) {
        setAuthRequired(true);
        if (window.location.pathname !== '/login') {
          window.history.replaceState({}, '', '/login');
          setCurrentRoute('/login');
        }
        return;
      }

      const currentUser = await api.getCurrentUser();
      if (currentUser) {
        setUser((prev: any) => {
          if (JSON.stringify(prev) === JSON.stringify(currentUser)) return prev;
          return currentUser;
        });
        authStorage.setUser(currentUser);
      }

      const cfg = await api.getDictionaryConfig();
      if (cfg) {
        setConfig(prev => {
          if (JSON.stringify(prev) === JSON.stringify(cfg)) return prev;
          return cfg;
        });
      }
    } catch (e) {
      console.warn('Initial load fallback:', e);
    }
  };

  const handleLogout = () => {
    authStorage.clearToken();
    setUser(null);
    navigate('/');
  };

  const handleOpenStudySetup = (dictId?: string, mode?: SessionMode) => {
    setSetupInitialDictId(dictId);
    setSetupInitialMode(mode || 'LEARN_AND_WRITE');
    setIsStudySetupOpen(true);
  };

  const handleSessionStarted = (sessionId: string) => {
    navigate(`/study/${sessionId}`);
  };

  const handleStartSentencePractice = async () => {
    try {
      const session = await api.createSentencePracticeSession({
        dictionaryId: config.sentenceDictionaryId || config.defaultDictionaryId
      });
      if (session?.id) {
        navigate(`/sentence-practice/${session.id}`);
      }
    } catch (e: any) {
      alert('开始句子练习失败：' + (e?.message || '未知错误'));
    }
  };

  // Route parser for dynamic and nested routes
  const renderCurrentView = () => {
    if (currentRoute === '/login') {
      return (
        <AuthModal
          isOpen={true}
          onClose={() => {
            if (authStorage.getToken()) {
              setAuthRequired(false);
              navigate('/');
            }
          }}
          onSuccess={async u => {
            setUser(u);
            authStorage.setUser(u);
            setAuthRequired(false);
            try {
              const cfg = await api.getDictionaryConfig();
              if (cfg) setConfig(cfg);
            } catch (e) {
              console.warn('Failed to load dictionary config after login:', e);
            }
            navigate('/');
          }}
        />
      );
    }

    if (currentRoute === '/') {
      return (
        <HomeView
          navigate={navigate}
          onOpenStudySetup={handleOpenStudySetup}
          onStartSentencePractice={handleStartSentencePractice}
        />
      );
    }

    // Sentence practice session routes
    if (currentRoute.startsWith('/sentence-practice/')) {
      const sessionId = currentRoute.split('/')[2];
      return (
        <SentencePracticeView
          sessionId={sessionId}
          navigate={navigate}
          config={config}
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

    if (currentRoute === '/admin/rbac') {
      return <AdminRbacView navigate={navigate} user={user} />;
    }

    if (currentRoute === '/admin/sentence-ai') {
      return <AdminSentenceAIToolView navigate={navigate} user={user} />;
    }

    if (currentRoute === '/admin/excel-import') {
      return <AdminExcelImportView navigate={navigate} user={user} />;
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
      return (
        <SettingsView
          initialTab="learning"
          user={user}
          onLogout={handleLogout}
          navigate={navigate}
          onConfigUpdated={setConfig}
          initialConfig={config}
        />
      );
    }

    if (currentRoute === '/settings/my-dictionaries') {
      return (
        <SettingsView
          initialTab="my-dictionaries"
          user={user}
          onLogout={handleLogout}
          navigate={navigate}
          onConfigUpdated={setConfig}
          initialConfig={config}
        />
      );
    }

    if (currentRoute.startsWith('/settings')) {
      return (
        <SettingsView
          initialTab="learning"
          user={user}
          onLogout={handleLogout}
          navigate={navigate}
          onConfigUpdated={setConfig}
          initialConfig={config}
        />
      );
    }

    return (
      <HomeView
        navigate={navigate}
        onOpenStudySetup={() => handleOpenStudySetup()}
      />
    );
  };

  // Independent Immersive Learning Pages: Absolutely NO normal Navbar and NO normal Footer!
  if (currentRoute.startsWith('/study/') || currentRoute.startsWith('/sentence-practice/')) {
    const isSentencePractice = currentRoute.startsWith('/sentence-practice/');
    const sessionId = currentRoute.split('/')[2];

    return (
      <div className="min-h-screen bg-[#F7FAFF] text-[#29466F] flex flex-col font-sans selection:bg-[#EBF2FE]">
        <main className="flex-1">
          {isSentencePractice ? (
            <SentencePracticeView
              sessionId={sessionId}
              navigate={navigate}
              config={config}
            />
          ) : (
            <StudySessionView
              sessionId={sessionId}
              navigate={navigate}
              config={config}
            />
          )}
        </main>

        <StudySetupModal
          isOpen={isStudySetupOpen}
          onClose={() => setIsStudySetupOpen(false)}
          onSessionStarted={handleSessionStarted}
          initialDictionaryId={setupInitialDictId}
          initialMode={setupInitialMode}
          config={config}
        />

        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onSuccess={u => setUser(u)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7FAFF] text-[#29466F] flex flex-col font-sans selection:bg-[#EBF2FE]">
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

      <footer className="border-t border-[#E7EEF8] bg-white py-6 text-center text-xs text-[#8BA0BD]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#29466F]">LinguaStep</span>
            <span>·</span>
            <span>英语单词 + 句子渐进式学习平台</span>
          </div>
          <div>
            现代沉浸式英语认知闭环 · 单词拼写输入 $\to$ 渐进式长句输出
          </div>
        </div>
      </footer>

      {/* Study Session Configuration Modal */}
      <StudySetupModal
        isOpen={isStudySetupOpen}
        onClose={() => setIsStudySetupOpen(false)}
        onSessionStarted={handleSessionStarted}
        initialDictionaryId={setupInitialDictId}
        initialMode={setupInitialMode}
        config={config}
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
