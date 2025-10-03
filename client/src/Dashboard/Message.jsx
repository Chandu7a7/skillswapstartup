// client/src/Dashboard/Messages.jsx

import React, { useState, useEffect, useRef, useContext, useMemo } from "react";
import { Send, Image, Video, Paperclip, Search, Menu } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import io from "socket.io-client";
import { format, formatDistanceToNow, isToday } from 'date-fns';
import { useLocation, useNavigate } from "react-router-dom";

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { user: loggedInUser, fetchUnreadCount, onlineUsers } = useContext(AuthContext);

  
  const socket = useRef(null);
  const messagesEndRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  //----------------------------- Establish Socket.IO connection and set up listeners----------------------------------
  useEffect(() => {
    if (loggedInUser && activeChat) {
      socket.current = io("http://localhost:5000", { query: { userId: loggedInUser.id } });

      socket.current.on("newMessage", (newMessage) => {
        if (newMessage.conversationId === activeChat._id) {
          setMessages((prev) => [...prev, newMessage]);
        }
        setConversations(prev => prev.map(convo => 
            convo._id === newMessage.conversationId 
            ? { ...convo, lastMessage: newMessage.content, lastMessageAt: newMessage.createdAt } 
            : convo
        ).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)));
      });

      return () => socket.current.disconnect();
    }
  }, [loggedInUser, activeChat]);

  //------------------------------ Fetch initial conversations and set the active chat---------------------------------
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch('/api/conversations', { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
          const sortedConversations = data.data.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
          setConversations(sortedConversations);

          const conversationFromState = location.state?.activeConversation;
          if (conversationFromState) {
            const foundConvo = sortedConversations.find(c => c._id === conversationFromState._id);
            setActiveChat(foundConvo || (sortedConversations.length > 0 ? sortedConversations[0] : null));
            navigate(location.pathname, { replace: true, state: {} });
          } else if (sortedConversations.length > 0) {
            setActiveChat(sortedConversations[0]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch conversations", error);
      } finally {
        setLoading(false);
      }
    };
    if (loggedInUser) fetchConversations();
  }, [loggedInUser]); 

  //--------------------------- -- Mathc -----------------------------------
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeChat) return;
      setMessages([]);
      try {
        const res = await fetch(`/api/messages/${activeChat._id}`, { credentials: 'include' });
        const data = await res.json();
        if (data.success) setMessages(data.data);
      } catch (error) {
        console.error("Failed to fetch messages", error);
      }
    };
    fetchMessages();
  }, [activeChat]);


  //--------------------------------- Auto-scroll logic----------------------------------------------
  useEffect(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [messages]);


  //------------------------------------- Send message via socket------------------------------------
  const sendMessage = () => {
    if (!input.trim() || !socket.current || !activeChat) return;
    const receiver = activeChat.participants.find(p => p._id !== loggedInUser.id);
    if (!receiver) return;
    
    socket.current.emit("sendMessage", {
      conversationId: activeChat._id,
      senderId: loggedInUser.id,
      receiverId: receiver._id,
      content: input,
    });

    const newMsg = { senderId: loggedInUser.id, content: input, createdAt: new Date().toISOString() };
    setMessages([...messages, newMsg]);
    setInput("");
  };


  const getOtherUser = (convo) => {
    if (!convo || !convo.participants) return null;
    return convo.participants.find(p => p._id !== loggedInUser?.id);
  };
  
  //-------------------------------  Filter Conversation----------------------------------
  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations;
    return conversations.filter(c => {
      const otherUser = getOtherUser(c);
      return otherUser?.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [conversations, searchQuery]);

  //-------------------------------------handleConversationClick ------------------------------

  const handleConversationClick = async (conversation) => {
    setActiveChat(conversation);
    setSidebarOpen(false);

    const userUnreadCount = conversation.unreadCounts[loggedInUser.id] || 0;

    if (userUnreadCount > 0) {
      try {
        await fetch(`/api/conversations/${conversation._id}/read`, {
          method: 'PUT',
          credentials: 'include'
        });
        
        fetchUnreadCount();

      } catch (error) {
        console.error("Failed to mark conversation as read", error);
      }
    }
  };


  if (loading) return <div className="p-8 text-center text-gray-500">Loading conversations...</div>;
  
  return (
    <div className="flex h-[calc(100vh_-_8rem)] bg-white pt-12 rounded-lg overflow-hidden border">
      {/* Sidebar */}
     <div className={`border-r flex flex-col transition-transform duration-300 ease-in-out w-full md:w-1/3 lg:w-1/4 md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0 absolute z-20 bg-white' : '-translate-x-full absolute'}`}>
        <div className="p-4 border-b flex items-center bg-gray-50 gap-2">
          <Search className="text-gray-400" size={20} />
          <input type="text" placeholder="Search conversations..." className="w-full text-sm bg-transparent focus:outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredConversations.map(c => {
            const otherUser = getOtherUser(c);
            if (!otherUser) return null;

            // This line now works correctly
            const isOnline = onlineUsers.includes(otherUser._id);
            const unreadCount = c.unreadCounts[loggedInUser.id] || 0;

            return (
              <div key={c._id} onClick={() => handleConversationClick(c)} className={`p-3 cursor-pointer rounded-lg transition flex items-center gap-3 ${activeChat?._id === c._id ? "bg-blue-100" : "hover:bg-gray-100"}`}>
                <div className="relative">
                  <img src={otherUser.profilePicture || `https://ui-avatars.com/api/?name=${otherUser.name}`} alt={otherUser.name} className="w-12 h-12 rounded-full object-cover" />
                  {/* The green dot will now appear correctly */}
                  {/* {isOnline && <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></span>} */}
                </div>
                <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center">
                        <h4 className={`font-semibold text-sm truncate ${unreadCount > 0 ? 'font-bold' : ''}`}>{otherUser.name}</h4>
                        {c.lastMessageAt && <span className="text-xs text-gray-500 flex-shrink-0">{formatDistanceToNow(new Date(c.lastMessageAt), { addSuffix: true })}</span>}
                    </div>
                    <p className={`text-sm truncate ${unreadCount > 0 ? 'text-gray-800 font-semibold' : 'text-gray-600'}`}>{c.lastMessage}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col bg-gray-50 relative">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-2 bg-blue-600 text-white rounded-full shadow absolute top-3 left-3 z-30"><Menu size={20} /></button>
        {activeChat ? (
          <>
            <div className="p-4 border-b bg-white flex items-center justify-center sm:justify-between shadow-sm">
                <h3 className="font-bold text-lg text-gray-800">{getOtherUser(activeChat)?.name}</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((m) => {
                  const isSender = m.senderId?._id === loggedInUser.id || m.senderId === loggedInUser.id;
                  return (
                      <div key={m._id || new Date(m.createdAt).toISOString()} className={`flex ${isSender ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-md lg:max-w-lg px-4 py-2 rounded-2xl shadow break-words ${isSender ? "bg-blue-600 text-white rounded-br-none" : "bg-white text-gray-800 rounded-bl-none border"}`}>
                              <p className="text-sm">{m.content}</p>
                              {m.createdAt && <span className="text-xs opacity-70 block text-right mt-1">{format(new Date(m.createdAt), isToday(new Date(m.createdAt)) ? 'p' : 'MMM d, p')}</span>}
                          </div>
                      </div>
                  );
              })}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t bg-white flex items-center gap-2">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" onKeyDown={(e) => e.key === "Enter" && sendMessage()} />
              <button onClick={sendMessage} className="bg-blue-600 text-white p-3 rounded-full shadow hover:bg-blue-700 transition"><Send size={18} /></button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center text-gray-500">
            <div>
              <h2 className="text-xl font-semibold">Select a conversation</h2>
              <p>Start chatting with your skill swap partners.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}