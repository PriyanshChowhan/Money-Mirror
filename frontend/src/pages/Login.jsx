// import React, { useState } from 'react';

// function Login() {
//   const [isLogin, setIsLogin] = useState(false);
//   const handleGoogleLogin = () => {
//     window.location.href = 'http://money-mirror.xyz/api/auth/google'; 
    
//   };

//   return (
//     <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">

//       {/* Background Decorative SVG Pattern */}
//       <div className="absolute inset-0 z-0 pointer-events-none">
//         <svg className="w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
//           <defs>
//             <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
//               <circle cx="20" cy="20" r="1.5" fill="white" />
//             </pattern>
//           </defs>
//           <rect width="100%" height="100%" fill="url(#grid)" />
//         </svg>

//         {/* Animated gradient blobs */}
//         <div className="absolute w-96 h-96 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full blur-3xl opacity-20 top-0 left-0 animate-pulse"></div>
//         <div className="absolute w-64 h-64 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-2xl opacity-20 bottom-0 right-0 animate-bounce"></div>
//       </div>

//       {/* Foreground Card */}
//       <div className="relative z-10 bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex overflow-hidden backdrop-blur-sm">
        
//         {/* Left side */}
//         <div className="w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 relative flex items-center justify-center p-8">
//           <div className="absolute w-96 h-96 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-3xl opacity-30 animate-pulse"></div>
//           <div className="absolute w-64 h-64 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-2xl opacity-20 animate-bounce"></div>

//           <div className="relative z-10 text-center text-white">
//             <div className="mb-8">
//               <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
//                 <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
//                 </svg>
//               </div>
//               <h3 className="text-3xl font-bold mb-4">Take Control of Your Finances</h3>
//               <p className="text-lg text-white/80 leading-relaxed">
//                 Smart budgeting, expense tracking, and financial insights all in one secure platform.
//               </p>
//             </div>

//             <div className="flex flex-wrap gap-2 justify-center">
//               <span className="px-3 py-1 bg-white/20 rounded-full text-sm backdrop-blur-sm">Analytics</span>
//               <span className="px-3 py-1 bg-white/20 rounded-full text-sm backdrop-blur-sm">Secure</span>
//             </div>
//           </div>
//         </div>

//         {/* Right side */}
//         <div className="w-1/2 p-12 flex flex-col items-center justify-center">
//           <div className="w-full max-w-sm">
//             <div className="text-center mb-10">
//               <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
//                 <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
//                 </svg>
//               </div>
//               <h2 className="text-3xl font-bold text-gray-900 mb-2">
//                 {isLogin ? 'Welcome Back' : 'Get Started'}
//               </h2>
//               <p className="text-gray-500 text-lg">
//                 {isLogin ? 'Sign in to your financial dashboard' : 'Create your account to start managing your finances'}
//               </p>
//             </div>

//             <button
//               onClick={handleGoogleLogin}
//               className="w-full flex items-center justify-center gap-3 px-6 py-4 border-2 border-gray-200 rounded-xl shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-200 text-gray-700 font-medium text-lg group">
//               <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
//                 <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
//                 <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
//                 <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
//                 <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
//               </svg>
//               {isLogin ? 'Continue with Google' : 'Sign up with Google'}
//             </button>

//             <div className="mt-8 text-center">
//               <p className="text-gray-600 mb-3">
//                 {isLogin ? "Don't have an account?" : "Already have an account?"}
//               </p>
//               <button 
//                 onClick={() => setIsLogin(!isLogin)}
//                 className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline transition-colors"
//               >
//                 {isLogin ? 'Create account' : 'Sign in instead'}
//               </button>
//             </div>

//             <div className="mt-8 pt-6 border-t border-gray-100">
//               <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
//                 <div className="flex items-center gap-2">
//                   <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//                   </svg>
//                   <span>Bank-level security</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
//                   </svg>
//                   <span>256-bit encryption</span>
//                 </div>
//               </div>
//             </div>

//             <p className="text-xs text-gray-400 mt-6 text-center">
//               By {isLogin ? 'signing in' : 'creating an account'}, you agree to our Terms of Service and Privacy Policy
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Login;

import React, { useState } from 'react';

function Login() {
  const [isLogin, setIsLogin] = useState(false);
  const handleGoogleLogin = () => {
    window.location.href = 'http://money-mirror.xyz/api/auth/google'; 
    
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">

      {/* Background Decorative SVG Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <svg className="w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Animated gradient blobs */}
        <div className="absolute w-96 h-96 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full blur-3xl opacity-20 top-0 left-0 animate-pulse"></div>
        <div className="absolute w-64 h-64 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-2xl opacity-20 bottom-0 right-0 animate-bounce"></div>
      </div>

      {/* Foreground Card */}
      <div className="relative z-10 bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex overflow-hidden backdrop-blur-sm">
        
        {/* Left side */}
        <div className="w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 relative flex items-center justify-center p-8">
          <div className="absolute w-96 h-96 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute w-64 h-64 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-2xl opacity-20 animate-bounce"></div>

          <div className="relative z-10 text-center text-white">
            {/* Brand Name - Center Top */}
            <div className="mb-8">
              <div className="flex items-center justify-center gap-4 text-white group">
                <div className="flex flex-col items-start">
                  <span className="text-6xl font-black tracking-tighter leading-none" style={{fontFamily: 'system-ui, -apple-system, sans-serif', textShadow: '0 3px 6px rgba(0,0,0,0.4)'}}>
                    MONEY
                  </span>
                  <span className="text-4xl font-light tracking-widest leading-none opacity-90" style={{fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '0.25em'}}>
                     MIRROR
                  </span>
                </div>
              </div>
            </div>
            <div className="mb-8">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-3xl font-bold mb-4">Take Control of Your Finances</h3>
              <p className="text-lg text-white/80 leading-relaxed">
                Smart budgeting, expense tracking, and financial insights all in one secure platform.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm backdrop-blur-sm">Analytics</span>
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm backdrop-blur-sm">Secure</span>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="w-1/2 p-12 flex flex-col items-center justify-center">
          <div className="w-full max-w-sm">
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {isLogin ? 'Welcome Back' : 'Get Started'}
              </h2>
              <p className="text-gray-500 text-lg">
                {isLogin ? 'Sign in to your financial dashboard' : 'Create your account to start managing your finances'}
              </p>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 border-2 border-gray-200 rounded-xl shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-200 text-gray-700 font-medium text-lg group">
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isLogin ? 'Continue with Google' : 'Sign up with Google'}
            </button>

            <div className="mt-8 text-center">
              <p className="text-gray-600 mb-3">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
              </p>
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline transition-colors"
              >
                {isLogin ? 'Create account' : 'Sign in instead'}
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Bank-level security</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-6 text-center">
              By {isLogin ? 'signing in' : 'creating an account'}, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;