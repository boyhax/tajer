import React, { useState, useEffect } from 'react';
import { RecaptchaVerifier } from 'firebase/auth';
import { 
  useAuth, 
  useLanguage 
} from '../../../contexts';
import { auth } from '../../../services/firebaseService';
import { config } from '../../../lib/config';

let recaptchaVerifier: RecaptchaVerifier | null = null;

export const PhoneLogin = () => {
  const { signInWithPhone, verifyCode } = useAuth();
  const { t } = useLanguage();
  const [phoneNumber, setPhoneNumber] = useState(config.auth.defaultCountryCode);
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const initRecaptcha = () => {
    if (recaptchaVerifier) {
      try { recaptchaVerifier.clear(); } catch (e) {}
      recaptchaVerifier = null;
    }
    const container = document.getElementById('recaptcha-container');
    if (container) container.innerHTML = '';
    
    try {
      recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        badge: 'inline'
      });
    } catch (err) {
      console.error('Failed to init recaptcha', err);
    }
  };

  useEffect(() => {
    initRecaptcha();
    return () => {
      if (recaptchaVerifier) {
        try { recaptchaVerifier.clear(); } catch (e) {}
        recaptchaVerifier = null;
      }
    };
  }, []);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      if (!recaptchaVerifier) {
        initRecaptcha();
      }

      await signInWithPhone(phoneNumber, recaptchaVerifier!);
      setStep('code');
    } catch (err: any) {
      console.error('Recaptcha init or sign in failed:', err);
      
      // On auth failure, clear and re-initialize the verifier
      initRecaptcha();

      let errorMessage = err.message || 'Failed to send code';
      if (err.code === 'auth/operation-not-allowed') {
        errorMessage = 'Phone Authentication is not enabled in the Firebase Console. Please enable it under Authentication > Sign-in method.';
      } else if (err.message?.includes('already been rendered')) {
        errorMessage = 'reCAPTCHA error. Please refresh the page and try again.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await verifyCode(verificationCode);
    } catch (err: any) {
      setError(err.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-white rounded-3xl border border-gray-100 shadow-xl mt-12">
      <div className="text-center mb-8">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl italic mx-auto mb-4"
          style={{ backgroundColor: config.theme.primary }}
        >
          {t(config.name).charAt(0)}
        </div>
        <h2 className="text-2xl font-bold">{t({ en: 'Sign In', ar: 'تسجيل الدخول' })}</h2>
        <p className="text-gray-400 text-sm mt-2">{t(config.description)}</p>
      </div>

      <div id="recaptcha-container" className="flex justify-center mb-6 overflow-hidden rounded-xl"></div>
      {step === 'phone' ? (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase text-gray-400 block mb-2">{t({ en: 'Phone Number', ar: 'رقم الهاتف' })}</label>
            <input 
              type="tel" 
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+968 0000 0000"
              className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black transition-all"
            />
          </div>
          {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all disabled:opacity-50"
          >
            {loading ? t({ en: 'Sending...', ar: 'جاري الإرسال...' }) : t({ en: 'Send Verification Code', ar: 'إرسال رمز التحقق' })}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase text-gray-400 block mb-2">{t({ en: 'Verification Code', ar: 'رمز التحقق' })}</label>
            <input 
              type="text" 
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="000000"
              className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black transition-all text-center tracking-[1em] font-bold"
            />
          </div>
          {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all disabled:opacity-50"
          >
            {loading ? t({ en: 'Verifying...', ar: 'جاري التحقق...' }) : t({ en: 'Verify & Login', ar: 'التحقق وتسجيل الدخول' })}
          </button>
          <button 
            type="button"
            onClick={() => setStep('phone')}
            className="w-full py-2 text-gray-400 text-xs font-bold hover:text-black transition-all"
          >
            {t({ en: 'Change Phone Number', ar: 'تغيير رقم الهاتف' })}
          </button>
        </form>
      )}
    </div>
  );
};
