// client/src/Dashboard/DashboardNavbar.jsx

import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from '../context/AuthContext';
import { FaBell, FaEnvelope, FaChevronDown } from "react-icons/fa";
import { toast } from 'react-hot-toast';
import logo from '../assids/Skillswap-logo.png';

export default function DashboardNavbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout, unreadCount, unreadRequestCount } = useContext(AuthContext);
  const navigate = useNavigate();

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  const profileMenu = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "My Profile", path: "/dashboard/profile" },
    { name: "My Matches", path: "/dashboard/my-matches" },
    { name: "Schedule", path: "/dashboard/schedule" },
    { name: "Messages", path: "/dashboard/messages" },
    { name: "Achievements", path: "/dashboard/achievements" },
  ];

  const handleSearch = (e) => {
    // Check if the Enter key was pressed and the query is not empty
    if (e.key === 'Enter' && searchQuery.trim() !== '') {
      // Navigate to the search results page with the query in the URL
      navigate(`/dashboard/search?q=${searchQuery}`);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      logout();
      toast.success("Logged out successfully!");
      navigate('/');
    } catch (error) {
      console.error("Logout failed", error);
      toast.error("Logout failed.");
    }
  };

  const getUserInitials = (name) => {
    if (!name) return "";
    const nameParts = name.split(" ");
    return nameParts.length > 1
      ? `${nameParts[0][0]}${nameParts[1][0]}`
      : `${nameParts[0][0]}`;
  };

  const navLinkStyles = "block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600";

  return (
    <nav className="fixed top-0 w-full z-50 bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-2 md:px-4 py-1 md:py-2">
        <NavLink to="/">
          <img src={logo} className="h-[3.5rem] md:h-[4rem] w-auto" alt="logo" />
        </NavLink>

        <div className="flex-1 px-4">
          {/* 3. Connect the input field to the state and handler */}
          <input
            type="text"
            placeholder="Search skills, matches, messages..."
            className="border border-gray-300 rounded-lg px-4 py-2 w-full max-w-[23rem] focus:outline-none focus:ring-2 focus:ring-blue-500 mx-auto block transition"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>



        <div className="flex items-center gap-4 relative">


          <Link to="/dashboard/messages" className="relative">
            <FaEnvelope className="text-gray-700 cursor-pointer text-xl hover:text-blue-600 transition" />
            {/* 3. Add the notification badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Link>

          <Link to="/dashboard/my-matches" className="relative">
            <FaBell className="text-gray-700 cursor-pointer text-xl hover:text-blue-600 transition" />
            {unreadRequestCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {unreadRequestCount}
              </span>
            )}
          </Link>

          {user && (
            <div className="relative" ref={dropdownRef}>
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.name}
                    className="h-9 w-9 rounded-full object-cover border-2 border-gray-300 hover:border-blue-500 transition"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center border-2 border-gray-300 hover:border-blue-500 transition text-sm">
                    <span>{getUserInitials(user.name)}</span>
                  </div>
                )}

                <FaChevronDown className="text-gray-500 h-4 w-4" />
              </div>

              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-200 shadow-lg rounded-md z-50 py-1">
                  <div className="px-4 py-3 border-b">
                    <p className="font-semibold text-sm truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <div className="py-1">
                    {profileMenu.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={navLinkStyles}
                        onClick={() => setDropdownOpen(false)}
                        end={item.path === "/dashboard"}
                      >
                        {item.name}
                      </NavLink>
                    ))}

                    {user && user.role === 'admin' && (
                      <NavLink
                        to="/admin"
                        className={`${navLinkStyles} bg-gray-100 font-bold`}
                        onClick={() => setDropdownOpen(false)}
                      >
                        Admin Panel
                      </NavLink>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className={`${navLinkStyles} border-t text-red-600 font-medium`}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}