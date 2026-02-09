import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/auth';

const Login: React.FC = () => {
    const { loginWithGoogle, loginWithEmail, signupWithEmail } = useAuth();

    // States
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        rememberMe: localStorage.getItem('rememberMe') === 'true'
    });

    // Password Strength
    const [strength, setStrength] = useState(0);

    const calculateStrength = (pass: string) => {
        let score = 0;
        if (!pass) return 0;
        if (pass.length > 6) score += 20;
        if (pass.length > 10) score += 20;
        if (/[A-Z]/.test(pass)) score += 20;
        if (/[0-9]/.test(pass)) score += 20;
        if (/[^A-Za-z0-9]/.test(pass)) score += 20;
        return score;
    };

    useEffect(() => {
        if (!isLogin) {
            setStrength(calculateStrength(formData.password));
        }
    }, [formData.password, isLogin]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setError(null);
    };

    const validateForm = () => {
        if (!formData.email || !formData.password) {
            setError("Email e senha são obrigatórios.");
            return false;
        }
        if (!/\S+@\S+\.\S+/.test(formData.email)) {
            setError("Email inválido.");
            return false;
        }
        if (!isLogin) {
            if (!formData.name) {
                setError("Nome é obrigatório.");
                return false;
            }
            if (formData.password !== formData.confirmPassword) {
                setError("As senhas não coincidem.");
                return false;
            }
            if (formData.password.length < 6) {
                setError("A senha deve ter pelo menos 6 caracteres.");
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (isLogin) {
                await loginWithEmail(formData.email, formData.password, formData.rememberMe);
                localStorage.setItem('rememberMe', String(formData.rememberMe));
                setSuccess("Login bem-sucedido! Bem-vindo de volta.");
            } else {
                await signupWithEmail(formData.name, formData.email, formData.password);
                // Armazenar no localStorage como solicitado pelo usuário (simulação/mock)
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                users.push({ name: formData.name, email: formData.email, date: new Date().toISOString() });
                localStorage.setItem('users', JSON.stringify(users));

                setSuccess("Cadastro realizado com sucesso! Bem-vindo.");
            }
        } catch (err: any) {
            if (err.code === 'auth/user-not-found') setError("Usuário não encontrado.");
            else if (err.code === 'auth/wrong-password') setError("Senha incorreta.");
            else if (err.code === 'auth/email-already-in-use') setError("Email já está em uso.");
            else setError("Ocorreu um erro. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            await loginWithGoogle();
        } catch (err) {
            setError("Erro ao entrar com Google.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#232323] p-4 font-sans selection:bg-[#0E7C7B]/30">
            {/* Background Decorations */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#0E7C7B]/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#F39237]/10 rounded-full blur-[120px]"></div>
            </div>

            <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in duration-500">
                <div className="bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/5 shadow-2xl rounded-3xl overflow-hidden">
                    {/* Header */}
                    <div className="p-8 pb-4 text-center">
                        <div className="flex justify-center mb-6">
                            <div className="p-3 bg-gradient-to-tr from-[#0E7C7B] to-[#F39237] rounded-2xl shadow-lg shadow-[#0E7C7B]/20">
                                <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <ellipse cx="50" cy="35" rx="30" ry="35" stroke="white" strokeWidth="8" />
                                    <circle cx="50" cy="35" r="6" fill="white" />
                                    <circle cx="65" cy="45" r="20" fill="#F39237" />
                                </svg>
                            </div>
                        </div>
                        <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase mb-2">
                            {isLogin ? 'Bem-vindo' : 'Criar Conta'}
                        </h1>
                        <p className="text-slate-400 text-sm font-medium">
                            {isLogin ? 'Acesse sua conta LinkVision' : 'Junte-se à revolução dos links'}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-4">
                        {!isLogin && (
                            <div className="space-y-1">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Nome Completo</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#0E7C7B] transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    </div>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Seu nome"
                                        className="w-full bg-[#121212] border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-[#0E7C7B]/50 focus:ring-4 focus:ring-[#0E7C7B]/10 transition-all font-medium"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">E-mail</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#0E7C7B] transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="email@exemplo.com"
                                    className="w-full bg-[#121212] border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-[#0E7C7B]/50 focus:ring-4 focus:ring-[#0E7C7B]/10 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Senha</label>
                                {isLogin && (
                                    <a href="#" className="text-[10px] font-black uppercase text-[#F39237] hover:underline">Esqueci a senha?</a>
                                )}
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#0E7C7B] transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="••••••••"
                                    className="w-full bg-[#121212] border border-white/5 rounded-2xl py-3.5 pl-11 pr-12 text-white placeholder-slate-600 focus:outline-none focus:border-[#0E7C7B]/50 focus:ring-4 focus:ring-[#0E7C7B]/10 transition-all font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 12-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {!isLogin && (
                            <>
                                <div className="h-1.5 w-full bg-[#121212] rounded-full overflow-hidden flex gap-1 mt-2">
                                    <div className={`h-full transition-all duration-500 rounded-full ${strength > 0 ? strength < 50 ? 'bg-red-500' : strength < 80 ? 'bg-yellow-500' : 'bg-[#0E7C7B]' : ''}`} style={{ width: `${strength}%` }}></div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase text-slate-600">Força da senha</span>
                                    <span className={`text-[10px] font-black uppercase ${strength < 50 ? 'text-red-500' : strength < 80 ? 'text-yellow-500' : 'text-[#0E7C7B]'}`}>
                                        {strength === 0 ? 'Mínima' : strength < 50 ? 'Fraca' : strength < 80 ? 'Média' : 'Forte'}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Confirmar Senha</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#0E7C7B] transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                        </div>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            placeholder="••••••••"
                                            className="w-full bg-[#121212] border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-[#0E7C7B]/50 focus:ring-4 focus:ring-[#0E7C7B]/10 transition-all font-medium"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {isLogin && (
                            <div className="flex items-center gap-2 px-1">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            name="rememberMe"
                                            checked={formData.rememberMe}
                                            onChange={handleInputChange}
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 rounded-md border-2 transition-all ${formData.rememberMe ? 'bg-[#0E7C7B] border-[#0E7C7B]' : 'bg-[#121212] border-white/10 group-hover:border-[#0E7C7B]/50'}`}>
                                            {formData.rememberMe && (
                                                <svg className="w-full h-full text-white p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-slate-500 group-hover:text-slate-300 transition-colors">Lembrar-me</span>
                                </label>
                            </div>
                        )}

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-[10px] font-bold uppercase tracking-widest text-center animate-in slide-in-from-top-2">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-3 bg-[#0E7C7B]/10 border border-[#0E7C7B]/50 rounded-xl text-[#0E7C7B] text-[10px] font-bold uppercase tracking-widest text-center animate-in slide-in-from-top-2">
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 bg-white text-black rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 hover:bg-slate-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-slate-400 border-t-black rounded-full animate-spin"></div>
                                    <span>Processando...</span>
                                </div>
                            ) : (
                                isLogin ? 'LOGIN' : 'CADASTRE-SE'
                            )}
                        </button>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/5"></div>
                            </div>
                            <div className="relative flex justify-center text-[9px] font-black uppercase tracking-[0.3em]">
                                <span className="px-4 bg-[#1a1a1a] text-slate-600">Ou continue com</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            className="w-full h-14 bg-[#121212] border border-white/5 text-white rounded-2xl flex items-center justify-center gap-3 active:scale-95 hover:bg-[#1a1a1a] transition-all group"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="text-[11px] font-black uppercase tracking-widest">Google Account</span>
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="p-8 pt-0 text-center">
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                            {isLogin ? 'Não tem uma conta?' : 'Já possui uma conta?'}
                            <button
                                onClick={() => {
                                    setIsLogin(!isLogin);
                                    setError(null);
                                    setSuccess(null);
                                }}
                                className="ml-2 text-[#0E7C7B] hover:text-[#0E7C7B]/80 transition-colors"
                            >
                                {isLogin ? 'CADASTRE-SE' : 'LOGIN'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
