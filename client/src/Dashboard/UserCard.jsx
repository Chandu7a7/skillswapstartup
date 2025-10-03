// client/src/Dashboard/UserCard.jsx

import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import {  FaMapMarkerAlt, FaGithub, FaLinkedin } from "react-icons/fa";
import { AuthContext } from '../context/AuthContext';


export default function UserCard({ user, onOpenModal }) {
  
   const { onlineUsers } = useContext(AuthContext);
   const isOnline = onlineUsers.includes(user.id);


  return (
    <div className="bg-white text-gray-800 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 flex flex-col h-full hover:-translate-y-1">
      <div className="flex-grow">
        {/* User Info Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <Link to={`/users/${user.id}`} className="flex items-center gap-3 group">
            <img 
              src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
              alt={user.name} 
              className="w-12 h-12 rounded-full object-cover border-2 border-blue-200 group-hover:ring-2 group-hover:ring-blue-400 transition"
            />
            <div>
              <h2 className="font-semibold text-lg group-hover:text-blue-600 transition">{user.name}</h2>
              <p className="flex items-center text-sm text-gray-500">
                <FaMapMarkerAlt className="mr-1 text-blue-500" /> {user.location || 'Not specified'}
              </p>
            </div>
          </Link>
          {/* Social links are the same */}
          <div className="flex gap-3 text-gray-500 flex-shrink-0 mt-1">
            {user.github && ( <a href={user.github} /* ... */><FaGithub className="h-5 w-5" /></a> )}
            {user.linkedin && ( <a href={user.linkedin} /* ... */><FaLinkedin className="h-5 w-5" /></a> )}
          </div>
        </div>

        {/* Rating is the same */}
        <p className="flex items-center text-sm mb-4">
          {/* ... */}
        </p>

        {/* Skills Offered */}
        <div className="mb-3">
          <p className="font-semibold text-gray-700 text-sm">Skills Offered</p>
          <div className="flex flex-wrap gap-2 mt-1">
            {/* 4. UPDATED: Better UI for when the array is empty */}
            {user.skillsOffered && user.skillsOffered.length > 0 ? (
              user.skillsOffered.map((skill) => (
                <span key={skill} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">{skill}</span>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic">No skills offered yet.</p>
            )}
          </div>
        </div>

        {/* Skills Wanted */}
        <div className="mb-3">
          <p className="font-semibold text-gray-700 text-sm">Skills Wanted</p>
          <div className="flex flex-wrap gap-2 mt-1">
            {user.skillsWanted && user.skillsWanted.length > 0 ? (
              user.skillsWanted.map((skill) => (
                <span key={skill} className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-xs font-medium">{skill}</span>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic">No skills wanted yet.</p>
            )}
          </div>
        </div>

      </div>

      <button
        className="w-full mt-4 bg-blue-600 text-white font-semibold py-2 rounded-lg shadow hover:bg-blue-700 transition"
        onClick={() => onOpenModal(user)}
      >
        Request Skill Swap
      </button>
    </div>
  );
}