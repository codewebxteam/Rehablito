import React, { useState } from 'react';
import { Calendar as CalendarIcon, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '../../manager/lib/utils';

export default function AttendanceView({ data }: { data: any }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  if (!data) return null;
  const { records, summary } = data;

  // Simple calendar logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const getAttendanceForDay = (day: number) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
    return records.find((r: any) => new Date(r.date).toISOString().split('T')[0] === targetDate);
  };

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-headline font-bold text-on-background">Attendance</h1>
        <p className="text-on-surface-variant font-medium mt-1">Track therapy session attendance.</p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-outline-variant/20 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-brand-sage/10 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-brand-sage" />
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Present</p>
            <p className="text-2xl font-black text-on-background">{summary.totalPresent}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-outline-variant/20 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
            <XCircle className="w-6 h-6 text-error" />
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Absent / Leave</p>
            <p className="text-2xl font-black text-on-background">{/* Calculate absent based on expected vs present */ 0}</p>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-3xl border border-outline-variant/20 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" /> {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 border border-outline-variant/30 rounded-xl hover:bg-surface-container-low transition-colors">&lt;</button>
            <button onClick={nextMonth} className="p-2 border border-outline-variant/30 rounded-xl hover:bg-surface-container-low transition-colors">&gt;</button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-on-surface-variant uppercase tracking-wider">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {blanks.map(b => <div key={`blank-${b}`} className="aspect-square rounded-xl bg-surface-container-lowest/50" />)}
          {days.map(day => {
            const att = getAttendanceForDay(day);
            const isToday = new Date().toISOString().split('T')[0] === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
            
            return (
              <div 
                key={day} 
                className={cn(
                  "aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium border border-transparent transition-all",
                  att ? (att.status === 'checked_out' ? "bg-brand-sage/20 text-brand-sage border-brand-sage/30" : "bg-primary/10 text-primary border-primary/20") 
                      : "bg-surface-container-low text-on-surface hover:bg-outline-variant/20",
                  isToday && !att && "border-outline text-on-background font-bold shadow-sm"
                )}
              >
                <span>{day}</span>
                {att && <div className="w-1.5 h-1.5 rounded-full mt-1 bg-current" />}
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 flex flex-wrap gap-4 text-xs font-medium text-on-surface-variant">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-primary/20" /> Active Session</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-brand-sage/20" /> Completed</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-surface-container-low border border-outline-variant/50" /> No Session</div>
        </div>
      </div>
      
      {/* Recent Records List */}
      <div className="bg-white rounded-3xl border border-outline-variant/20 shadow-sm p-6">
         <h2 className="text-lg font-bold mb-4">Recent Sessions</h2>
         <div className="space-y-3">
           {records.slice(0, 5).map((record: any) => (
             <div key={record.id} className="flex justify-between items-center p-3 border border-outline-variant/10 rounded-xl">
               <div>
                 <p className="font-bold">{new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                 <p className="text-xs text-on-surface-variant mt-0.5">
                   In: {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'} 
                   {' '} | {' '}
                   Out: {record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}
                 </p>
               </div>
               <span className={cn(
                 "px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full",
                 record.status === 'checked_out' ? "bg-brand-sage/10 text-brand-sage" : "bg-primary/10 text-primary"
               )}>
                 {record.status === 'checked_out' ? 'Completed' : 'In Progress'}
               </span>
             </div>
           ))}
           {records.length === 0 && <p className="text-sm text-on-surface-variant text-center py-4">No recent attendance records.</p>}
         </div>
      </div>
    </div>
  );
}
