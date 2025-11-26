import React, { useState } from 'react';
import { APP_LOGO } from '../constants';
import { Mail, Lock, User, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';
import { User as UserType } from '../types';

interface AuthScreenProps {
  onAuthSuccess: (user: UserType) => void;
  language: 'en' | 'ar';
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess, language }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const t = {
    en: {
        welcomeBack: 'Welcome Back',
        joinMovos: 'Join MOVOS',
        loginDesc: 'Enter your details to access your library.',
        signupDesc: 'Create an account to start exploring.',
        fullName: 'Full Name',
        email: 'Email',
        password: 'Password',
        placeholderName: 'John Doe',
        placeholderEmail: 'name@example.com',
        placeholderPass: '••••••••',
        signIn: 'Sign In',
        createAccount: 'Create Account',
        noAccount: "Don't have an account?",
        hasAccount: "Already have an account?",
        signupLink: 'Sign up',
        loginLink: 'Log in',
        footer: 'By continuing, you agree to MOVOS Terms & Privacy Policy.',
        errorReqName: 'Name is required',
        errorAuthFailed: 'Authentication failed'
    },
    ar: {
        welcomeBack: 'مرحباً بعودتك',
        joinMovos: 'انضم إلى MOVOS',
        loginDesc: 'أدخل بياناتك للوصول إلى مكتبتك.',
        signupDesc: 'أنشئ حساباً للبدء في الاستكشاف.',
        fullName: 'الاسم الكامل',
        email: 'البريد الإلكتروني',
        password: 'كلمة المرور',
        placeholderName: 'الاسم هنا',
        placeholderEmail: 'name@example.com',
        placeholderPass: '••••••••',
        signIn: 'تسجيل الدخول',
        createAccount: 'إنشاء حساب',
        noAccount: "ليس لديك حساب؟",
        hasAccount: "لديك حساب بالفعل؟",
        signupLink: 'سجل الآن',
        loginLink: 'دخول',
        footer: 'بالمتابعة، أنت توافق على شروط وسياسة الخصوصية في MOVOS.',
        errorReqName: 'الاسم مطلوب',
        errorAuthFailed: 'فشلت عملية المصادقة'
    }
  };

  const text = t[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let user;
      if (isLogin) {
        user = await authService.login(formData.email, formData.password);
      } else {
        if (!formData.name) throw new Error(text.errorReqName);
        user = await authService.register(formData.name, formData.email, formData.password);
      }
      onAuthSuccess(user);
    } catch (err: any) {
      // Basic error translation mapping
      let errorMsg = err.message;
      if (errorMsg === 'Invalid email or password') errorMsg = language === 'ar' ? 'البريد أو كلمة المرور غير صحيحة' : errorMsg;
      if (errorMsg === 'Email already registered') errorMsg = language === 'ar' ? 'البريد الإلكتروني مسجل مسبقاً' : errorMsg;
      
      setError(errorMsg || text.errorAuthFailed);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F2F2F7] dark:bg-black flex items-center justify-center p-6 transition-colors duration-500" dir="ltr">
      
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-[50vh] bg-[#007AFF]/10 dark:bg-[#007AFF]/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        
        {/* Header */}
        <div className="text-center mb-10 animate-[springUp_0.8s_ease-out]">
           <img src={APP_LOGO} alt="Logo" className="w-20 h-20 mx-auto mb-4 drop-shadow-xl" />
           <h1 className="text-3xl font-extrabold text-black dark:text-white tracking-tight">
             {isLogin ? text.welcomeBack : text.joinMovos}
           </h1>
           <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
             {isLogin ? text.loginDesc : text.signupDesc}
           </p>
        </div>

        {/* Card */}
        <div className="bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border border-white/20 dark:border-white/10 p-8 rounded-[40px] shadow-float animate-[springUp_0.8s_ease-out_0.1s_both]">
           
           {error && (
             <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={18} />
                {error}
             </div>
           )}

           <form onSubmit={handleSubmit} className="space-y-4">
              
              {!isLogin && (
                <div className="space-y-1.5">
                   <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-4">{text.fullName}</label>
                   <div className="relative group">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#007AFF] transition-colors" size={20} />
                      <input 
                        type="text" 
                        required={!isLogin}
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-[#F2F2F7] dark:bg-black/50 text-black dark:text-white p-4 pl-14 rounded-3xl border border-transparent focus:border-[#007AFF]/50 focus:bg-white dark:focus:bg-black focus:ring-4 focus:ring-[#007AFF]/10 outline-none transition-all font-medium placeholder:text-gray-400"
                        placeholder={text.placeholderName}
                      />
                   </div>
                </div>
              )}

              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-4">{text.email}</label>
                 <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#007AFF] transition-colors" size={20} />
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-[#F2F2F7] dark:bg-black/50 text-black dark:text-white p-4 pl-14 rounded-3xl border border-transparent focus:border-[#007AFF]/50 focus:bg-white dark:focus:bg-black focus:ring-4 focus:ring-[#007AFF]/10 outline-none transition-all font-medium placeholder:text-gray-400"
                      placeholder={text.placeholderEmail}
                    />
                 </div>
              </div>

              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-4">{text.password}</label>
                 <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#007AFF] transition-colors" size={20} />
                    <input 
                      type="password" 
                      required
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      className="w-full bg-[#F2F2F7] dark:bg-black/50 text-black dark:text-white p-4 pl-14 rounded-3xl border border-transparent focus:border-[#007AFF]/50 focus:bg-white dark:focus:bg-black focus:ring-4 focus:ring-[#007AFF]/10 outline-none transition-all font-medium placeholder:text-gray-400"
                      placeholder={text.placeholderPass}
                    />
                 </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-[#007AFF] hover:bg-blue-600 text-white font-bold py-4 rounded-3xl shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all mt-6 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : (
                  <>
                    {isLogin ? text.signIn : text.createAccount}
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
           </form>

           <div className="mt-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {isLogin ? text.noAccount : text.hasAccount}
                <button 
                  onClick={() => { setIsLogin(!isLogin); setError(''); }}
                  className="ml-2 text-[#007AFF] font-bold hover:underline"
                >
                  {isLogin ? text.signupLink : text.loginLink}
                </button>
              </p>
           </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-xs mt-10 opacity-60">
           {text.footer}
        </p>

      </div>
    </div>
  );
};

export default AuthScreen;