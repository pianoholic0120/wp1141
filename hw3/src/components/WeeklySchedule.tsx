import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Trash2, Clock } from 'lucide-react';
import { ParsedCourse } from '@/types/course';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';

interface WeeklyScheduleProps {
  courses: ParsedCourse[];
  onRemoveCourse: (courseId: string) => void;
  showDeleteButton?: boolean;
}

const TIME_SLOTS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
];

// Helper function to get time string from hour number
const getTimeString = (hour: number): string => {
  return `${hour.toString().padStart(2, '0')}:00`;
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const COLORS = [
  'bg-blue-100 border-blue-300 text-blue-800',
  'bg-green-100 border-green-300 text-green-800',
  'bg-purple-100 border-purple-300 text-purple-800',
  'bg-orange-100 border-orange-300 text-orange-800',
  'bg-pink-100 border-pink-300 text-pink-800',
  'bg-indigo-100 border-indigo-300 text-indigo-800',
  'bg-yellow-100 border-yellow-300 text-yellow-800',
  'bg-red-100 border-red-300 text-red-800',
];

export function WeeklySchedule({ courses, onRemoveCourse, showDeleteButton = true }: WeeklyScheduleProps) {
  // Create a grid of time slots and days
  const scheduleGrid = React.useMemo(() => {
    const grid: { [key: string]: { [key: string]: ParsedCourse[] } } = {};
    
    console.log('WeeklySchedule: Processing courses:', courses.length);
    courses.forEach(course => {
      console.log(`Course: ${course.cou_cname}, timeSlots:`, course.timeSlots);
    });
    
    // Initialize grid
    DAYS.forEach(day => {
      grid[day] = {};
      TIME_SLOTS.forEach(time => {
        grid[day][time] = [];
      });
    });

    // Fill grid with courses
    courses.forEach((course, index) => {
      const colorClass = COLORS[index % COLORS.length];
      course.timeSlots.forEach(slot => {
        const timeString = getTimeString(slot.start);
        console.log(`Adding course ${course.cou_cname} to grid: ${slot.day} at ${timeString}`);
        if (grid[slot.day] && grid[slot.day][timeString]) {
          grid[slot.day][timeString].push({ ...course, colorClass });
        }
      });
    });

    console.log('Final grid:', grid);
    return grid;
  }, [courses]);


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Weekly Schedule</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header */}
            <div className="grid grid-cols-8 gap-1 mb-2">
              <div className="p-2 text-sm font-medium text-gray-600">Time</div>
              {DAYS.map(day => (
                <div key={day} className="p-2 text-sm font-medium text-center text-gray-600">
                  {day}
                </div>
              ))}
            </div>

            {/* Time slots */}
            {TIME_SLOTS.map(timeSlot => (
              <div key={timeSlot} className="grid grid-cols-8 gap-1 mb-1">
                <div className="p-2 text-xs text-gray-500 border-r">
                  {timeSlot}
                </div>
                {DAYS.map(day => {
                  const coursesAtTime = scheduleGrid[day][timeSlot];
                  const isFirstTimeSlot = coursesAtTime.length > 0 && 
                    coursesAtTime[0].timeSlots.some(ts => ts.day === day && getTimeString(ts.start) === timeSlot);
                  
                  if (isFirstTimeSlot) {
                    const course = coursesAtTime[0];
                    const duration = course.timeSlots.find(ts => ts.day === day && getTimeString(ts.start) === timeSlot);
                    const startIndex = TIME_SLOTS.indexOf(timeSlot);
                    const endTimeString = duration ? getTimeString(duration.end) : timeSlot;
                    const endIndex = TIME_SLOTS.indexOf(endTimeString);
                    const height = Math.max(1, endIndex - startIndex);
                    
                    return (
                      <div 
                        key={`${day}-${timeSlot}`} 
                        className={`border rounded p-1 text-xs relative group ${course.colorClass}`}
                        style={{ gridRow: `span ${height}` }}
                      >
                        <div className="font-medium truncate">{course.cou_cname}</div>
                        <div className="text-xs opacity-75 truncate">{course.cou_code}</div>
                        <div className="text-xs opacity-75">{course.instructor}</div>
                        {showDeleteButton && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="btn-enhanced btn-ghost-enhanced absolute top-0 right-0 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity btn-press-animation"
                              >
                                <span className="btn-icon-inner">
                                  <Trash2 className="h-3 w-3" />
                                </span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  確認刪除課程 / Confirm Delete Course
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  <div className="space-y-2">
                                    <p>您確定要從計劃中移除「{course.cou_cname}」嗎？此操作無法復原。</p>
                                    <p className="text-sm text-gray-600">Are you sure you want to remove "{course.cou_cname}" from your plan? This action cannot be undone.</p>
                                  </div>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="btn-enhanced btn-outline-enhanced btn-press-animation">取消 / Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onRemoveCourse(course.id)}
                                  className="btn-enhanced btn-danger-enhanced btn-press-animation"
                                >
                                  刪除 / Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    );
                  }
                  
                  return <div key={`${day}-${timeSlot}`} className="border border-gray-200 min-h-[60px]" />;
                })}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
