// client/src/pages/UserProfilePage.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaStar, FaMapMarkerAlt, FaGithub, FaLinkedin } from "react-icons/fa";
import { format } from 'date-fns'; 

const ReviewCard = ({ review }) => (
    <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
                <FaUserCircle className="text-gray-400" />
                <p className="font-semibold text-gray-800">{review.reviewerName}</p>
            </div>
            <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                    <FaStar key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'} />
                ))}
            </div>
        </div>
        {review.comment && <p className="text-gray-600 text-sm mb-2 italic">"{review.comment}"</p>}
        <p className="text-xs text-gray-400 text-right">{format(new Date(review.createdAt), 'PPP')}</p>
    </div>
);

export default function UserProfilePage() {
  const { userId } = useParams(); 
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/users/${userId}`); 
        const data = await res.json();
        if (data.success) {
          setUser(data.data);
        } else {
          throw new Error(data.message || 'Failed to fetch user data');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [userId]);

  if (loading) return <div className="pt-24 text-center">Loading profile...</div>;
  if (error) return <div className="pt-24 text-center text-red-500">Error: {error}</div>;
  if (!user) return <div className="pt-24 text-center">User not found.</div>;

  return (
    <div className="container mx-auto p-4 md:p-8 pt-24">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-lg border">
        {/* User Header */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <img 
            src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
            alt={user.name}
            className="w-32 h-32 rounded-full object-cover border-4 border-blue-200"
          />
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold text-gray-800">{user.name}</h1>
            <p className="text-gray-500 flex items-center justify-center sm:justify-start mt-1">
              <FaMapMarkerAlt className="mr-2 text-blue-500" /> {user.location || 'Location not specified'}
            </p>
            <div className="flex justify-center sm:justify-start gap-4 mt-3 text-gray-600">
              {user.github && <a href={user.github} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900"><FaGithub size={24} /></a>}
              {user.linkedin && <a href={user.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-blue-700"><FaLinkedin size={24} /></a>}
            </div>
          </div>
        </div>

        <div className="border-t my-6"></div>

        {/* Skills */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Skills Offered */}
            <div>
              <h3 className="font-semibold text-lg text-gray-700 mb-2">Skills Offered</h3>
              <div className="flex flex-wrap gap-2">
                {user.skillsOffered.map(skill => <span key={skill} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">{skill}</span>)}
              </div>
            </div>
            {/* Skills Wanted */}
            <div>
              <h3 className="font-semibold text-lg text-gray-700 mb-2">Skills Wanted</h3>
              <div className="flex flex-wrap gap-2">
                {user.skillsWanted.map(skill => <span key={skill} className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm font-medium">{skill}</span>)}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}