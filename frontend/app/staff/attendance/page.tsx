"use client";

import React, { useState, useEffect } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogIn, 
  LogOut, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ShieldCheck,
  Zap,
  ChevronRight,
  Timer,
  Layout
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export default function AttendancePage() {
  const {
    activeRecord,
    checkIn,
    checkOut,
    isInsideOffice,
    locationError,
    elapsedTime,
    branchName,
    geofence,
    isProcessing,
  } = useAttendance();

  const [ward, setWard] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatElapsedTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCheckIn = () => {
    void checkIn(ward || branchName || undefined);
  };

  const handleCheckOut = () => {
    void checkOut();
  };

  return (
    <div className="max-w-2xl mx-auto py-4 md:py-10 space-y-6">
      {/* Page Header */}
      <div className="px-2 space-y-1">
        <h3 className="text-2xl font-headline font-black text-on-surface tracking-tight">Attendance Center</h3>
        <p className="text-sm text-on-surface-variant font-medium opacity-60">
          Capture your presence accurately securely.
        </p>
      </div>

      {/* Main Unified Punch Card */}
      <div className="bg-surface-container-low rounded-[2rem] border border-outline-variant/10 shadow-xl overflow-hidden glass-card">
        {/* Card Header: Device & Location Trust */}
        <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-lowest/50">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2.5 rounded-xl flex items-center justify-center",
              isInsideOffice ? "bg-secondary/10 text-secondary" : "bg-error/10 text-error"
            )}>
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-60">Verified Terminal</p>
              <p className="text-xs font-bold text-on-surface">{branchName || 'Authenticating location...'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-surface-container-high rounded-full">
            <div className={cn("w-1.5 h-1.5 rounded-full", isInsideOffice ? "bg-secondary" : "bg-error animate-pulse")}></div>
            <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant">
              {isInsideOffice ? 'In Range' : 'Out of Range'}
            </span>
          </div>
        </div>

        {/* Card Body: The Core Stats */}
        <div className="p-8 md:p-12 flex flex-col items-center text-center space-y-10">
          {/* Main Time Display */}
          <div className="space-y-2">
            {activeRecord ? (
              <>
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-secondary">Duty Duration</p>
                <h2 className="text-6xl md:text-7xl font-headline font-black tracking-tighter text-on-surface tabular-nums">
                  {formatElapsedTime(elapsedTime)}
                </h2>
              </>
            ) : (
              <>
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Current System Time</p>
                <h2 className="text-6xl md:text-7xl font-headline font-black tracking-tighter text-on-surface tabular-nums">
                  {format(currentTime, 'HH:mm:ss')}
                </h2>
              </>
            )}
          </div>

          {/* Action and Context */}
          <div className="w-full max-w-sm space-y-6">
            <AnimatePresence mode="wait">
              {activeRecord ? (
                <motion.div 
                  key="active-info"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-50 mb-1">Punched At</p>
                      <p className="font-black text-sm text-on-surface">{format(parseISO(activeRecord.checkIn), 'hh:mm a')}</p>
                    </div>
                    <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-50 mb-1">Date</p>
                      <p className="font-black text-sm text-on-surface">{format(new Date(), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCheckOut}
                    disabled={isProcessing}
                    className="w-full py-5 bg-error text-white rounded-2xl font-black text-lg shadow-xl shadow-error/20 hover:bg-error/90 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                  >
                    <LogOut className="w-6 h-6" />
                    {isProcessing ? 'Processing...' : 'Clock-Out Now'}
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  key="inactive-info"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/5 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-50 mb-1">Assigned Shift</p>
                      <p className="font-black text-sm text-on-surface">{geofence?.shiftStart || '09:00'} – {geofence?.shiftEnd || '18:00'}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <input
                      type="text"
                      value={ward}
                      onChange={(e) => setWard(e.target.value)}
                      placeholder="Ward / Assigned Location (Optional)"
                      className="w-full bg-surface-container-lowest border border-outline-variant/10 rounded-2xl py-4 px-6 text-sm font-bold text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/10 transition-all text-center"
                    />
                    <button
                      onClick={handleCheckIn}
                      disabled={!isInsideOffice || isProcessing}
                      className="w-full py-5 bg-secondary text-white rounded-2xl font-black text-lg shadow-xl shadow-secondary/20 hover:bg-secondary/90 disabled:opacity-50 disabled:grayscale active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                    >
                      <LogIn className="w-6 h-6" />
                      {isProcessing ? 'Processing...' : 'Clock-In Now'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Card Footer: Location Help */}
        {!isInsideOffice && !activeRecord && (
          <div className="p-4 bg-error/5 border-t border-error/10 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-error shrink-0" />
            <p className="text-[11px] font-bold text-error leading-tight">
              {locationError || "You must be within 200m of the facility to enable biometric clock-in."}
            </p>
          </div>
        )}
      </div>

      {/* Quick Recalibrate */}
      <div className="flex justify-center">
        <button className="flex items-center gap-2 px-4 py-2 hover:bg-surface-container-low rounded-xl transition-all">
          <Zap className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">Recalibrate GPS Sync</span>
        </button>
      </div>
    </div>
  );
}
