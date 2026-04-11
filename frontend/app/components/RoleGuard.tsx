"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Stethoscope } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('super_admin' | 'branch_manager' | 'staff' | 'user')[];
}

export const RoleGuard = ({ children, allowedRoles }: RoleGuardProps) => {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user && !allowedRoles.includes(user.role)) {
        // Redirect to their own dashboard if they are in the wrong place
        switch (user.role) {
          case 'super_admin':
            router.push('/super-admin');
            break;
          case 'branch_manager':
            router.push('/manager');
            break;
          case 'staff':
            router.push('/staff');
            break;
          default:
            router.push('/');
        }
      }
    }
  }, [loading, isAuthenticated, user, allowedRoles, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-16 h-16 rounded-2xl bg-brand-sage flex items-center justify-center shadow-xl shadow-brand-sage/20 mb-6"
        >
          <Stethoscope className="w-8 h-8 text-white" />
        </motion.div>
        <div className="flex flex-col items-center">
          <h3 className="text-xl font-headline font-bold text-on-surface">Securing Session</h3>
          <p className="text-sm text-on-surface-variant mt-2 font-medium opacity-60">Initializing clinical workspace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (user && !allowedRoles.includes(user.role))) {
    return null; // Don't render anything while redirecting
  }

  return <>{children}</>;
};
