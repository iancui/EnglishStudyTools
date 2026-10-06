import React from 'react';
import { Volume2, BookOpen, CheckSquare, Layers, Bookmark, BarChart3, Settings } from 'lucide-react';

interface NavbarProps {
  currentRoute: string;
  navigate: (route: string) => void;
  user: any;
  onOpenAuth: () => void;
  config: any;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  navigate,
  user,
  onOpenAuth,
  config
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => navigate('/')}
          className="text-xl font-bold tracking-tight text-stone-900 flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <span className="w-8 h-8 rounded-lg bg-stone-900 text-amber-50 flex items-center justify-center font-serif text-lg">
            L
          </span>
          <span>LinguaStep</span>
        </button>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          <button
            onClick={() => navigate('/')}
            className={`transition-colors pb-1 border-b-2 ${
              currentRoute === '/'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            首页
          </button>
          <button
            onClick={() => navigate('/words/learn')}
            className={`transition-colors pb-1 border-b-2 ${
              currentRoute === '/words/learn'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            学单词
          </button>
          <button
            onClick={() => navigate('/words/review')}
            className={`transition-colors pb-1 border-b-2 ${
              currentRoute === '/words/review'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            背单词
          </button>
          <button
            onClick={() => navigate('/sentences')}
            className={`transition-colors pb-1 border-b-2 ${
              currentRoute.startsWith('/sentences')
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            渐进句子
          </button>
          <button
            onClick={() => navigate('/words/wrong')}
            className={`transition-colors pb-1 border-b-2 ${
              currentRoute === '/words/wrong'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            错词本
          </button>
          <button
            onClick={() => navigate('/statistics')}
            className={`transition-colors pb-1 border-b-2 ${
              currentRoute === '/statistics'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            学习记录
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/settings/dictionary')}
            className={`p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors ${
              currentRoute === '/settings/dictionary' ? 'bg-stone-100 text-stone-900' : ''
            }`}
            title="辞书配置"
            aria-label="辞书配置"
          >
            <Settings className="w-5 h-5" />
          </button>

          {user ? (
            <button
              onClick={() => navigate('/settings')}
              className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors whitespace-nowrap"
            >
              {user.username}
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 text-xs font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors whitespace-nowrap"
            >
              登录 / 注册
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav drawer / bottom strip */}
      <div className="md:hidden flex items-center justify-around border-t border-stone-100 py-2 bg-stone-50/90 text-xs">
        <button
          onClick={() => navigate('/')}
          className={`flex flex-col items-center py-1 px-2 ${currentRoute === '/' ? 'text-stone-900 font-semibold' : 'text-stone-500'}`}
        >
          首页
        </button>
        <button
          onClick={() => navigate('/words/learn')}
          className={`flex flex-col items-center py-1 px-2 ${currentRoute === '/words/learn' ? 'text-stone-900 font-semibold' : 'text-stone-500'}`}
        >
          学单词
        </button>
        <button
          onClick={() => navigate('/words/review')}
          className={`flex flex-col items-center py-1 px-2 ${currentRoute === '/words/review' ? 'text-stone-900 font-semibold' : 'text-stone-500'}`}
        >
          背单词
        </button>
        <button
          onClick={() => navigate('/sentences')}
          className={`flex flex-col items-center py-1 px-2 ${currentRoute.startsWith('/sentences') ? 'text-stone-900 font-semibold' : 'text-stone-500'}`}
        >
          渐进句子
        </button>
        <button
          onClick={() => navigate('/statistics')}
          className={`flex flex-col items-center py-1 px-2 ${currentRoute === '/statistics' ? 'text-stone-900 font-semibold' : 'text-stone-500'}`}
        >
          统计
        </button>
      </div>
    </header>
  );
};
