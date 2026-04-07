import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Phone, MapPin, Users, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Dynamic collapse hook ───────────────────────────────────────────────────
// Watches the sidebar's actual rendered width via ResizeObserver.
// Collapses when the sidebar's share of the viewport drops below the threshold.
const COLLAPSE_RATIO = 0.18; // collapse if sidebar would be < 18% of viewport width
const MIN_EXPANDED_PX = 220;  // also collapse if viewport < ~1200px equivalent

function useResizeSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    function evaluate() {
      const vw = window.innerWidth;
      const shouldCollapse = vw < MIN_EXPANDED_PX / COLLAPSE_RATIO;
      setCollapsed(shouldCollapse);
    }

    evaluate();
    window.addEventListener('resize', evaluate);
    return () => window.removeEventListener('resize', evaluate);
  }, []);

  return collapsed;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
const Sidebar = ({ users, selectedUserId, onSelectUser }) => {
  const collapsed = useResizeSidebar();

  return (
    <motion.div
      animate={{ width: collapsed ? 64 : 300 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="h-screen bg-[#111] border-r border-[#222] flex flex-col overflow-hidden flex-shrink-0"
    >
      {/* Header */}
      <div className={`p-4 border-b border-[#222] flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
        <Award className="w-6 h-6 text-[#ff6a00] flex-shrink-0" />
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <p className="text-[#ff6a00] font-bold text-lg leading-tight">VOX ADMIN</p>
              <p className="text-gray-500 text-[10px]">Installation Photo Review</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {!collapsed && (
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-2 pt-2 pb-1">
            Users ({users.length})
          </p>
        )}

        {users.map(({ user, submissions }) => {
          const isSelected = selectedUserId === user._id;
          const initials = getInitials(user.fullName || user.name);

          return (
            <motion.div
              key={user._id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectUser(user._id)}
              title={collapsed ? (user.fullName || user.name) : undefined}
              className={`flex items-center gap-3 rounded-xl cursor-pointer border transition-all
                ${collapsed ? 'justify-center p-2' : 'p-3'}
                ${isSelected
                  ? 'bg-[#1a1a1a] border-[#ff6a00] shadow-[0_0_12px_rgba(255,106,0,0.12)]'
                  : 'bg-[#151515] border-[#222] hover:border-[#333]'
                }`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold
                ${isSelected ? 'bg-[#ff6a00] text-black' : 'bg-[#222] text-[#ff6a00]'}`}>
                {initials || '?'}
              </div>

              {/* Detail (expanded only) */}
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.18 }}
                    className="flex-1 overflow-hidden min-w-0"
                  >
                    <div className="flex items-center justify-between">
                      <p className={`font-bold text-[12px] truncate ${isSelected ? 'text-[#ff6a00]' : 'text-white'}`}>
                        {user.fullName || user.name || 'Unknown'}
                      </p>
                      <span className="bg-[#222] text-[#ff6a00] text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-2 flex-shrink-0">
                        {submissions.length}
                      </span>
                    </div>

                    <div className="mt-1 space-y-0.5">
                      {user.phone && (
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                          <Phone className="w-2.5 h-2.5" />
                          <span className="truncate">{user.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                        <MapPin className="w-2.5 h-2.5" />
                        <span className="truncate">{user.city || 'No City'}</span>
                      </div>
                      {user.teamName && (
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                          <Users className="w-2.5 h-2.5" />
                          <span className="truncate">{user.teamName}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-[10px] text-[#ff6a00] font-medium pt-0.5">
                        <Award className="w-2.5 h-2.5" />
                        <span>{user.points || 0} pts</span>
                        {user.rejects > 0 && (
                          <span className="text-red-500 ml-auto font-bold">{user.rejects} ✕</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {users.length === 0 && !collapsed && (
          <div className="text-center py-10 text-gray-500 text-sm">No users found</div>
        )}
      </div>
    </motion.div>
  );
};

export default Sidebar;

// import React from 'react';
// import { User, Phone, MapPin, Users, Award, FileText } from 'lucide-react';
// import { motion } from 'framer-motion';

// const Sidebar = ({ users, selectedUserId, onSelectUser }) => {
//   return (
//     <div className="w-80 h-screen bg-[#111] border-r border-[#222] flex flex-col overflow-hidden">
//       <div className="p-6 border-b border-[#222]">
//         <h1 className="text-2xl font-bold text-[#ff6a00] flex items-center gap-2">
//           <Award className="w-8 h-8" />
//           VOX ADMIN
//         </h1>
//         <p className="text-xs text-gray-500 mt-1">Installation Photo Review</p>
//       </div>

//       <div className="flex-1 overflow-y-auto p-4 space-y-3">
//         <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">
//           Users with Submissions ({users.length})
//         </h2>
        
//         {users.map((userData) => {
//           const { user, submissions } = userData;
//           const isSelected = selectedUserId === user._id;
          
//           return (
//             <motion.div
//               key={user._id}
//               whileHover={{ scale: 1.02 }}
//               whileTap={{ scale: 0.98 }}
//               onClick={() => onSelectUser(user._id)}
//               className={`p-4 rounded-xl cursor-pointer transition-all border ${
//                 isSelected 
//                   ? 'bg-[#1a1a1a] border-[#ff6a00] shadow-[0_0_15px_rgba(255,106,0,0.15)]' 
//                   : 'bg-[#151515] border-[#222] hover:border-[#333]'
//               }`}
//             >
//               <div className="flex justify-between items-start mb-2">
//                 <h3 className={`font-bold truncate ${isSelected ? 'text-[#ff6a00]' : 'text-white'}`}>
//                   {user.fullName || user.name || 'Unknown User'}
//                 </h3>
//                 <span className="bg-[#222] text-[#ff6a00] text-[10px] px-2 py-0.5 rounded-full font-bold">
//                   {submissions.length}
//                 </span>
//               </div>
              
//               <div className="space-y-1.5">
//                 <div className="flex items-center gap-2 text-[11px] text-gray-400">
//                   <Phone className="w-3 h-3" />
//                   <span>{user.phone}</span>
//                 </div>
//                 <div className="flex items-center gap-2 text-[11px] text-gray-400">
//                   <MapPin className="w-3 h-3" />
//                   <span>{user.city || 'No City'}</span>
//                 </div>
//                 {user.teamName && (
//                   <div className="flex items-center gap-2 text-[11px] text-gray-400">
//                     <Users className="w-3 h-3" />
//                     <span>{user.teamName}</span>
//                   </div>
//                 )}
//                 <div className="flex items-center gap-2 text-[11px] text-[#ff6a00] font-medium pt-1">
//                   <Award className="w-3 h-3" />
//                   <span>{user.points || 0} Points</span>
//                   {user.rejects > 0 && (
//                     <span className="text-red-500 ml-auto font-bold">
//                       {user.rejects} Rejects
//                     </span>
//                   )}
//                 </div>
//               </div>
//             </motion.div>
//           );
//         })}

//         {users.length === 0 && (
//           <div className="text-center py-10 text-gray-500">
//             <User className="w-10 h-10 mx-auto mb-2 opacity-20" />
//             <p className="text-sm">No users found</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Sidebar;
