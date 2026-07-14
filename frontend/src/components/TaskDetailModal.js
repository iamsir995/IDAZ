"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Square, CheckSquare, Square as SquareOutline, Send, Clock, User, CheckCircle2 } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";

export default function TaskDetailModal({ task, onClose, onUpdate, currentUser }) {
  const [activeTask, setActiveTask] = useState(task);
  const [newChecklist, setNewChecklist] = useState("");
  const [newComment, setNewComment] = useState("");
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const intervalRef = useRef(null);
  
  useEffect(() => {
    if (activeTask && currentUser) {
      const runningSession = activeTask.timeTracking?.find(
        t => t.user === currentUser._id && !t.endTime
      );
      if (runningSession) {
        setIsTimerRunning(true);
        setActiveSessionId(runningSession._id);
        // Start live timer
        const startTime = new Date(runningSession.startTime).getTime();
        intervalRef.current = setInterval(() => {
          setLiveSeconds(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);
      } else {
        setIsTimerRunning(false);
        setActiveSessionId(null);
        setLiveSeconds(0);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [activeTask, currentUser]);

  const handleAddChecklist = async (e) => {
    e.preventDefault();
    if(!newChecklist.trim()) return;
    
    try {
      const res = await api.post(`/tasks/${activeTask._id || activeTask.id}/checklists`, { title: newChecklist });
      if (res.data.success) {
        setActiveTask(res.data.data);
        setNewChecklist("");
        onUpdate();
      }
    } catch (error) {
      toast.error("Lỗi thêm checklist");
    }
  };

  const handleToggleChecklist = async (checklistId) => {
    try {
      const res = await api.put(`/tasks/${activeTask._id || activeTask.id}/checklists/${checklistId}`);
      if (res.data.success) {
        setActiveTask(res.data.data);
        onUpdate();
      }
    } catch (error) {
      toast.error("Lỗi cập nhật checklist");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if(!newComment.trim()) return;
    
    try {
      const res = await api.post(`/tasks/${activeTask._id || activeTask.id}/comments`, { text: newComment });
      if (res.data.success) {
        setActiveTask(res.data.data);
        setNewComment("");
        onUpdate();
      }
    } catch (error) {
      toast.error("Lỗi gửi bình luận");
    }
  };

  const handleToggleTimer = async () => {
    try {
      if (isTimerRunning) {
        const res = await api.post(`/tasks/${activeTask._id || activeTask.id}/time/stop`);
        if(res.data.success) {
          setActiveTask(res.data.data);
          setIsTimerRunning(false);
          setLiveSeconds(0);
          if (intervalRef.current) clearInterval(intervalRef.current);
          toast.success("Đã dừng bộ đếm thời gian");
          onUpdate();
        }
      } else {
        const res = await api.post(`/tasks/${activeTask._id || activeTask.id}/time/start`);
        if(res.data.success) {
          setActiveTask(res.data.data);
          setIsTimerRunning(true);
          const startTime = Date.now();
          intervalRef.current = setInterval(() => {
            setLiveSeconds(Math.floor((Date.now() - startTime) / 1000));
          }, 1000);
          toast.success("Bắt đầu tính thời gian làm việc!");
          onUpdate();
        }
      }
    } catch (error) {
      toast.error("Lỗi Time Tracking");
    }
  };

  const calculateTotalTime = () => {
    if (!activeTask?.timeTracking) return 0;
    const totalSeconds = activeTask.timeTracking.reduce((acc, curr) => {
      if (curr.duration) return acc + curr.duration;
      return acc;
    }, 0);
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const completedChecklists = activeTask?.checklists?.filter(c => c.isCompleted).length || 0;
  const totalChecklists = activeTask?.checklists?.length || 0;
  const progress = totalChecklists === 0 ? 0 : Math.round((completedChecklists / totalChecklists) * 100);

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-idaz-gray border border-white/60 rounded-3xl w-full max-w-4xl h-[85vh] flex overflow-hidden shadow-2xl"
      >
        {/* LEFT COLUMN - CONTENT */}
        <div className="flex-1 flex flex-col border-r border-white/60">
          <div className="p-6 border-b border-white/60 shrink-0">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-idaz-black">{activeTask?.title}</h2>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border bg-gray-100 text-gray-600 border-zinc-700`}>
                {activeTask?.status}
              </span>
            </div>
            
            {/* Timer Actions */}
            <div className="flex items-center gap-4 glass-card rounded-2xl p-4 border border-white/40">
              <button 
                onClick={handleToggleTimer}
                className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${
                  isTimerRunning 
                    ? 'bg-rose-500 hover:bg-rose-600 text-idaz-black shadow-[0_0_15px_rgba(244,63,94,0.4)]' 
                    : 'bg-emerald-500 hover:bg-emerald-600 text-idaz-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                }`}
              >
                {isTimerRunning ? <><Square size={16} fill="currentColor" /> Dừng bấm giờ</> : <><Play size={16} fill="currentColor" /> Bắt đầu làm</>}
              </button>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock size={16} />
                  <span className="font-mono text-sm">Đã dùng: {calculateTotalTime()}</span>
                </div>
                {isTimerRunning && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                    <span className="font-mono text-rose-400 font-bold text-sm">
                      {String(Math.floor(liveSeconds / 3600)).padStart(2,'0')}:{String(Math.floor((liveSeconds % 3600) / 60)).padStart(2,'0')}:{String(liveSeconds % 60).padStart(2,'0')}
                    </span>
                    <span className="text-xs text-gray-500">phiên hiện tại</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
            {/* Checklists */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-idaz-black flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-indigo-400" />
                  Checklist Công việc
                </h3>
                <span className="text-sm font-medium text-gray-400">{progress}%</span>
              </div>
              
              {totalChecklists > 0 && (
                <div className="w-full glass-card rounded-full h-2 mb-4 overflow-hidden border border-white/40">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="bg-idaz-orange h-full rounded-full"
                  />
                </div>
              )}
              
              <div className="space-y-2 mb-4">
                {activeTask?.checklists?.map(item => (
                  <div key={item._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-white/40 group hover:border-white/60 transition-colors">
                    <button 
                      onClick={() => handleToggleChecklist(item._id)}
                      className={`transition-colors ${item.isCompleted ? 'text-emerald-400' : 'text-gray-500 hover:text-idaz-black'}`}
                    >
                      {item.isCompleted ? <CheckSquare size={20} /> : <SquareOutline size={20} />}
                    </button>
                    <span className={`text-sm transition-all ${item.isCompleted ? 'text-gray-500 line-through' : 'text-gray-600'}`}>
                      {item.title}
                    </span>
                  </div>
                ))}
              </div>
              
              <form onSubmit={handleAddChecklist} className="flex gap-2">
                <input
                  type="text"
                  value={newChecklist}
                  onChange={(e) => setNewChecklist(e.target.value)}
                  placeholder="Thêm mục công việc con..."
                  className="flex-1 glass-card border border-white/60 rounded-2xl px-4 py-2 text-sm text-idaz-black focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button type="submit" className="px-4 py-2 bg-idaz-orange hover:bg-idaz-orange text-idaz-black rounded-2xl text-sm font-medium transition-colors">
                  Thêm
                </button>
              </form>
            </div>
          </div>
        </div>
        
        {/* RIGHT COLUMN - COMMENTS */}
        <div className="w-80 flex flex-col bg-white/30 shrink-0">
          <div className="p-4 border-b border-white/60 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-idaz-black">Thảo luận</h3>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-idaz-black hover:bg-white/10 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {activeTask?.comments?.map((comment) => (
              <div key={comment._id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-idaz-orange flex shrink-0 items-center justify-center text-idaz-black text-[10px] font-bold overflow-hidden">
                  {comment.user?.avatar ? (
                    <img src={comment.user.avatar} className="w-full h-full object-cover" />
                  ) : (
                    comment.user?.name?.charAt(0) || <User size={14}/>
                  )}
                </div>
                <div className="glass-card border border-white/40 rounded-3xl rounded-tl-none p-3 text-sm">
                  <div className="font-bold text-indigo-300 mb-1 flex justify-between items-baseline gap-2">
                    {comment.user?.name || 'User'}
                    <span className="text-[10px] font-normal text-gray-500">
                      {new Date(comment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <p className="text-gray-600 whitespace-pre-wrap">{comment.text}</p>
                </div>
              </div>
            ))}
            {(!activeTask?.comments || activeTask.comments.length === 0) && (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 opacity-50 space-y-2">
                <Send size={24} />
                <p className="text-xs">Chưa có bình luận nào</p>
              </div>
            )}
          </div>
          
          <div className="p-4 bg-gray-50 border-t border-white/60">
            <form onSubmit={handleAddComment} className="relative">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Viết bình luận..."
                className="w-full glass-card border border-white/60 rounded-2xl pl-4 pr-12 py-3 text-sm text-idaz-black focus:outline-none focus:border-indigo-500 transition-colors resize-none custom-scrollbar"
                rows="2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment(e);
                  }
                }}
              />
              <button 
                type="submit" 
                disabled={!newComment.trim()}
                className="absolute right-2 bottom-2 p-2 bg-idaz-orange hover:bg-idaz-orange disabled:bg-gray-100 disabled:text-zinc-600 text-idaz-black rounded-xl transition-colors"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
