import React from 'react';
import { Volume2, BookOpen, CheckSquare, Layers, Bookmark, BarChart3, Settings, FolderKanban, Shield } from 'lucide-react';

interface NavbarProps {
  currentRoute: string;
  navigate: (route: string) => void;
  user: any;
  onOpenAuth: () => void;
  onOpenStudySetup?: () => void;
  config?: any;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  navigate,
  user,
  onOpenAuth
}) => {
  const isAdmin = user?.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E7EEF8]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => navigate('/')}
          className="text-lg font-bold tracking-tight text-[#29466F] flex items-center gap-2.5 hover:opacity-90 transition-opacity"
        >
          <span className="w-8 h-8 rounded-xl bg-[#4F7DF3] text-white flex items-center justify-center font-bold text-base shadow-xs">
            L
          </span>
          <span className="tracking-tight">LinguaStep</span>
        </button>

        {/* Zone 2: Desktop navigation - Exactly 首页 | 错词本 | 学习记录 | 设置 */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <button
            onClick={() => navigate('/')}
            className={`transition-colors pb-1 border-b-2 ${
              currentRoute === '/'
                ? 'border-[#4F7DF3] text-[#29466F] font-semibold'
                : 'border-transparent text-[#8BA0BD] hover:text-[#29466F]'
            }`}
          >
            首页
          </button>
          <button
            onClick={() => navigate('/words/wrong')}
            className={`transition-colors pb-1 border-b-2 ${
              currentRoute === '/words/wrong'
                ? 'border-[#4F7DF3] text-[#29466F] font-semibold'
                : 'border-transparent text-[#8BA0BD] hover:text-[#29466F]'
            }`}
          >
            错词本
          </button>
          <button
            onClick={() => navigate('/statistics')}
            className={`transition-colors pb-1 border-b-2 ${
              currentRoute === '/statistics'
                ? 'border-[#4F7DF3] text-[#29466F] font-semibold'
                : 'border-transparent text-[#8BA0BD] hover:text-[#29466F]'
            }`}
          >
            学习记录
          </button>
          <button
            onClick={() => navigate('/settings')}
            className={`transition-colors pb-1 border-b-2 ${
              currentRoute.startsWith('/settings')
                ? 'border-[#4F7DF3] text-[#29466F] font-semibold'
                : 'border-transparent text-[#8BA0BD] hover:text-[#29466F]'
            }`}
          >
            设置
          </button>
          {isAdmin && (
            <button
              onClick={() => navigate('/admin/dictionaries')}
              className={`transition-colors pb-1 border-b-2 text-rose-600 flex items-center gap-1 ${
                currentRoute.startsWith('/admin')
                  ? 'border-rose-600 font-bold'
                  : 'border-transparent hover:text-rose-700'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>管理后台</span>
            </button>
          )}
        </nav>

        {/* Zone 3: User action */}
        <div className="flex items-center gap-3">
          {user ? (
            <button
              onClick={() => navigate('/settings')}
              className="px-3.5 py-1.5 text-xs font-semibold text-[#29466F] bg-[#F7FAFF] border border-[#E7EEF8] rounded-xl hover:bg-white transition-colors whitespace-nowrap flex items-center gap-1.5 shadow-2xs"
            >
              <span>{user.username}</span>
              {isAdmin && (
                <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.2 rounded font-bold">
                  ADMIN
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#4F7DF3] hover:bg-[#3D6CE5] rounded-xl transition-all shadow-xs"
            >
              登录 / 注册
            </button>
          )}
        </div>
      </div>

      {/* Mobile navigation - Exactly 首页 | 错词本 | 学习记录 | 设置 */}
      <div className="md:hidden flex items-center justify-around border-t border-stone-100 py-2.5 bg-stone-50/95 text-xs">
        <button
          onClick={() => navigate('/')}
          className={`flex flex-col items-center py-1 px-3 ${
            currentRoute === '/' ? 'text-stone-900 font-bold' : 'text-stone-500'
          }`}
        >
          首页
        </button>
        <button
          onClick={() => navigate('/words/wrong')}
          className={`flex flex-col items-center py-1 px-3 ${
            currentRoute === '/words/wrong' ? 'text-stone-900 font-bold' : 'text-stone-500'
          }`}
        >
          错词本
        </button>
        <button
          onClick={() => navigate('/statistics')}
          className={`flex flex-col items-center py-1 px-3 ${
            currentRoute === '/statistics' ? 'text-stone-900 font-bold' : 'text-stone-500'
          }`}
        >
          学习记录
        </button>
        <button
          onClick={() => navigate('/settings')}
          className={`flex flex-col items-center py-1 px-3 ${
            currentRoute.startsWith('/settings') ? 'text-stone-900 font-bold' : 'text-stone-500'
          }`}
        >
          设置
        </button>
      </div>
    </header>
  );
};
