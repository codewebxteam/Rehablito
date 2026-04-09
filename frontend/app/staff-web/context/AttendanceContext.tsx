"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AttendanceRecord, OFFICE_LOCATION } from '../types';
import { differenceInSeconds, format, parseISO } from 'date-fns';

interface AttendanceContextType {
  records: AttendanceRecord[];
  activeRecord: AttendanceRecord | null;
  checkIn: (ward: string) => void;
  checkOut: () => void;
  isInsideOffice: boolean;
  locationError: string | null;
  currentLocation: { lat: number; lng: number } | null;
  elapsedTime: number; // seconds
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [activeRecord, setActiveRecord] = useState<AttendanceRecord | null>(null);

  const [isInsideOffice, setIsInsideOffice] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Load from local storage on first render (Client-size hydration safe)
  useEffect(() => {
    const savedRecords = localStorage.getItem('attendance_records');
    if (savedRecords) {
      setRecords(JSON.parse(savedRecords));
    }
    const savedActive = localStorage.getItem('active_attendance_record');
    if (savedActive && savedActive !== "undefined") {
      try {
        setActiveRecord(JSON.parse(savedActive));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Calculate distance using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
  };

  const updateLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        const dist = calculateDistance(latitude, longitude, OFFICE_LOCATION.lat, OFFICE_LOCATION.lng);
        setIsInsideOffice(dist <= OFFICE_LOCATION.radius);
        setLocationError(null);
      },
      (error) => {
        setLocationError(error.message);
        setIsInsideOffice(false);
      },
      { enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => {
    updateLocation();
    const interval = setInterval(updateLocation, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, [updateLocation]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeRecord) {
      interval = setInterval(() => {
        const seconds = differenceInSeconds(new Date(), parseISO(activeRecord.checkIn));
        setElapsedTime(seconds);
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [activeRecord]);

  useEffect(() => {
    localStorage.setItem('attendance_records', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('active_attendance_record', JSON.stringify(activeRecord));
  }, [activeRecord]);

  const checkIn = (ward: string) => {
    // For preview/demo, we allow clock-in but log a warning if outside.
    if (!isInsideOffice) {
      console.warn("Clocking in outside geofence (Demo Mode enabled)");
    }
    
    const newRecord: AttendanceRecord = {
      id: Math.random().toString(36).substr(2, 9),
      userId: "1", // Mock user ID
      date: new Date().toISOString(),
      checkIn: new Date().toISOString(),
      status: 'IN_PROGRESS',
      ward
    };
    setActiveRecord(newRecord);
  };

  const checkOut = () => {
    if (!activeRecord) return;
    const checkOutTime = new Date();
    const totalSeconds = differenceInSeconds(checkOutTime, parseISO(activeRecord.checkIn));
    const totalHours = totalSeconds / 3600;
    
    let status: AttendanceRecord['status'] = 'COMPLETED';
    if (totalHours > 9) status = 'OVERTIME';
    if (totalHours < 8) status = 'SHORT_SHIFT';

    const completedRecord: AttendanceRecord = {
      ...activeRecord,
      checkOut: checkOutTime.toISOString(),
      totalHours,
      status
    };

    setRecords(prev => [completedRecord, ...prev]);
    setActiveRecord(null);
  };

  return (
    <AttendanceContext.Provider value={{
      records,
      activeRecord,
      checkIn,
      checkOut,
      isInsideOffice,
      locationError,
      currentLocation,
      elapsedTime
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
