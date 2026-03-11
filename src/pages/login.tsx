'use client';

import { useState } from "react";
import { useRouter } from "next/router";
import { Eye, EyeOff, Lock, Mail, Sparkles } from "lucide-react";
import { Geist } from "next/font/google";
import { baseUrl } from "../../config";
import axios from "axios";
import toast from "react-hot-toast";
import { clearUserCache } from "@/utils/tokenHelper";
import Link from "next/link";

const geistSans = Geist({
  subsets: ["latin"],
});

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError("Email is required");
      return false;
    }
    if (!emailRegex.test(value)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError("Password is required");
      return false;
    }
    if (value.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(baseUrl.LOGIN, {
        email,
        password,
      });

      const data = response.data;

      clearUserCache();
      localStorage.setItem("token", data.token);
      localStorage.setItem("refreshToken", data.refreshToken);

      toast.success("Login successful!");

      // Fetch user data to determine redirect
      const userResponse = await axios.get(baseUrl.STAFF + "/me", {
        headers: { Authorization: `Bearer ${data.token}` }
      });

      const userData = userResponse.data.data;

      // Determine first available route
      let redirectPath = "/";
      if (!userData.canAccessDashboard) {
        if (userData.canAccessAccountMaster) {
          redirectPath = "/account-master";
        } else if (userData.permissions && userData.permissions.length > 0) {
          redirectPath = "/leads";
        } else if (userData.canAccessSettings) {
          redirectPath = "/settings/role";
        }
      }

      setTimeout(() => {
        router.push(redirectPath);
      }, 800);

    } catch (err: any) {
      toast.error("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className={`${geistSans.className} flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-8`}>
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex flex-col justify-center bg-white px-8 py-12 sm:px-12">
          <div className="mb-10 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600">
              <Lock className="h-4 w-4" />
              Secure Login
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-2">
              MOZU CRM
            </h1>
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">
              Welcome Back!
            </h2>
            <p className="text-sm text-slate-600">
              Sign in to access your CRM dashboard and manage your leads.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email Address
              </label>
              <div className="group relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600" />
                <input
                  type="email"
                  className={`w-full rounded-xl border-2 ${emailError ? 'border-red-500' : 'border-slate-200'} bg-slate-50 py-3.5 pl-12 pr-4 text-slate-900 transition-all placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 ${emailError ? 'focus:ring-red-100' : 'focus:ring-indigo-100'}`}
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) validateEmail(e.target.value);
                  }}
                  onBlur={(e) => validateEmail(e.target.value)}
                  required
                />
              </div>
              {emailError && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {emailError}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="group relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600" />
                <input
                  type={showPassword ? "text" : "password"}
                  className={`w-full rounded-xl border-2 ${passwordError ? 'border-red-500' : 'border-slate-200'} bg-slate-50 py-3.5 pl-12 pr-12 text-slate-900 transition-all placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 ${passwordError ? 'focus:ring-red-100' : 'focus:ring-indigo-100'}`}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) validatePassword(e.target.value);
                  }}
                  onBlur={(e) => validatePassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {passwordError && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {passwordError}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-xl hover:shadow-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="relative z-10">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </span>
              <div className="absolute inset-0 -z-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 transition-opacity group-hover:opacity-100"></div>
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              © 2026 <Link href={"https://digitalkstechno.com"} target="_blank" style={{
                color: "#2F55FA",
                fontWeight: 600,
              }}>Digitalks.</Link> All rights reserved.
            </p>
            <p className="text-sm text-slate-500">
              Designed & Developed with <span className="text-red-500 animate-pulse">❤️</span> by Digitalks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
