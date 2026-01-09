import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import axios from 'axios';

const PrivateRoute = () => {
  
  const [auth, setAuth] = useState(null);
  const [gmailWarning, setGmailWarning] = useState(false);

  useEffect(() => {
    axios
      .get("/api/auth/frontend-protect", {
        withCredentials: true,
      })
      .then((res) => {
        if (!res.data?.user?.gmailConnected) {
          setGmailWarning(true);
        }
        setAuth(true);
      })
      .catch(() => setAuth(false));
  }, []);

  // Loading state
  if (auth === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-500">
          Verifying your session…
        </p>
      </div>
    );
  }

  // Unauthorized
  if (!auth) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      {/* Soft warning banner */}
      {gmailWarning && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 text-sm text-amber-800">
          Your Gmail connection has expired. Please reconnect to continue
          syncing emails.
        </div>
      )}

      <Outlet />
    </>
  );
};

export default PrivateRoute;
