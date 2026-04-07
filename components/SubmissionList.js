import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, FileText, CheckCircle, XCircle, Clock, Maximize2, CheckSquare, Square, Trash2, Award } from 'lucide-react';

const SubmissionList = ({ user, submissions, onSelectSubmission, onBulkAction }) => {
  const [selectedIds, setSelectedIds] = useState([]);

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-[#0a0a0a]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-[#111] rounded-full flex items-center justify-center mb-6 mx-auto border border-[#222]">
            <FileText className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Select a user to review</h3>
          <p className="text-sm max-w-xs mx-auto">Choose a user from the sidebar to see their installation photo submissions.</p>
        </motion.div>
      </div>
    );
  }

  const toggleSelect = (e, id) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === submissions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(submissions.map(s => s._id));
    }
  };

  const handleBulkAction = (action) => {
    if (selectedIds.length === 0) return;
    onBulkAction(selectedIds, action);
    setSelectedIds([]);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0a] p-8 relative">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {user.fullName || user.name || 'User'}&apos;s Submissions
            </h2>
            <div className="flex gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#ff6a00]" />
                {user.city || 'No City'}
              </span>
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#ff6a00]" />
                {submissions.length} Total Submissions
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Total Points</p>
            <p className="text-2xl font-black text-[#ff6a00]">{user.points || 0}</p>
          </div>
        </header>

        {/* Bulk Actions Bar */}
        <div className="mb-6 flex items-center justify-between bg-[#111] p-4 rounded-2xl border border-[#222]">
          <div className="flex items-center gap-4">
            <button 
              onClick={selectAll}
              className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
            >
              {selectedIds.length === submissions.length ? <CheckSquare className="w-4 h-4 text-[#ff6a00]" /> : <Square className="w-4 h-4" />}
              {selectedIds.length === submissions.length ? 'DESELECT ALL' : 'SELECT ALL'}
            </button>
            {selectedIds.length > 0 && (
              <span className="text-xs font-bold text-[#ff6a00]">
                {selectedIds.length} SELECTED
              </span>
            )}
          </div>
          
          <AnimatePresence>
            {selectedIds.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3"
              >
                <button 
                  onClick={() => handleBulkAction('approve')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold rounded-lg transition-colors"
                >
                  <Award className="w-3 h-3" />
                  APPROVE SELECTED
                </button>
                <button 
                  onClick={() => handleBulkAction('reject')}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded-lg transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  REJECT SELECTED
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
          {submissions.map((submission, index) => {
            const isRejected = submission.status === 'rejected';
            const isApproved = submission.status === 'approved';
            const isSelected = selectedIds.includes(submission._id);
            
            return (
              <motion.div
                key={submission._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
                onClick={() => onSelectSubmission(submission)}
                className={`group relative bg-[#151515] rounded-2xl overflow-hidden border transition-all cursor-pointer ${
                  isSelected ? 'border-[#ff6a00] ring-2 ring-[#ff6a00]/20' : 
                  isRejected 
                    ? 'border-red-900/30 opacity-60 grayscale-[0.5]' 
                    : 'border-[#222] hover:border-[#ff6a00]/50'
                }`}
              >
                {/* Selection Checkbox */}
                <div 
                  className="absolute top-4 left-4 z-20"
                  onClick={(e) => toggleSelect(e, submission._id)}
                >
                  <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${isSelected ? 'bg-[#ff6a00] border-[#ff6a00]' : 'bg-black/20 border-white/20 hover:border-white/40'}`}>
                    {isSelected && <CheckSquare className="w-4 h-4 text-white" />}
                  </div>
                </div>

                {/* Status Badge */}
                <div className="absolute top-4 right-4 z-10">
                  {isRejected ? (
                    <div className="flex items-center gap-1.5 bg-red-950/80 text-red-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-red-900/50 backdrop-blur-md">
                      <XCircle className="w-3 h-3" />
                      Rejected
                    </div>
                  ) : isApproved ? (
                    <div className="flex items-center gap-1.5 bg-green-950/80 text-green-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-green-900/50 backdrop-blur-md">
                      <CheckCircle className="w-3 h-3" />
                      Approved
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-orange-950/80 text-orange-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-orange-900/50 backdrop-blur-md">
                      <Clock className="w-3 h-3" />
                      Pending
                    </div>
                  )}
                </div>

                {/* Images Grid */}
                <div className="grid grid-cols-3 h-48 bg-[#111]">
                  {submission.photos && submission.photos.length > 0 ? (
                    submission.photos.slice(0, 3).map((photo, i) => (
                      <div key={i} className={`relative overflow-hidden ${submission.photos.length === 1 ? 'col-span-3' : submission.photos.length === 2 ? 'col-span-2' : 'col-span-1'}`}>
                        <Image 
                          src={photo} 
                          alt="Installation" 
                          fill
                          referrerPolicy="no-referrer"
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 flex items-center justify-center text-gray-700 italic text-xs">
                      No photos uploaded
                    </div>
                  )}
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-[#ff6a00] p-3 rounded-full shadow-lg">
                      <Maximize2 className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h4 className="text-lg font-bold text-white mb-1 truncate">
                    {submission.projectName || 'Untitled Project'}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <MapPin className="w-3 h-3 text-[#ff6a00]" />
                    <span>{submission.city || 'No City'}</span>
                    {submission.area && (
                      <>
                        <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
                        <span>{submission.area} sq.ft</span>
                      </>
                    )}
                  </div>
                  
                  {submission.notes && (
                    <p className="text-xs text-gray-400 line-clamp-2 italic leading-relaxed">
                      &quot;{submission.notes}&quot;
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SubmissionList;
