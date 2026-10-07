import React, { useEffect, useState } from 'react';
import { X, Lock, Mail, User } from 'lucide-react';
import { api, authStorage } from '../api/client.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');

  const loadCaptcha = async () => {
    try {
      const data = await api.getCaptcha();
      setCaptchaId(data.captchaId);
      setCaptchaImage(data.image);
      setCaptchaCode('');
    } catch (e) {
      setErrorMsg('验证码加载失败，请重试');
    }
  };

  useEffect(() => {
    if (isOpen) loadCaptcha();
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.login({ identifier: username, password, captchaId, captchaCode });
        authStorage.setToken(res.token);
        authStorage.setUser(res.user);
        onSuccess(res.user);
        onClose();
      } else {
        const res = await api.register({ username, email, password, captchaId, captchaCode });
        authStorage.setToken(res.token);
        authStorage.setUser(res.user);
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-stone-100">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-2 mb-6">
          <h2 className="text-2xl font-bold text-stone-900">
            {mode === 'login' ? '登录 LinguaStep' : '注册新账户'}
          </h2>
          <p className="text-xs text-stone-500">
            {mode === 'login' ? '继续你的渐进式英语突破之旅' : '加入并记录个性化词汇复习与进度'}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-100">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700">用户名</label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="例如: alex"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-stone-900 outline-none"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-700">
              {mode === 'login' ? '账户名' : '电子邮箱'}
            </label>
            <div className="relative">
              {mode === 'login'
                ? <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                : <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />}
              <input
                type={mode === 'login' ? 'text' : 'email'}
                required
                value={mode === 'login' ? username : email}
                onChange={e => mode === 'login' ? setUsername(e.target.value) : setEmail(e.target.value)}
                placeholder={mode === 'login' ? '请输入账户名，例如 admin' : 'name@example.com'}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-stone-900 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-700">密码</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="******"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-stone-900 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-700">图形验证码</label>
            <div className="flex gap-2">
              <input type="text" required value={captchaCode} onChange={e => setCaptchaCode(e.target.value.toUpperCase())} placeholder="输入验证码" maxLength={5} className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-stone-900 outline-none" />
              <button type="button" onClick={loadCaptcha} className="w-[150px] h-[44px] rounded-xl overflow-hidden border border-stone-200 bg-stone-50 shrink-0" title="点击刷新验证码">
                {captchaImage ? <img src={captchaImage} alt="图形验证码" className="w-full h-full" /> : <span className="text-xs text-stone-400">加载中</span>}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all mt-2 shadow-sm"
          >
            {loading ? '正在处理...' : mode === 'login' ? '立即登录' : '注册并开始'}
          </button>
        </form>

        <div className="pt-5 mt-5 border-t border-stone-100 text-center text-xs text-stone-500">
          {mode === 'login' ? (
            <span>
              还没有账号？{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg('');
                }}
                className="font-semibold text-stone-900 hover:underline"
              >
                免费注册
              </button>
            </span>
          ) : (
            <span>
              已有账号？{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                }}
                className="font-semibold text-stone-900 hover:underline"
              >
                直接登录
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
