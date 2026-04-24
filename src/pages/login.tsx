'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, TrendingUp, Users, CheckCircle } from 'lucide-react';
import { baseUrl, setAuthToken } from '../config';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useFormik } from 'formik';
import * as Yup from 'yup';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validationSchema = Yup.object({
    email: Yup.string().email('Invalid email address').required('Email is required'),
    password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  });

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const { data: result } = await axios.post(`${baseUrl.userLogin}`, {
          email: values.email,
          password: values.password,
        });
        if (result.status === 'Success') {
          setAuthToken(result.token);
          toast.success(result.message || 'Login successful');
          router.push('/');
        } else {
          toast.error(result.message || 'Login failed');
        }
      } catch (error: any) {
        toast.error(error?.response?.data?.message || error?.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="min-h-screen flex" style={{ background: '#f9f6f0' }}>

      {/* Left Panel — Branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: '#1a1a1a' }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-10" style={{ background: '#C5A059' }} />
          <div className="absolute -bottom-32 -right-16 w-80 h-80 rounded-full opacity-8" style={{ background: '#C5A059' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-5" style={{ background: '#C5A059' }} />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-lg"
            style={{ background: 'linear-gradient(135deg, #C5A059, #a8843a)' }}
          >
            LF
          </div>
          <span className="text-xl font-semibold" style={{ color: '#C5A059' }}>LeadFlow</span>
        </div>

        {/* Center Content */}
        <div className="relative space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Manage your leads<br />
              <span style={{ color: '#C5A059' }}>smarter & faster</span>
            </h2>
            <p className="text-gray-400 text-base leading-relaxed">
              A powerful CRM platform to track, manage, and convert your leads with ease.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: TrendingUp, text: 'Track leads across every stage' },
              { icon: Users, text: 'Collaborate with your team in real-time' },
              { icon: CheckCircle, text: 'Never miss a follow-up again' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(197,160,89,0.15)' }}>
                  <Icon className="w-4 h-4" style={{ color: '#C5A059' }} />
                </div>
                <span className="text-gray-300 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative">
          <p className="text-gray-600 text-xs">© 2026 Digitalks Techno LLP. All rights reserved.</p>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">

          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-3 mb-10 justify-center">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm"
              style={{ background: 'linear-gradient(135deg, #C5A059, #a8843a)' }}
            >
              LF
            </div>
            <span className="text-xl font-semibold" style={{ color: '#C5A059' }}>LeadFlow</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
            <p className="text-sm text-gray-500">Sign in to your account to continue</p>
          </div>

          <form onSubmit={formik.handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border bg-white text-gray-900 text-sm outline-none transition-all"
                  style={{
                    borderColor: formik.touched.email && formik.errors.email ? '#ef4444' : '#e5e7eb',
                    boxShadow: formik.touched.email && formik.errors.email ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#C5A059'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(197,160,89,0.15)'; }}
                />
              </div>
              {formik.touched.email && formik.errors.email && (
                <p className="mt-1.5 text-xs text-red-500">{formik.errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border bg-white text-gray-900 text-sm outline-none transition-all"
                  style={{
                    borderColor: formik.touched.password && formik.errors.password ? '#ef4444' : '#e5e7eb',
                    boxShadow: formik.touched.password && formik.errors.password ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#C5A059'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(197,160,89,0.15)'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                  style={{ background: 'transparent' }}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formik.touched.password && formik.errors.password && (
                <p className="mt-1.5 text-xs text-red-500">{formik.errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              style={{ background: loading ? '#a8843a' : 'linear-gradient(135deg, #C5A059, #a8843a)', boxShadow: '0 4px 14px rgba(197,160,89,0.35)' }}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
