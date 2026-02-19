import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { post } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import { ShieldCheck, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [mfaStep, setMfaStep] = useState(false);
  const [userId, setUserId] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [error, setError] = useState("");

  const login = useMutation({
    mutationFn: () => post<any>("/auth/login", { email, password }),
    onSuccess: (data) => {
      if (data.requiresMfa) { setUserId(data.userId); setMfaStep(true); }
      else { setAuth(data.user, data.accessToken, data.refreshToken); navigate("/dashboard"); }
    },
    onError: (err: any) => setError(err.response?.data?.error?.message ?? "Login failed"),
  });

  const verify2fa = useMutation({
    mutationFn: () => post<any>("/auth/login/2fa", { userId, token: mfaToken }),
    onSuccess: (data) => { setAuth(data.user, data.accessToken, data.refreshToken); navigate("/dashboard"); },
    onError: (err: any) => setError(err.response?.data?.error?.message ?? "Invalid code"),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur mb-4">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">ChexPro</h1>
          <p className="text-blue-200 mt-1">Client Portal</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{mfaStep ? "Two-Factor Authentication" : "Sign in to your account"}</h2>

          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

          {!mfaStep ? (
            <form onSubmit={(e) => { e.preventDefault(); setError(""); login.mutate(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="you@company.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">Forgot password?</Link>
              </div>
              <button type="submit" disabled={login.isPending}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2">
                {login.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {login.isPending ? "Signing in..." : "Sign In"}
              </button>
            </form>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setError(""); verify2fa.mutate(); }} className="space-y-4">
              <p className="text-sm text-gray-600">Enter the 6-digit code from your authenticator app.</p>
              <input type="text" value={mfaToken} onChange={e => setMfaToken(e.target.value)} required maxLength={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="000000" />
              <button type="submit" disabled={verify2fa.isPending}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2">
                {verify2fa.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Verify
              </button>
              <button type="button" onClick={() => { setMfaStep(false); setError(""); }} className="w-full text-sm text-gray-500 hover:text-gray-700">← Back to login</button>
            </form>
          )}
        </div>

        <p className="text-center text-blue-200 text-xs mt-6">© {new Date().getFullYear()} ChexPro. All rights reserved.</p>
      </div>
    </div>
  );
}
