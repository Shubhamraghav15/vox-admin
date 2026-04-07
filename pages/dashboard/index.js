import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, RefreshCw, Search, Filter, AlertCircle, CheckCircle2 } from 'lucide-react';

import Sidebar from '../../components/Sidebar';
import SubmissionList from '../../components/SubmissionList';
import PreviewModal from '../../components/PreviewModal';

export default function DashboardPage() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showToast, setShowToast] = useState(null);
  
  const router = useRouter();

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/uploads');
      setData(response.data);
      
      // Auto-select first user if none selected
      if (response.data.length > 0 && !selectedUserId) {
        setSelectedUserId(response.data[0].user._id);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load submissions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedUserId]);

  useEffect(() => {
    // Auth check
    if (typeof window !== 'undefined') {
      const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
      if (isLoggedIn !== 'true') {
        router.push('/');
      } else {
        fetchData();
      }
    }
  }, [router, fetchData]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isAdminLoggedIn');
      router.push('/');
    }
  };

  const handleApprove = async (uploadId) => {
    try {
      const response = await axios.post('/api/approve', { uploadId });
      if (response.data.success) {
        // Update local state instantly
        setData(prevData => prevData.map(userData => {
          if (userData.user._id === response.data.user._id) {
            return {
              ...userData,
              user: response.data.user,
              submissions: userData.submissions.map(sub => 
                sub._id === uploadId ? { ...sub, status: 'approved' } : sub
              )
            };
          }
          return userData;
        }));
        
        if (selectedSubmission?._id === uploadId) {
          setSelectedSubmission(prev => ({ ...prev, status: 'approved' }));
        }

        const delta = response.data.delta;
        const deltaText = delta >= 0 ? `+${delta}` : delta;
        showToastMessage(`Submission approved successfully (${deltaText} pts)`, 'success');
      }
    } catch (err) {
      console.error('Approve error:', err);
      showToastMessage('Failed to approve submission', 'error');
    }
  };

  const handleReject = async (uploadId) => {
    try {
      const response = await axios.post('/api/reject', { uploadId });
      if (response.data.success) {
        // Update local state instantly
        setData(prevData => prevData.map(userData => {
          if (userData.user._id === response.data.user._id) {
            return {
              ...userData,
              user: response.data.user, // Update user with new points/rejects
              submissions: userData.submissions.map(sub => 
                sub._id === uploadId ? { ...sub, status: 'rejected' } : sub
              )
            };
          }
          return userData;
        }));
        
        // Update selected submission if it's the one being rejected
        if (selectedSubmission?._id === uploadId) {
          setSelectedSubmission(prev => ({ ...prev, status: 'rejected' }));
        }

        const delta = response.data.delta;
        const deltaText = delta >= 0 ? `+${delta}` : delta;
        showToastMessage(`Submission rejected successfully (${deltaText} pts)`, 'success');
      }
    } catch (err) {
      console.error('Reject error:', err);
      showToastMessage('Failed to reject submission', 'error');
    }
  };

  const handleBulkAction = async (uploadIds, action) => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/bulk-action', { uploadIds, action });
      if (response.data.success) {
        // Refresh data to be safe since bulk updates are complex
        await fetchData();
        
        // Calculate total points delta for the bulk action
        const totalDelta = response.data.results.reduce((sum, res) => sum + (res.delta || 0), 0);
        const deltaText = totalDelta >= 0 ? `+${totalDelta}` : totalDelta;
        
        showToastMessage(`Bulk ${action} completed (${deltaText} pts total)`, 'success');
      }
    } catch (err) {
      console.error('Bulk action error:', err);
      showToastMessage(`Failed to perform bulk ${action}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showToastMessage = (message, type) => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 3000);
  };

  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    const query = searchQuery.toLowerCase();
    return data.filter(item => 
      (item.user.fullName || '').toLowerCase().includes(query) ||
      (item.user.name || '').toLowerCase().includes(query) ||
      (item.user.phone || '').toLowerCase().includes(query) ||
      (item.user.city || '').toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  const selectedUserData = useMemo(() => 
    data.find(item => item.user._id === selectedUserId),
    [data, selectedUserId]
  );

  if (isLoading && data.length === 0) {
    return (
      <div className="h-screen bg-[#0a0a0a] flex flex-col items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-[#ff6a00]/20 border-t-[#ff6a00] rounded-full mb-4"
        />
        <p className="text-[#ff6a00] font-bold tracking-widest text-xs uppercase">Initializing Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0a0a0a] flex overflow-hidden font-sans text-white">
      {/* Left Sidebar */}
      <Sidebar 
        users={filteredData} 
        selectedUserId={selectedUserId} 
        onSelectUser={setSelectedUserId} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-20 bg-[#111] border-b border-[#222] flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-6 flex-1">
            <div className="relative w-full max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#ff6a00] transition-colors" />
              <input 
                type="text"
                placeholder="Search users by name, phone or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-[#ff6a00]/50 focus:ring-4 focus:ring-[#ff6a00]/5 transition-all"
              />
            </div>
            <button 
              onClick={fetchData}
              className="p-2.5 bg-[#1a1a1a] border border-[#222] hover:border-[#333] rounded-xl transition-all text-gray-400 hover:text-white"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#ff6a00]' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-8 w-[1px] bg-[#222] mx-2"></div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-950/20 hover:bg-red-950/40 text-red-500 border border-red-900/30 rounded-xl text-xs font-bold transition-all"
            >
              <LogOut className="w-4 h-4" />
              LOGOUT
            </button>
          </div>
        </header>

        {/* Submissions List */}
        <SubmissionList 
          user={selectedUserData?.user} 
          submissions={selectedUserData?.submissions || []}
          onSelectSubmission={setSelectedSubmission}
          onBulkAction={handleBulkAction}
        />
      </div>

      {/* Preview Modal */}
      <PreviewModal 
        submission={selectedSubmission}
        user={selectedUserData?.user}
        onClose={() => setSelectedSubmission(null)}
        onReject={handleReject}
        onApprove={handleApprove}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed bottom-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border ${
              showToast.type === 'success' 
                ? 'bg-green-950 border-green-900 text-green-400' 
                : 'bg-red-950 border-red-900 text-red-400'
            }`}
          >
            {showToast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-bold">{showToast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Overlay */}
      {error && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-[#111] p-8 rounded-3xl border border-red-900/30 max-w-md text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-2">Connection Error</h3>
            <p className="text-gray-400 mb-8">{error}</p>
            <button 
              onClick={fetchData}
              className="w-full bg-[#ff6a00] text-white font-bold py-4 rounded-2xl hover:bg-[#ff7a1a] transition-all"
            >
              RETRY CONNECTION
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
