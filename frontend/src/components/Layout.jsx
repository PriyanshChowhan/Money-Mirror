// components/Layout.jsx
import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import { Outlet } from 'react-router-dom';
import axios from 'axios';

const Layout = () => {
  
  const [user, setUser] = useState({ name: 'User', email: '' });

  useEffect(() => {
    axios.get("/api/auth/profile", {
      withCredentials: true
    })
    .then((res) => {
      setUser({ name: res.data.name, email: res.data.email });
    })
    .catch((err) => {
      console.error('Error fetching user:', err);
    });
  }, []);

  return (
    <>
      <Navbar user={user} />
      <Outlet context={{ user }} />
    </>
  );
};

export default Layout;
