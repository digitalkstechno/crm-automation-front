'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { baseUrl, setAuthToken } from '../config';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: result } = await axios.post(`${baseUrl.userLogin}`, {
        email,
        password,
      });

      if (result.status === 'Success') {
        setAuthToken(result.token);
        toast.success(result.message || 'Login successful');
        router.push('/');
      } else {
        toast.error(result.message || 'Login failed');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        'Something went wrong'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#14223e] via-[#0f172a] to-[#14223e]">
      <div className="relative w-full max-w-md rounded-2xl bg-[#1b2638] backdrop-blur-md p-8 shadow-2xl border border-[#495160]">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">CRM DEMO</h1>
          <p className="mt-2 text-sm text-gray-300">Sign in to continue to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-200">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-600 bg-[#0f172a] py-3 pl-10 pr-4 text-white placeholder-gray-400 outline-none transition focus:border-[#5b77f1] focus:ring-2 focus:ring-[#5b77f1]/50"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-200">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-gray-600 bg-[#0f172a] py-3 pl-10 pr-10 text-white placeholder-gray-400 outline-none transition focus:border-[#5b77f1] focus:ring-2 focus:ring-[#5b77f1]/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-[#5b77f1] to-[#9f7cff] py-3 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
            style={{
              boxShadow: '0 10px 20px rgba(91, 119, 241, 0.5), 0 5px 10px rgba(159, 124, 255, 0.4)',
            }}
          >
            {loading ? 'Signing in...' : 'SIGN IN'}
          </button>
        </form>
      </div>
    </div>
  );
}