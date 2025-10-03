import React, { useState, useContext, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import DashboardNavbar from '../Dashboard/DashboardNavbar';
import { Toaster } from 'react-hot-toast'; 
import { AuthContext } from '../context/AuthContext';
import io from "socket.io-client";
import { toast } from 'react-hot-toast';
import Chatbot from '../components/Chatbot'; // 1. Make sure Chatbot is imported
import { MessageCircle } from 'lucide-react'; // 2. Make sure the icon is imported

function DashboardLayout() {
    const { user, fetchUnreadRequestCount, fetchUnreadCount ,setOnlineUsers } = useContext(AuthContext);

    // 3. Add state to show/hide the chatbot
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);

    // This useEffect for real-time notifications is perfect
    useEffect(() => {
        if (user) {
            const socket = io("http://localhost:5000", { query: { userId: user.id } });
            
            socket.on("newSwapRequest", (data) => {
                toast.success(data.message || "You have a new swap request!");
                fetchUnreadRequestCount();
            });

            socket.on("notification", () => {
                fetchUnreadCount();
            });

             socket.on("getOnlineUsers", (onlineUserIds) => {
                setOnlineUsers(onlineUserIds);
            });

            return () => socket.disconnect();
        }
    }, [user, fetchUnreadRequestCount, fetchUnreadCount,setOnlineUsers]);
    
    return (
        // Add 'relative' to the parent div to position the floating button correctly
        <div className="flex min-h-screen bg-gray-50 relative">
            <Toaster position="top-center" reverseOrder={false} />

            <DashboardNavbar />
            
            <main className="flex-grow pt-20 px-4 sm:px-6 lg:px-8">
                <Outlet />
            </main>

            {/* --- THIS IS THE CHATBOT LOGIC --- */}
            
            {/* 4. Conditionally render the Chatbot component */}
            {isChatbotOpen && <Chatbot />}

            {/* 5. The floating button to open and close the chatbot */}
            <button
                onClick={() => setIsChatbotOpen(!isChatbotOpen)}
                className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition transform hover:scale-110 z-40"
                title="Toggle AI Assistant"
            >
                <MessageCircle size={24} />
            </button>
        </div>
    );
}

export default DashboardLayout;