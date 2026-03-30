import React, { useState, useContext } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Smartphone, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  ChevronLeft 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthContext } from '../../../contexts/AuthContext';
import { LanguageContext } from '../../../contexts/LanguageContext';

export const AuthModal = ({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean, 
  onClose: () => void 
}) => {
  const { t, lang } = useContext(LanguageContext);
  const { login, register, loginWithPhone, verifyOTP } = useContext(AuthContext);
  const [mode, setMode] = useState<'login' | 'register' | 'phone' | 'otp'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') await login(email, password);
      else if (mode === 'register') await register(email, password, name);
      else if (mode === 'phone') {
        await loginWithPhone(phone, 'recaptcha-container');
        setMode('otp');
        return;
      } else if (mode === 'otp') {
        await verifyOTP(otp);
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-end justify-center sm:items-center p-0 sm:p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="relative bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[48px] shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-8 border-b border-gray-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            {mode === 'otp' && (
              <button onClick={() => setMode('phone')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ChevronLeft className={`w-6 h-6 ${lang === 'ar' ? 'rotate-180' : ''}`} />
              </button>
            )}
            <h2 className="text-3xl font-black tracking-tighter uppercase italic">
              {mode === 'login' ? t({ en: 'Welcome Back', ar: 'مرحباً بعودتك' }) : 
               mode === 'register' ? t({ en: 'Join Kuzama', ar: 'انضم إلينا' }) : 
               t({ en: 'Phone Login', ar: 'دخول بالجوال' })}
            </h2>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-2xl transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-xs font-bold flex items-center gap-3 border border-red-100">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            {mode === 'register' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 block">{t({ en: 'Full Name', ar: 'الاسم الكامل' })}</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-3xl font-bold transition-all outline-none"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            {(mode === 'login' || mode === 'register') && (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 block">{t({ en: 'Email Address', ar: 'البريد الإلكتروني' })}</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-3xl font-bold transition-all outline-none"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 block">{t({ en: 'Password', ar: 'كلمة المرور' })}</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-3xl font-bold transition-all outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </>
            )}

            {(mode === 'phone' || mode === 'otp') && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 block">
                  {mode === 'phone' ? t({ en: 'Phone Number', ar: 'رقم الجوال' }) : t({ en: 'Verification Code', ar: 'رمز التحقق' })}
                </label>
                <div className="relative">
                  {mode === 'phone' ? <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /> : <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />}
                  <input 
                    type={mode === 'phone' ? 'tel' : 'text'}
                    required
                    value={mode === 'phone' ? phone : otp}
                    onChange={(e) => mode === 'phone' ? setPhone(e.target.value) : setOtp(e.target.value)}
                    className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-3xl font-bold transition-all outline-none"
                    placeholder={mode === 'phone' ? '+966 5X XXX XXXX' : '123456'}
                  />
                </div>
              </div>
            )}

            <div id="recaptcha-container"></div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-6 bg-black text-white rounded-[32px] font-black text-xl hover:bg-gray-900 transition-all shadow-2xl shadow-black/20 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? t({ en: 'Sign In', ar: 'تسجيل الدخول' }) : 
                   mode === 'register' ? t({ en: 'Create Account', ar: 'إنشاء حساب' }) : 
                   mode === 'phone' ? t({ en: 'Send Code', ar: 'إرسال الرمز' }) : 
                   t({ en: 'Verify & Login', ar: 'تحقق ودخول' })}
                  <ChevronRight className={`w-6 h-6 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 space-y-6">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
              <span className="relative px-4 bg-white text-[10px] font-black text-gray-300 uppercase tracking-widest">{t({ en: 'or continue with', ar: 'أو المتابعة باستخدام' })}</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {mode !== 'phone' && mode !== 'otp' && (
                <button 
                  onClick={() => setMode('phone')}
                  className="w-full py-5 bg-gray-50 text-black rounded-[32px] font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-3"
                >
                  <Smartphone className="w-5 h-5" />
                  {t({ en: 'Phone Number', ar: 'رقم الجوال' })}
                </button>
              )}
              
              <button 
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="w-full py-5 text-gray-400 font-bold hover:text-black transition-all"
              >
                {mode === 'login' ? t({ en: "Don't have an account? Sign Up", ar: 'ليس لديك حساب؟ سجل الآن' }) : 
                 t({ en: 'Already have an account? Sign In', ar: 'لديك حساب بالفعل؟ سجل دخولك' })}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
