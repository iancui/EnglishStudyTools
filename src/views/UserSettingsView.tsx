import React from 'react';
import { User, LogOut, Settings, BookOpen, Shield } from 'lucide-react';
import { authStorage } from '../api/client.ts';

interface UserSettingsViewProps {
  user: any;
  onLogout: () => void;
  navigate: (route: string) => void;
}

export const UserSettingsView: React.FC<UserSettingsViewProps> = ({
  user,
  onLogout,
  navigate
}) => {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
          个人中心
        </div>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight mt-1">
          账户与系统设置
        </h1>
      </div>

      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-4 border-b border-stone-100 pb-6">
          <div className="w-14 h-14 rounded-2xl bg-stone-900 text-amber-50 flex items-center justify-center font-bold text-xl font-serif">
            {user?.username ? user.username[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900">
              {user?.username || 'Learner'}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {user?.email || 'learner@linguastep.com'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/settings/dictionary')}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-stone-200 hover:border-stone-400 hover:bg-stone-50 transition-all text-left text-sm"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-4 h-4 text-stone-600" />
              <div>
                <div className="font-semibold text-stone-900">辞书与语音发音配置</div>
                <div className="text-xs text-stone-500 mt-0.5">切换英美音标与自然拼读拆分</div>
              </div>
            </div>
            <span className="text-xs text-stone-400">配置 →</span>
          </button>

          <button
            onClick={() => navigate('/statistics')}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-stone-200 hover:border-stone-400 hover:bg-stone-50 transition-all text-left text-sm"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-4 h-4 text-stone-600" />
              <div>
                <div className="font-semibold text-stone-900">学习档案与历史数据</div>
                <div className="text-xs text-stone-500 mt-0.5">查看今日正确率与掌握单词总数</div>
              </div>
            </div>
            <span className="text-xs text-stone-400">查看 →</span>
          </button>
        </div>

        <div className="pt-4 border-t border-stone-100 flex justify-end">
          <button
            onClick={onLogout}
            className="px-5 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>退出当前登录</span>
          </button>
        </div>
      </div>
    </div>
  );
};
