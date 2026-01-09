import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { User, ChevronDown, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const Navbar = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const navItems = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/insights", label: "Insights" },
    { path: "/ai", label: "AI Insights" },
  ];

  const handleLogout = async () => {
    try {
      await axios.post(
        "/api/auth/logout",
        { withCredentials: true }
      );
      navigate("/");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  // close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="w-full bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="h-16 flex items-center justify-between">

          {/* Brand */}
          <div
            onClick={() => navigate("/dashboard")}
            className="text-lg font-semibold text-slate-900 cursor-pointer"
          >
            MoneyMirror
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-8">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`text-sm font-medium transition ${
                    active
                      ? "text-slate-900"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-100 transition"
            >
              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-slate-600" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-slate-900">
                  {user.name}
                </p>
                <p className="text-xs text-slate-500">
                  {user.email}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-100"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default Navbar;
