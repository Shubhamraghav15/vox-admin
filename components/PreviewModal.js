import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, FileText, Phone, Users, Award, Trash2, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';

const PreviewModal = ({ submission, user, onClose, onReject, onApprove }) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isActionLoading, setIsActionLoading] = useState(false);

  if (!submission || !user) return null;

  const photos = submission.photos || [];
  const isRejected = submission.status === 'rejected';
  const isApproved = submission.status === 'approved';

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleReject = async () => {
    setIsActionLoading(true);
    await onReject(submission._id);
    setIsActionLoading(false);
    onClose();
  };

  const handleApprove = async () => {
    setIsActionLoading(true);
    await onApprove(submission._id);
    setIsActionLoading(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm overflow-hidden"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-6xl bg-[#111] rounded-3xl overflow-hidden border border-[#222] shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col md:flex-row h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 z-50 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors backdrop-blur-md border border-white/10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Left: Image Gallery */}
          <div className="flex-1 relative bg-[#050505] flex items-center justify-center group overflow-hidden">
            {photos.length > 0 ? (
              <>
                <motion.div
                  key={currentPhotoIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative w-full h-full"
                >
                  <Image
                    src={photos[currentPhotoIndex]}
                    alt="Installation"
                    fill
                    referrerPolicy="no-referrer"
                    className="object-contain"
                  />
                </motion.div>
                
                {photos.length > 1 && (
                  <>
                    <button 
                      onClick={handlePrev}
                      className="absolute left-4 p-3 bg-black/40 hover:bg-[#ff6a00] text-white rounded-full transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={handleNext}
                      className="absolute right-4 p-3 bg-black/40 hover:bg-[#ff6a00] text-white rounded-full transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                    
                    {/* Dots */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                      {photos.map((_, i) => (
                        <div 
                          key={i} 
                          className={`w-2 h-2 rounded-full transition-all ${i === currentPhotoIndex ? 'bg-[#ff6a00] w-6' : 'bg-white/30'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-gray-700 italic">No photos available</div>
            )}

            {/* Swipe to Reject Hint */}
            {!isRejected && (
              <div className="absolute top-1/2 left-4 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-40 transition-opacity flex flex-col items-center">
                <ChevronLeft className="w-10 h-10 text-red-500 animate-pulse" />
                <span className="text-[10px] uppercase font-bold text-red-500 tracking-widest mt-2">Swipe left to reject</span>
              </div>
            )}
          </div>

          {/* Right: Details Panel */}
          <div className="w-full md:w-96 bg-[#111] p-8 flex flex-col border-l border-[#222] overflow-y-auto">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">{submission.projectName || 'Untitled Project'}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin className="w-4 h-4 text-[#ff6a00]" />
                <span>{submission.city || 'No City'}</span>
                {submission.area && (
                  <>
                    <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
                    <span>{submission.area} sq.ft</span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-6 flex-1">
              {/* User Info Section */}
              <section>
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Uploader Details</h4>
                <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-[#222] space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#222] rounded-full flex items-center justify-center text-[#ff6a00] font-bold">
                      {(user.fullName || user.name || 'U')[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{user.fullName || user.name || 'Unknown'}</p>
                      <p className="text-[10px] text-gray-500">{user.phone}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#222] space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Team</span>
                      <span className="text-white font-medium">{user.teamName || 'No Team'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Total Points</span>
                      <span className="text-[#ff6a00] font-bold">{user.points || 0}</span>
                    </div>
                    {user.rejects > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Rejections</span>
                        <span className="text-red-500 font-bold">{user.rejects}</span>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Submission Notes */}
              <section>
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Notes</h4>
                <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-[#222] min-h-[100px]">
                  <p className="text-sm text-gray-300 leading-relaxed italic">
                    {submission.notes ? `"${submission.notes}"` : 'No notes provided for this submission.'}
                  </p>
                </div>
              </section>
            </div>

            {/* Actions */}
            <div className="mt-8 pt-8 border-t border-[#222] space-y-3">
              {!isApproved && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleApprove}
                  disabled={isActionLoading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-900/20"
                >
                  {isActionLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Award className="w-5 h-5" />
                      Approve Submission
                    </>
                  )}
                </motion.button>
              )}

              {isRejected ? (
                <div className="bg-red-950/20 border border-red-900/30 p-4 rounded-2xl flex items-center gap-3 text-red-400">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p className="text-xs font-medium">This submission has been rejected and is hidden from the user&apos;s dashboard.</p>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReject}
                  disabled={isActionLoading}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-900/20"
                >
                  {isActionLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      Reject Submission
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PreviewModal;
