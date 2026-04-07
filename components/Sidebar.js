import React from 'react';
import { User, Phone, MapPin, Users, Award, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = ({ users, selectedUserId, onSelectUser }) => {
  return (
    <div className="w-80 h-screen bg-[#111] border-r border-[#222] flex flex-col overflow-hidden">
      <div className="p-6 border-b border-[#222]">
        <h1 className="text-2xl font-bold text-[#ff6a00] flex items-center gap-2">
          <Award className="w-8 h-8" />
          VOX ADMIN
        </h1>
        <p className="text-xs text-gray-500 mt-1">Installation Photo Review</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">
          Users with Submissions ({users.length})
        </h2>
        
        {users.map((userData) => {
          const { user, submissions } = userData;
          const isSelected = selectedUserId === user._id;
          
          return (
            <motion.div
              key={user._id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectUser(user._id)}
              className={`p-4 rounded-xl cursor-pointer transition-all border ${
                isSelected 
                  ? 'bg-[#1a1a1a] border-[#ff6a00] shadow-[0_0_15px_rgba(255,106,0,0.15)]' 
                  : 'bg-[#151515] border-[#222] hover:border-[#333]'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className={`font-bold truncate ${isSelected ? 'text-[#ff6a00]' : 'text-white'}`}>
                  {user.fullName || user.name || 'Unknown User'}
                </h3>
                <span className="bg-[#222] text-[#ff6a00] text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {submissions.length}
                </span>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                  <Phone className="w-3 h-3" />
                  <span>{user.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                  <MapPin className="w-3 h-3" />
                  <span>{user.city || 'No City'}</span>
                </div>
                {user.teamName && (
                  <div className="flex items-center gap-2 text-[11px] text-gray-400">
                    <Users className="w-3 h-3" />
                    <span>{user.teamName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-[11px] text-[#ff6a00] font-medium pt-1">
                  <Award className="w-3 h-3" />
                  <span>{user.points || 0} Points</span>
                  {user.rejects > 0 && (
                    <span className="text-red-500 ml-auto font-bold">
                      {user.rejects} Rejects
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {users.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            <User className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No users found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
