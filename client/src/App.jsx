// client/src/App.jsx

import React from "react";
import { Routes, Route } from "react-router-dom";

// Import Layouts
import MainLayout from "./layouts/MainLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// Import Public Pages
import Home from "./pages/Home";
import AboutUs from "./components/AboutUs";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import ProcessFlow from "./components/ProcessFlow";
import UserProfilePage from './pages/UserProfilePage'; 

// Import Dashboard Pages
import DashboardWelcome from "./Dashboard/DashboardWelcome";
import BrowseSkills from "./Dashboard/BrowseSkills";
import MyMatches from "./Dashboard/MyMatches";
import Messages from "./Dashboard/Message";
import Achievements from "./Dashboard/Achievements";
import Schedule from "./Dashboard/Schedule";
import ProfilePage from './pages/ProfilePage'; 
import SwapDetailsPage from './Dashboard/SwapDetailsPage';
import SearchResultsPage from './Dashboard/SearchResultsPage';
import AdminRoute from './components/AdminRoute';
import AdminDashboard from './admin/AdminDashboard';

function App() {
  return (
    <Routes>
      {/* --- Main Public Site Layout --- */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="about-us" element={<AboutUs />} />
        <Route path="features" element={<Features />} />
        <Route path="how-it-works" element={<HowItWorks />} />
        <Route path="process-flow" element={<ProcessFlow />} />
        
        {/* NEW: The public user profile page is part of the main site */}
        <Route path="users/:userId" element={<UserProfilePage />} />
      </Route>

      {/* --- Protected Dashboard Layout --- */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardWelcome />} />
          <Route path="browse-skills" element={<BrowseSkills />} />
          <Route path="my-matches" element={<MyMatches />} />
           <Route path="search" element={<SearchResultsPage />} />
          <Route path="profile" element={<ProfilePage />} /> 
          <Route path="messages" element={<Messages />} />
          <Route path="swaps/:swapId" element={<SwapDetailsPage />} />
          <Route path="achievements" element={<Achievements />} /> {/* Fixed typo */}
          <Route path="schedule" element={<Schedule />} />
        </Route>
      </Route>
       {/* --- NEW: Protected ADMIN Dashboard Routes --- */}
      <Route element={<AdminRoute />}>
        {/* You can create an <AdminLayout /> if you want a different sidebar */}
        <Route path="/admin" element={<AdminDashboard />} />
        {/* Add other admin pages here, e.g., /admin/users */}
      </Route>
      <Route path="*" element={<h1 className="text-center pt-20">404: Page Not Found</h1>} />
    </Routes>
  );
}

export default App;