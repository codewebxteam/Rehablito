"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AttendanceRecord } from '../types';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Geofence {
  branchName: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  shiftStart?: string;
  shiftEnd?: string;
}

interface AttendanceContextType {
  records: AttendanceRecord[];
  activeRecord: AttendanceRecord | null;
  branchName: string | null;
  geofence: Geofence | null;
  checkIn: (ward?: string) => Promise<void>;
  checkOut: (isAutoCheckout?: boolean) => Promise<void>; // Updated type signature
  isInsideOffice: boolean;
  locationError: string | null;
  currentLocation: { lat: number; lng: number } | null;
  elapsedTime: number;
  isProcessing: boolean;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
};

const getCurrentPosition = (): Promise<GeolocationPosition> =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
  });

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRecord, setActiveRecord] = useState<AttendanceRecord | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [geofence, setGeofence] = useState<Geofence | null>(null);
  const [branchName, setBranchName] = useState<string | null>(null);
  const [isInsideOffice, setIsInsideOffice] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const wardRef = useRef<string>('');

  const fetchRecords = useCallback(async () => {
    try {
      const { data } = await api.get('/staff/attendance/history');
      if (data.success) {
        setRecords(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  }, []);

  // Initial load: geofence + duty status + history
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [geoRes, dutyRes] = await Promise.all([
          api.get('/staff/geofence'),
          api.get('/staff/duty-status'),
        ]);
        
        if (geoRes.data.success) {
          const g = geoRes.data.data as Geofence;
          setGeofence(g);
          setBranchName(g.branchName);
        }
        
        if (dutyRes.data.success) {
          const duty = dutyRes.data.data;
          if (duty.isOnDuty && duty.checkInTime) {
            setActiveRecord({
              id: 'active',
              userId: '',
              date: duty.checkInTime,
              checkIn: duty.checkInTime,
              status: 'on_duty',
              ward: wardRef.current || branchName || 'Your branch',
            });
            setElapsedTime(duty.elapsedSeconds || 0);
          }
        }
        
        // Fetch history
        void fetchRecords();
      } catch (err) {
        console.error('Failed to bootstrap attendance:', err);
      }
    };
    bootstrap();
  }, [fetchRecords, branchName]);

  const updateLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        if (geofence) {
          const dist = calculateDistance(latitude, longitude, geofence.latitude, geofence.longitude);
          const radius = geofence.radiusMeters || 200;
          // Add 150m buffer for indoor GPS inaccuracy
          setIsInsideOffice(dist <= (radius + 150));
        }
        setLocationError(null);
      },
      (error) => {
        setLocationError(error.message);
        setIsInsideOffice(false);
      },
      { enableHighAccuracy: true }
    );
  }, [geofence]);

  useEffect(() => {
    updateLocation();
    const interval = setInterval(updateLocation, 10000); // Check location every 10 seconds
    return () => clearInterval(interval);
  }, [updateLocation]);

  // Tick elapsed seconds while on duty
  useEffect(() => {
    if (!activeRecord) {
      setElapsedTime(0);
      return;
    }
    const interval = setInterval(() => {
      const start = new Date(activeRecord.checkIn).getTime();
      setElapsedTime(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeRecord]);

  const checkIn = async (ward?: string) => {
    if (isProcessing) return;
    if (ward) wardRef.current = ward;
    setIsProcessing(true);
    setLocationError(null);
    try {
      const pos = await getCurrentPosition();
      const { data } = await api.post('/staff/check-in', {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      
      if (data.success) {
        toast.success('Successfully checked in!');
        const checkInIso = data.data.checkInTime || new Date().toISOString();
        setActiveRecord({
          id: data.data._id,
          userId: data.data.userId?._id || data.data.userId || '',
          date: checkInIso,
          checkIn: checkInIso,
          status: 'on_duty',
          ward: ward || wardRef.current || branchName || 'Your branch',
        });
        void fetchRecords();
      } else {
        toast.error(data.message || 'Check-in failed');
        setLocationError(data.message || 'Check-in failed');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      const errorMsg = axiosErr?.response?.data?.message || axiosErr?.message || 'Check-in failed';
      toast.error(errorMsg);
      setLocationError(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const checkOut = async (isAutoCheckout = false) => {
    if (!activeRecord || isProcessing) return;
    setIsProcessing(true);
    try {
      // Adding isAutoCheckout flag to payload incase backend wants to track system logouts
      let payload: { latitude?: number; longitude?: number; isAutoCheckout?: boolean } = {
        isAutoCheckout
      };
      try {
        const pos = await getCurrentPosition();
        payload.latitude = pos.coords.latitude;
        payload.longitude = pos.coords.longitude;
      } catch {
        // Location optional on check-out based on your backend
      }
      const { data } = await api.post('/staff/check-out', payload);
      
      if (data.success) {
        if (isAutoCheckout) {
          toast.error('You moved outside the office radius. Auto-checked out!', { duration: 6000 });
        } else {
          toast.success('Successfully checked out. Great job today!');
        }
        setActiveRecord(null);
        void fetchRecords();
      } else {
        toast.error(data.message || 'Check-out failed');
        setLocationError(data.message || 'Check-out failed');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      const errorMsg = axiosErr?.response?.data?.message || axiosErr?.message || 'Check-out failed';
      toast.error(errorMsg);
      setLocationError(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  // 🔥 REMOVED AGGRESSIVE LOGIC: AUTO-CHECKOUT WHEN LEAVING GEOFENCE 🔥
  // GPS drift frequently triggers false positive auto-checkouts for indoor mobile users.
  useEffect(() => {
    // Left empty or commented out to prevent random checkouts
  }, [isInsideOffice, locationError, activeRecord, currentLocation]);

  return (
    <AttendanceContext.Provider value={{
      records,
      activeRecord,
      branchName,
      geofence,
      checkIn,
      checkOut,
      isInsideOffice,
      locationError,
      currentLocation,
      elapsedTime,
      isProcessing,
    }}>
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (context === undefined) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};