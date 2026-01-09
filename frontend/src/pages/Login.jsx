import React from "react";
import loginImage from "../assets/moneymirror-image.png";

function Login() {
  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">

      {/* Background Image */}
      <img
        src={loginImage}
        alt="MoneyMirror"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-l from-slate-900/90 via-slate-900/60 to-slate-900/40" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-end px-10 md:px-24 text-white">

        {/* RIGHT CONTENT BLOCK */}
        <div className="max-w-xl text-right">

          {/* Brand */}
          <p className="text-white/80 mb-6 text-sm font-medium">
            MoneyMirror
          </p>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl font-semibold leading-tight mb-6">
            Understand your money.
            <br />
            Clearly.
          </h1>

          {/* Subtext */}
          <p className="text-white/75 text-lg mb-10">
            Financial insights, subscriptions, and spending —
            all in one secure place.
          </p>

          {/* Login Button */}
          <div className="flex justify-end">
            <button
              onClick={handleGoogleLogin}
              className="inline-flex items-center justify-center px-8 py-4 rounded-md
                         bg-white text-slate-900 font-semibold text-lg
                         hover:bg-slate-100 transition shadow-lg"
            >
              Continue with Google
            </button>
          </div>

          {/* Trust */}
          <p className="mt-6 text-sm text-white/60">
            Secured with OAuth 2.0 · No passwords stored
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-0 right-0 text-center text-xs text-white/50">
        © {new Date().getFullYear()} MoneyMirror
      </div>
    </div>
  );
}

export default Login;
