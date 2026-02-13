import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, User, AlertCircle, Eye, Target } from 'lucide-react';
import { supabase } from '../services/supabase';

interface LoginPageProps {
  onLogin: (email: string) => void;
  onDemoLogin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onDemoLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (!name) {
          throw new Error('Por favor, informe seu nome completo.');
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        });

        if (signUpError) throw signUpError;

        setSuccessMessage('Cadastro realizado com sucesso! Verifique seu e-mail para confirmar a conta ou faça login.');
        setIsSignUp(false);

      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocorreu um erro. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 animate-fade-in relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10 max-w-md w-full">
        {/* Logo Card */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-orange-500/30 mb-4">
            <span className="text-white font-black text-4xl">S</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">SIGAR</h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">Sistema Integrado de Gestão e Acompanhamento Regional</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Formulário */}
          <div className="p-8">
            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold text-slate-800">
                {isSignUp ? 'Crie sua conta' : 'Bem-vindo de volta!'}
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                {isSignUp
                  ? 'Preencha os dados abaixo para se registrar.'
                  : 'Acesse sua conta para continuar.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Campo Nome - Apenas no Cadastro */}
              {isSignUp && (
                <div className="animate-fade-in">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nome Completo</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                      placeholder="Seu nome completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">E-mail Institucional</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                    placeholder="seu.nome@educacao.ma.gov.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Senha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-xl flex items-start gap-2 animate-pulse border border-red-100">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="text-emerald-600 text-sm bg-emerald-50 p-3 rounded-xl flex items-start gap-2 border border-emerald-100">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3.5 px-4 rounded-xl hover:from-orange-600 hover:to-orange-700 focus:ring-4 focus:ring-orange-200 transition flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isSignUp ? 'Criar Conta' : 'Entrar no Sistema'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {!isSignUp && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={onDemoLogin}
                  className="w-full border-2 border-slate-200 bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl hover:bg-slate-100 hover:border-slate-300 transition flex items-center justify-center gap-2"
                >
                  <Eye className="w-5 h-5" />
                  Entrar em modo de demonstração
                </button>
                <p className="text-[10px] text-slate-400 text-center mt-2">
                  Use o modo demo para testar os recursos sem credenciais.
                </p>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-slate-100 text-center space-y-3">
              {!isSignUp && (
                <div>
                  <a href="#" className="text-sm text-slate-500 hover:text-orange-600 transition">
                    Esqueceu sua senha?
                  </a>
                </div>
              )}

              <div className="text-sm text-slate-600">
                {isSignUp ? 'Já possui uma conta?' : 'Não tem uma conta?'}
                <button
                  onClick={toggleMode}
                  className="ml-1 font-bold text-orange-600 hover:text-orange-700 hover:underline transition focus:outline-none"
                >
                  {isSignUp ? 'Fazer Login' : 'Cadastre-se'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500 mt-8">
          © {new Date().getFullYear()} Secretaria Municipal de Educação. Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
};
