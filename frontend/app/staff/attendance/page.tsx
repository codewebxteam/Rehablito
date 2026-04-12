"use client";

import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { motion } from 'motion/react';
import { 
  LogIn, 
  LogOut, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  Clock
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

  const formatTime = (seconds: number) => {
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
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-primary font-bold text-xs uppercase tracking-widest font-label">Real-time Presence</p>
          <h3 className="text-3xl font-headline font-extrabold text-on-surface">Attendance Panel</h3>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-sm group border border-outline-variant/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-primary/10 transition-colors"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
            <div className="space-y-6 flex-1 w-full text-center md:text-left">
              <div>
                <span className={cn(
                  "px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full",
                  activeRecord ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"
                )}>
                  {activeRecord ? "Shift in Progress" : "Ready to start shift"}
                </span>
                <h4 className="text-xl font-bold mt-3 text-on-surface">
                  {activeRecord ? `Active at ${activeRecord.ward}` : "Welcome back"}
                </h4>
                <p className="text-on-surface-variant text-sm mt-1">
                  {activeRecord
                    ? "Your hours are being logged automatically. Stay safe."
                    : `Check-in to begin logging your hours${branchName ? ` at ${branchName}` : ''}.`}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-label uppercase text-outline tracking-wider">Date</p>
                  <p className="font-bold text-on-surface">{format(new Date(), 'MMM dd, yyyy')}</p>
                </div>
                <div className="hidden sm:block w-[1px] h-10 bg-outline-variant/30"></div>
                <div className="space-y-1">
                  <p className="text-[10px] font-label uppercase text-outline tracking-wider">Arrival</p>
                  <p className="font-bold text-on-surface">{activeRecord ? format(parseISO(activeRecord.checkIn), 'hh:mm a') : "--:--"}</p>
                </div>
                <div className="hidden sm:block w-[1px] h-10 bg-outline-variant/30"></div>
                <div className="space-y-1">
                  <p className="text-[10px] font-label uppercase text-outline tracking-wider">Shift</p>
                  <p className="font-bold text-on-surface">
                    {geofence?.shiftStart && geofence?.shiftEnd
                      ? `${geofence.shiftStart} – ${geofence.shiftEnd}`
                      : '—'}
                  </p>
                </div>
              </div>

              {activeRecord ? (
                <button
                  onClick={handleCheckOut}
                  disabled={isProcessing}
                  className="w-full md:w-auto px-10 py-4 bg-error text-white rounded-2xl font-bold text-lg shadow-xl shadow-error/20 hover:bg-error/90 transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <LogOut className="w-6 h-6" />
                  {isProcessing ? 'Checking out...' : 'Check-Out Now'}
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Label (optional)</label>
                    <input
                      type="text"
                      value={ward}
                      onChange={(e) => setWard(e.target.value)}
                      placeholder={branchName || 'Ward / Assignment'}
                      className="bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <button
                    onClick={handleCheckIn}
                    disabled={!isInsideOffice || isProcessing}
                    className="w-full md:w-auto px-10 py-4 bg-secondary text-white rounded-2xl font-bold text-lg shadow-xl shadow-secondary/20 hover:bg-secondary/90 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
                  >
                    <LogIn className="w-6 h-6" />
                    {isProcessing ? 'Checking in...' : 'Check-In Now'}
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center justify-center p-6 md:p-8 bg-surface-container-low rounded-[2.5rem] border border-white w-full md:min-w-[280px]">
              <p className="text-[11px] font-bold text-primary uppercase tracking-[0.2em] mb-4">Shift Duration</p>
              <div className="text-5xl md:text-6xl font-headline font-black tracking-tighter text-on-surface">
                {formatTime(elapsedTime)}
              </div>
              <div className="mt-6 flex gap-2">
                <motion.div 
                  animate={activeRecord ? { scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-2 h-2 rounded-full bg-primary"
                />
                <div className="w-2 h-2 rounded-full bg-outline-variant" />
                <div className="w-2 h-2 rounded-full bg-outline-variant" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest rounded-3xl overflow-hidden shadow-sm flex flex-col border border-outline-variant/10">
          <div className="h-48 relative bg-surface-container-highest">
            <img 
              src="https://picsum.photos/seed/map/400/200" 
              alt="Map" 
              className="w-full h-full object-cover opacity-50"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="w-16 h-16 bg-primary/20 rounded-full animate-ping absolute -inset-0"></div>
                <div className="w-16 h-16 bg-primary/10 rounded-full absolute -inset-0"></div>
                <MapPin className="w-8 h-8 text-primary relative z-10" />
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
              <div className="flex items-center gap-2 text-white">
                {isInsideOffice ? (
                  <CheckCircle2 className="w-5 h-5 text-secondary fill-secondary/20" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-error fill-error/20" />
                )}
                <span className="text-sm font-bold">
                  {isInsideOffice ? "Inside Office Perimeter" : "Outside Office Perimeter"}
                </span>
              </div>
            </div>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-label uppercase text-outline tracking-wider mb-1">Geofence Status</p>
              <h5 className="font-bold text-on-surface">{branchName || 'Branch location'}</h5>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                {isInsideOffice
                  ? 'Your location is verified. You are authorized to check in.'
                  : geofence
                    ? `Please move within ${geofence.radiusMeters}m of the branch to enable check-in.`
                    : 'Loading branch geofence...'}
              </p>
              {locationError && (
                <p className="text-xs text-error mt-2 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {locationError}
                </p>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-outline-variant/10 flex justify-between items-center">
              <span className={cn(
                "text-[10px] font-bold",
                isInsideOffice ? "text-secondary" : "text-error"
              )}>
                SIGNAL: {isInsideOffice ? "EXCELLENT" : "WEAK"}
              </span>
              <button className="text-primary text-xs font-bold flex items-center gap-1 hover:underline">
                <MapPin className="w-3 h-3" /> Recenter
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
