import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import axios from 'axios';

const PrivateRoute = () => {
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    axios.get('http://money-mirror.xyz/api/auth/frontend-protect', {
      withCredentials: true
    })
    .then((res) => {
      console.log("Hello")
      if (!res.data.user.gmailConnected) {
        alert("Your Gmail connection has expired. Please reconnect to continue syncing your emails.");
      }
      setAuth(true)
    })
    .catch(() => setAuth(false));
  }, []);

  if (auth === null) return <div className="text-white p-4">Loading...</div>;
  return auth ? <Outlet /> : <Navigate to="/" />;
};

export default PrivateRoute;
