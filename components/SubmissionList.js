'use client';
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, FileText, CheckCircle, XCircle,
  Maximize2, CheckSquare, Square, Trash2, Award
} from 'lucide-react';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS = {
  approved: {
    label: 'Approved',
    icon: CheckCircle,
    card: 'border-green-900/30',
    badge: 'bg-green-950/80 text-green-400 border-green-900/40',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    card: 'border-red-900/30 opacity-55 grayscale-[0.4]',
    badge: 'bg-red-950/80 text-red-400 border-red-900/40',
  },
};

const FILTERS = ['all', 'approved', 'rejected'];

// ─── Shimmer ──────────────────────────────────────────────────────────────────
const SHIMMER_STYLE = `
  @keyframes _shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position:  400px 0; }
  }
  .photo-shimmer {
    position: absolute; inset: 0;
    background: linear-gradient(90deg, #1a1a1a 25%, #252525 50%, #1a1a1a 75%);
    background-size: 400px 100%;
    animation: _shimmer 1.4s infinite linear;
  }
`;

// ─── PhotoCell ────────────────────────────────────────────────────────────────
function PhotoCell({ src, className }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-[#111] ${className ?? ''}`}>
      {!loaded && !errored && <div className="photo-shimmer" />}

      {errored ? (
        <div className="absolute inset-0 flex items-center justify-center text-gray-700">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="Installation"
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
}

// ─── OverlayIcon ──────────────────────────────────────────────────────────────
function OverlayIcon() {
  return (
    <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center pointer-events-none">
      <div className="bg-primary p-2.5 rounded-full">
        <Maximize2 className="w-5 h-5 text-white" />
      </div>
    </div>
  );
}

// ─── PhotoGrid ────────────────────────────────────────────────────────────────
function PhotoGrid({ photos }) {
  const count = photos?.length ?? 0;

  return (
    <>
      <style>{SHIMMER_STYLE}</style>

      {count === 0 && (
        <div className="flex items-center justify-center h-28 sm:h-36 bg-[#111] text-gray-700 text-xs italic">
          No photos uploaded
        </div>
      )}

      {count === 1 && (
        <div className="relative h-36 sm:h-44">
          <OverlayIcon />
          <PhotoCell src={photos[0]} className="absolute inset-0" />
        </div>
      )}

      {count === 2 && (
        <div className="relative h-36 sm:h-44 grid grid-cols-[2fr_1fr] gap-px bg-bg-dark">
          <OverlayIcon />
          <PhotoCell src={photos[0]} />
          <PhotoCell src={photos[1]} />
        </div>
      )}

      {count >= 3 && (
        <div className="relative h-40 sm:h-48 grid grid-cols-[1fr_1fr] gap-px bg-bg-dark">
          <OverlayIcon />
          <PhotoCell src={photos[0]} />
          <div className="grid grid-rows-2 gap-px">
            <PhotoCell src={photos[1]} />
            <div className="relative overflow-hidden">
              <PhotoCell src={photos[2]} className="absolute inset-0" />
              {count > 3 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                  <span className="text-white font-bold text-sm">+{count - 3}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── StatChip ─────────────────────────────────────────────────────────────────
function StatChip({ icon: Icon, label, color }) {
  return (
    <span className={`flex items-center gap-1.5 text-[11px] ${color ?? 'text-gray-500'}`}>
      <Icon className="w-3 h-3 text-primary" />
      {label}
    </span>
  );
}

// ─── SubmissionList ───────────────────────────────────────────────────────────
const SubmissionList = ({ user, submissions, onSelectSubmission, onBulkAction }) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [filter, setFilter] = useState('all');

  const counts = useMemo(() => {
    const c = { all: submissions.length, pending: 0, approved: 0, rejected: 0 };
    submissions.forEach(s => { if (c[s.status] !== undefined) c[s.status]++; });
    return c;
  }, [submissions]);

  const visible = useMemo(
    () => filter === 'all' ? submissions : submissions.filter(s => s.status === filter),
    [submissions, filter]
  );

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-bg-dark">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="w-20 h-20 bg-[#111] rounded-full flex items-center justify-center mb-5 mx-auto border border-[#222]">
            <FileText className="w-9 h-9 text-gray-600" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Select a user to review</h3>
          <p className="text-sm max-w-xs mx-auto">Choose a user from the sidebar to see their submissions.</p>
        </motion.div>
      </div>
    );
  }

  const allVisibleSelected = visible.length > 0 && visible.every(s => selectedIds.includes(s._id));

  const toggleSelect = (e, id) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(prev => prev.filter(id => !visible.find(s => s._id === id)));
    } else {
      const visibleIds = visible.map(s => s._id);
      setSelectedIds(prev => [...new Set([...prev, ...visibleIds])]);
    }
  };

  const handleBulkAction = (action) => {
    if (!selectedIds.length) return;
    onBulkAction(selectedIds, action);
    setSelectedIds([]);
  };

  const changeFilter = (f) => {
    setFilter(f);
    setSelectedIds([]);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-bg-dark">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Header ── */}
        <header className="flex flex-wrap justify-between items-start gap-4 mb-8">
          <div className="min-w-0">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 truncate">
              {user.fullName || user.name || 'User'}&apos;s submissions
            </h2>
            <div className="flex flex-wrap gap-4">
              <StatChip icon={MapPin} label={user.city || 'No City'} />
              <StatChip icon={FileText} label={`${submissions.length} total`} />
              <StatChip icon={CheckCircle} label={`${counts.approved} approved`} />
              {counts.rejected > 0 && (
                <span className="flex items-center gap-1.5 text-[11px] text-red-400">
                  <XCircle className="w-3 h-3" />
                  {counts.rejected} rejected
                </span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Total Points</p>
            <p className="text-3xl font-black text-primary">{user.points || 0}</p>
          </div>
        </header>

        {/* ── Bulk action bar ── */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 bg-[#111] px-4 py-3 rounded-2xl border border-[#1e1e1e]">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-[11px] font-bold text-gray-500 hover:text-white transition-colors"
            >
              {allVisibleSelected
                ? <CheckSquare className="w-4 h-4 text-primary" />
                : <Square className="w-4 h-4" />
              }
              {allVisibleSelected ? 'Deselect all' : 'Select all'}
            </button>
            {selectedIds.length > 0 && (
              <span className="text-[11px] font-bold text-primary">
                {selectedIds.length} selected
              </span>
            )}
          </div>

          <AnimatePresence>
            {selectedIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                className="flex items-center gap-2"
              >
                <button
                  onClick={() => handleBulkAction('approve')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold rounded-lg transition-colors"
                >
                  <Award className="w-3 h-3" />
                  Approve selected
                </button>
                <button
                  onClick={() => handleBulkAction('reject')}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded-lg transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Reject selected
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Filter tabs ── */}
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => changeFilter(f)}
              className={`px-4 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                filter === f
                  ? 'border-primary text-primary bg-card-dark'
                  : 'border-[#222] text-gray-500 bg-[#111] hover:border-[#333] hover:text-gray-300'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
            </button>
          ))}
        </div>

        {/* ── Cards grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 pb-20">
          <AnimatePresence mode="popLayout">
            {visible.map((submission, index) => {
              const st = STATUS[submission.status] ?? STATUS.approved;
              const isSelected = selectedIds.includes(submission._id);
              const StatusIcon = st.icon;

              return (
                <motion.div
                  key={submission._id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.04 }}
                  whileHover={{ y: -4 }}
                  onClick={() => onSelectSubmission(submission)}
                  className={`group relative bg-[#151515] rounded-2xl overflow-hidden border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/15'
                      : st.card + ' hover:border-primary/40'
                  }`}
                >
                  {/* Checkbox */}
                  <div
                    onClick={(e) => toggleSelect(e, submission._id)}
                    className={`absolute top-3 left-3 z-20 w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-primary border-primary'
                        : 'bg-black/25 border-white/20 hover:border-white/40'
                    }`}
                  >
                    {isSelected && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                  </div>

                  {/* Status badge */}
                  <div className={`absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border backdrop-blur-sm ${st.badge}`}>
                    <StatusIcon className="w-2.5 h-2.5" />
                    {st.label}
                  </div>

                  <PhotoGrid photos={submission.photos} />

                  {/* Card body */}
                  <div className="p-4">
                    <h4 className="text-[13px] font-bold text-white truncate mb-1">
                      {submission.projectName || 'Untitled Project'}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-2">
                      <MapPin className="w-2.5 h-2.5 text-primary" />
                      <span>{submission.city || 'No City'}</span>
                      {submission.area && (
                        <>
                          <span className="w-1 h-1 bg-[#333] rounded-full" />
                          <span>{submission.area} sq.ft</span>
                        </>
                      )}
                    </div>
                    {submission.notes && (
                      <p className="text-[10px] text-gray-500 italic line-clamp-2 leading-relaxed">
                        &quot;{submission.notes}&quot;
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {visible.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-600">
              <FileText className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm">No submissions in this filter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionList;

// import React, { useState } from 'react';
// import Image from 'next/image';
// import { motion, AnimatePresence } from 'framer-motion';
// import { MapPin, FileText, CheckCircle, XCircle, Clock, Maximize2, CheckSquare, Square, Trash2, Award } from 'lucide-react';

// const SubmissionList = ({ user, submissions, onSelectSubmission, onBulkAction }) => {
//   const [selectedIds, setSelectedIds] = useState([]);

//   if (!user) {
//     return (
//       <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-[#0a0a0a]">
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="text-center"
//         >
//           <div className="w-24 h-24 bg-[#111] rounded-full flex items-center justify-center mb-6 mx-auto border border-[#222]">
//             <FileText className="w-10 h-10 text-gray-600" />
//           </div>
//           <h3 className="text-xl font-bold text-white mb-2">Select a user to review</h3>
//           <p className="text-sm max-w-xs mx-auto">Choose a user from the sidebar to see their installation photo submissions.</p>
//         </motion.div>
//       </div>
//     );
//   }

//   const toggleSelect = (e, id) => {
//     e.stopPropagation();
//     setSelectedIds(prev => 
//       prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
//     );
//   };

//   const selectAll = () => {
//     if (selectedIds.length === submissions.length) {
//       setSelectedIds([]);
//     } else {
//       setSelectedIds(submissions.map(s => s._id));
//     }
//   };

//   const handleBulkAction = (action) => {
//     if (selectedIds.length === 0) return;
//     onBulkAction(selectedIds, action);
//     setSelectedIds([]);
//   };

//   return (
//     <div className="flex-1 overflow-y-auto bg-[#0a0a0a] p-8 relative">
//       <div className="max-w-5xl mx-auto">
//         <header className="mb-10 flex justify-between items-end">
//           <div>
//             <h2 className="text-3xl font-bold text-white mb-2">
//               {user.fullName || user.name || 'User'}&apos;s Submissions
//             </h2>
//             <div className="flex gap-4 text-sm text-gray-400">
//               <span className="flex items-center gap-1.5">
//                 <MapPin className="w-4 h-4 text-[#ff6a00]" />
//                 {user.city || 'No City'}
//               </span>
//               <span className="flex items-center gap-1.5">
//                 <FileText className="w-4 h-4 text-[#ff6a00]" />
//                 {submissions.length} Total Submissions
//               </span>
//             </div>
//           </div>
//           <div className="text-right">
//             <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Total Points</p>
//             <p className="text-2xl font-black text-[#ff6a00]">{user.points || 0}</p>
//           </div>
//         </header>

//         {/* Bulk Actions Bar */}
//         <div className="mb-6 flex items-center justify-between bg-[#111] p-4 rounded-2xl border border-[#222]">
//           <div className="flex items-center gap-4">
//             <button 
//               onClick={selectAll}
//               className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
//             >
//               {selectedIds.length === submissions.length ? <CheckSquare className="w-4 h-4 text-[#ff6a00]" /> : <Square className="w-4 h-4" />}
//               {selectedIds.length === submissions.length ? 'DESELECT ALL' : 'SELECT ALL'}
//             </button>
//             {selectedIds.length > 0 && (
//               <span className="text-xs font-bold text-[#ff6a00]">
//                 {selectedIds.length} SELECTED
//               </span>
//             )}
//           </div>
          
//           <AnimatePresence>
//             {selectedIds.length > 0 && (
//               <motion.div 
//                 initial={{ opacity: 0, x: 20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 exit={{ opacity: 0, x: 20 }}
//                 className="flex items-center gap-3"
//               >
//                 <button 
//                   onClick={() => handleBulkAction('approve')}
//                   className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold rounded-lg transition-colors"
//                 >
//                   <Award className="w-3 h-3" />
//                   APPROVE SELECTED
//                 </button>
//                 <button 
//                   onClick={() => handleBulkAction('reject')}
//                   className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded-lg transition-colors"
//                 >
//                   <Trash2 className="w-3 h-3" />
//                   REJECT SELECTED
//                 </button>
//               </motion.div>
//             )}
//           </AnimatePresence>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
//           {submissions.map((submission, index) => {
//             const isRejected = submission.status === 'rejected';
//             const isApproved = submission.status === 'approved';
//             const isSelected = selectedIds.includes(submission._id);
            
//             return (
//               <motion.div
//                 key={submission._id}
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ delay: index * 0.05 }}
//                 whileHover={{ y: -5 }}
//                 onClick={() => onSelectSubmission(submission)}
//                 className={`group relative bg-[#151515] rounded-2xl overflow-hidden border transition-all cursor-pointer ${
//                   isSelected ? 'border-[#ff6a00] ring-2 ring-[#ff6a00]/20' : 
//                   isRejected 
//                     ? 'border-red-900/30 opacity-60 grayscale-[0.5]' 
//                     : 'border-[#222] hover:border-[#ff6a00]/50'
//                 }`}
//               >
//                 {/* Selection Checkbox */}
//                 <div 
//                   className="absolute top-4 left-4 z-20"
//                   onClick={(e) => toggleSelect(e, submission._id)}
//                 >
//                   <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${isSelected ? 'bg-[#ff6a00] border-[#ff6a00]' : 'bg-black/20 border-white/20 hover:border-white/40'}`}>
//                     {isSelected && <CheckSquare className="w-4 h-4 text-white" />}
//                   </div>
//                 </div>

//                 {/* Status Badge */}
//                 <div className="absolute top-4 right-4 z-10">
//                   {isRejected ? (
//                     <div className="flex items-center gap-1.5 bg-red-950/80 text-red-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-red-900/50 backdrop-blur-md">
//                       <XCircle className="w-3 h-3" />
//                       Rejected
//                     </div>
//                   ) : isApproved ? (
//                     <div className="flex items-center gap-1.5 bg-green-950/80 text-green-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-green-900/50 backdrop-blur-md">
//                       <CheckCircle className="w-3 h-3" />
//                       Approved
//                     </div>
//                   ) : (
//                     <div className="flex items-center gap-1.5 bg-orange-950/80 text-orange-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-orange-900/50 backdrop-blur-md">
//                       <Clock className="w-3 h-3" />
//                       Pending
//                     </div>
//                   )}
//                 </div>

//                 {/* Images Grid */}
//                 <div className="grid grid-cols-3 h-48 bg-[#111]">
//                   {submission.photos && submission.photos.length > 0 ? (
//                     submission.photos.slice(0, 3).map((photo, i) => (
//                       <div key={i} className={`relative overflow-hidden ${submission.photos.length === 1 ? 'col-span-3' : submission.photos.length === 2 ? 'col-span-2' : 'col-span-1'}`}>
//                         <Image 
//                           src={photo} 
//                           alt="Installation" 
//                           fill
//                           referrerPolicy="no-referrer"
//                           className="object-cover transition-transform duration-500 group-hover:scale-110"
//                         />
//                       </div>
//                     ))
//                   ) : (
//                     <div className="col-span-3 flex items-center justify-center text-gray-700 italic text-xs">
//                       No photos uploaded
//                     </div>
//                   )}
                  
//                   {/* Overlay on hover */}
//                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
//                     <div className="bg-[#ff6a00] p-3 rounded-full shadow-lg">
//                       <Maximize2 className="w-6 h-6 text-white" />
//                     </div>
//                   </div>
//                 </div>

//                 {/* Content */}
//                 <div className="p-5">
//                   <h4 className="text-lg font-bold text-white mb-1 truncate">
//                     {submission.projectName || 'Untitled Project'}
//                   </h4>
//                   <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
//                     <MapPin className="w-3 h-3 text-[#ff6a00]" />
//                     <span>{submission.city || 'No City'}</span>
//                     {submission.area && (
//                       <>
//                         <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
//                         <span>{submission.area} sq.ft</span>
//                       </>
//                     )}
//                   </div>
                  
//                   {submission.notes && (
//                     <p className="text-xs text-gray-400 line-clamp-2 italic leading-relaxed">
//                       &quot;{submission.notes}&quot;
//                     </p>
//                   )}
//                 </div>
//               </motion.div>
//             );
//           })}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SubmissionList;
