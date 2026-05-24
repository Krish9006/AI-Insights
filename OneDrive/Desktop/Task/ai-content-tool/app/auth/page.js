"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const GitHubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);


export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!isLogin && !formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Enter a valid email";
    if (!formData.password.trim()) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Min 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    // Simulate auth delay for demo
    await new Promise((r) => setTimeout(r, 1500));

    localStorage.setItem(
      "contentbrain_user",
      JSON.stringify({ name: formData.name || "User", email: formData.email })
    );
    setIsLoading(false);
    router.push("/");
  };

  const handleSocialLogin = async (provider) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    localStorage.setItem(
      "contentbrain_user",
      JSON.stringify({ name: provider + " User", email: "user@" + provider.toLowerCase() + ".com" })
    );
    setIsLoading(false);
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated gradient background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          background: "linear-gradient(-45deg, #0f0a2e, #1a1145, #0d1b3e, #0a0f2e)",
          backgroundSize: "400% 400%",
          animation: "bgShift 12s ease infinite",
        }}
      />

      {/* Floating orbs */}
      <div
        style={{
          position: "fixed",
          top: "10%",
          left: "15%",
          width: "350px",
          height: "350px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)",
          filter: "blur(60px)",
          animation: "float1 8s ease-in-out infinite",
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "10%",
          right: "10%",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(168,85,247,0.25) 0%, transparent 70%)",
          filter: "blur(60px)",
          animation: "float2 10s ease-in-out infinite",
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          right: "30%",
          width: "250px",
          height: "250px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)",
          filter: "blur(50px)",
          animation: "float1 12s ease-in-out infinite reverse",
          zIndex: 1,
        }}
      />

      {/* Glass card */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: "440px",
          margin: "0 16px",
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "24px",
          padding: "40px 36px",
          boxShadow: "0 25px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "8px" }}>
          <div
            style={{
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              padding: "10px",
              borderRadius: "14px",
              display: "flex",
              boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
            }}
          >
            <Sparkles style={{ width: "22px", height: "22px", color: "white" }} />
          </div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "800",
              background: "linear-gradient(135deg, #818cf8, #c084fc, #60a5fa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.5px",
            }}
          >
            ContentBrain AI
          </h1>
        </div>

        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.45)", fontSize: "14px", marginBottom: "28px" }}>
          Your AI-powered content assistant
        </p>

        {/* Tab Toggle */}
        <div
          style={{
            display: "flex",
            background: "rgba(255,255,255,0.06)",
            borderRadius: "14px",
            padding: "4px",
            marginBottom: "28px",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {["Sign Up", "Log In"].map((label, i) => {
            const active = i === 0 ? !isLogin : isLogin;
            return (
              <button
                key={label}
                onClick={() => {
                  setIsLogin(i === 1);
                  setErrors({});
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "11px",
                  fontSize: "14px",
                  fontWeight: "600",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  color: active ? "#fff" : "rgba(255,255,255,0.4)",
                  background: active
                    ? "linear-gradient(135deg, rgba(99,102,241,0.6), rgba(168,85,247,0.6))"
                    : "transparent",
                  boxShadow: active ? "0 4px 15px rgba(99,102,241,0.25)" : "none",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Name field (signup only) */}
          {!isLogin && (
            <div style={{ position: "relative" }}>
              <User
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "18px",
                  height: "18px",
                  color: errors.name ? "#f87171" : "rgba(255,255,255,0.3)",
                  transition: "color 0.2s",
                }}
              />
              <input
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: "100%",
                  padding: "14px 14px 14px 44px",
                  borderRadius: "12px",
                  border: `1px solid ${errors.name ? "rgba(248,113,113,0.5)" : "rgba(255,255,255,0.1)"}`,
                  background: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  fontSize: "14px",
                  outline: "none",
                  transition: "all 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(99,102,241,0.5)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.name ? "rgba(248,113,113,0.5)" : "rgba(255,255,255,0.1)";
                  e.target.style.boxShadow = "none";
                }}
              />
              {errors.name && (
                <p style={{ fontSize: "12px", color: "#f87171", marginTop: "4px", paddingLeft: "4px" }}>{errors.name}</p>
              )}
            </div>
          )}

          {/* Email field */}
          <div style={{ position: "relative" }}>
            <Mail
              style={{
                position: "absolute",
                left: "14px",
                top: errors.email ? "calc(50% - 10px)" : "50%",
                transform: "translateY(-50%)",
                width: "18px",
                height: "18px",
                color: errors.email ? "#f87171" : "rgba(255,255,255,0.3)",
                transition: "color 0.2s",
              }}
            />
            <input
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={{
                width: "100%",
                padding: "14px 14px 14px 44px",
                borderRadius: "12px",
                border: `1px solid ${errors.email ? "rgba(248,113,113,0.5)" : "rgba(255,255,255,0.1)"}`,
                background: "rgba(255,255,255,0.05)",
                color: "#fff",
                fontSize: "14px",
                outline: "none",
                transition: "all 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "rgba(99,102,241,0.5)";
                e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.email ? "rgba(248,113,113,0.5)" : "rgba(255,255,255,0.1)";
                e.target.style.boxShadow = "none";
              }}
            />
            {errors.email && (
              <p style={{ fontSize: "12px", color: "#f87171", marginTop: "4px", paddingLeft: "4px" }}>{errors.email}</p>
            )}
          </div>

          {/* Password field */}
          <div style={{ position: "relative" }}>
            <Lock
              style={{
                position: "absolute",
                left: "14px",
                top: errors.password ? "calc(50% - 10px)" : "50%",
                transform: "translateY(-50%)",
                width: "18px",
                height: "18px",
                color: errors.password ? "#f87171" : "rgba(255,255,255,0.3)",
                transition: "color 0.2s",
              }}
            />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              style={{
                width: "100%",
                padding: "14px 44px 14px 44px",
                borderRadius: "12px",
                border: `1px solid ${errors.password ? "rgba(248,113,113,0.5)" : "rgba(255,255,255,0.1)"}`,
                background: "rgba(255,255,255,0.05)",
                color: "#fff",
                fontSize: "14px",
                outline: "none",
                transition: "all 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "rgba(99,102,241,0.5)";
                e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.password ? "rgba(248,113,113,0.5)" : "rgba(255,255,255,0.1)";
                e.target.style.boxShadow = "none";
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "14px",
                top: errors.password ? "calc(50% - 10px)" : "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px",
                display: "flex",
              }}
            >
              {showPassword ? (
                <EyeOff style={{ width: "18px", height: "18px", color: "rgba(255,255,255,0.3)" }} />
              ) : (
                <Eye style={{ width: "18px", height: "18px", color: "rgba(255,255,255,0.3)" }} />
              )}
            </button>
            {errors.password && (
              <p style={{ fontSize: "12px", color: "#f87171", marginTop: "4px", paddingLeft: "4px" }}>
                {errors.password}
              </p>
            )}
          </div>

          {/* Forgot password (login only) */}
          {isLogin && (
            <div style={{ textAlign: "right", marginTop: "-8px" }}>
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(165,148,255,0.8)",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)",
              color: "#fff",
              fontSize: "15px",
              fontWeight: "700",
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.3s",
              boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
              opacity: isLoading ? 0.7 : 1,
              marginTop: "4px",
            }}
            onMouseEnter={(e) => {
              if (!isLoading) e.target.style.boxShadow = "0 6px 30px rgba(99,102,241,0.5)";
            }}
            onMouseLeave={(e) => {
              e.target.style.boxShadow = "0 4px 20px rgba(99,102,241,0.35)";
            }}
          >
            {isLoading ? (
              <Loader2 style={{ width: "20px", height: "20px", animation: "spin 1s linear infinite" }} />
            ) : (
              <>
                {isLogin ? "Log In" : "Create Account"}
                <ArrowRight style={{ width: "18px", height: "18px" }} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            margin: "24px 0",
          }}
        >
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
          <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "1px" }}>
            or continue with
          </span>
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
        </div>

        {/* Social buttons */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => handleSocialLogin("Google")}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)",
              color: "#fff",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
            }}
          >
            <GoogleIcon />
            Google
          </button>
          <button
            onClick={() => handleSocialLogin("GitHub")}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)",
              color: "#fff",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
            }}
          >
            <GitHubIcon />
            GitHub
          </button>
        </div>

        {/* Terms */}
        {!isLogin && (
          <p
            style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.25)",
              textAlign: "center",
              marginTop: "20px",
              lineHeight: "1.5",
            }}
          >
            By creating an account, you agree to our{" "}
            <span style={{ color: "rgba(165,148,255,0.7)", cursor: "pointer" }}>Terms of Service</span> and{" "}
            <span style={{ color: "rgba(165,148,255,0.7)", cursor: "pointer" }}>Privacy Policy</span>
          </p>
        )}
      </div>

      {/* Keyframe animations */}
      <style jsx global>{`
        @keyframes bgShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -40px) scale(1.1); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-40px, 30px) scale(1.15); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input::placeholder {
          color: rgba(255,255,255,0.25);
        }
      `}</style>
    </div>
  );
}
