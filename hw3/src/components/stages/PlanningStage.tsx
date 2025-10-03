import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Calendar, Plus, Trash2, BookOpen, CheckCircle, AlertTriangle } from 'lucide-react';
import { PlanningSchedule, ParsedCourse } from '@/types/course';
import { WeeklySchedule } from '../WeeklySchedule';
import { hasTimeConflict } from '@/data/courseLoader';

interface PlanningStageProps {
  schedules: { [key: string]: PlanningSchedule };
  activePlan: string;
  onSetActivePlan: (planId: string) => void;
  onCreateSchedule: (name: string) => void;
  onRemoveCourse: (courseId: string) => void;
  onSubmitRegistration: () => void;
}

export function PlanningStage({
  schedules,
  activePlan,
  onSetActivePlan,
  onCreateSchedule,
  onRemoveCourse,
  onSubmitRegistration
}: PlanningStageProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const activeSchedule = schedules[activePlan];
  const scheduleValues = Object.values(schedules);

  // Check for conflicts in current schedule
  const conflicts = React.useMemo(() => {
    if (!activeSchedule) return [];
    
    const conflictList: { course1: ParsedCourse; course2: ParsedCourse }[] = [];
    
    for (let i = 0; i < activeSchedule.courses.length; i++) {
      for (let j = i + 1; j < activeSchedule.courses.length; j++) {
        if (hasTimeConflict(activeSchedule.courses[i], activeSchedule.courses[j])) {
          conflictList.push({
            course1: activeSchedule.courses[i],
            course2: activeSchedule.courses[j]
          });
        }
      }
    }
    
    return conflictList;
  }, [activeSchedule]);

  const handleCreatePlan = () => {
    if (newPlanName.trim()) {
      onCreateSchedule(newPlanName.trim());
      setNewPlanName('');
      setShowCreateDialog(false);
    }
  };

  const handleSubmit = () => {
    if (conflicts.length === 0) {
      onSubmitRegistration();
      setShowSubmitDialog(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Course Planning</h2>
          <p className="text-gray-600">
            Plan your schedule and check for conflicts
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Schedule Plan</DialogTitle>
                <DialogDescription>
                  Create a new planning schedule to experiment with different course combinations.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Plan name (e.g., Plan B)"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePlan} disabled={!newPlanName.trim()}>
                  Create Plan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => setShowSubmitDialog(true)}
                disabled={!activeSchedule?.courses.length}
              >
                Submit Registration
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Submit Course Registration</DialogTitle>
                <DialogDescription>
                  Review your course selection before submitting your registration.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Course Summary */}
                <div className="space-y-2">
                  <h4 className="font-medium">Selected Courses ({activeSchedule?.courses.length || 0})</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {activeSchedule?.courses.map((course) => (
                      <div key={course.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <div className="font-medium">{course.cou_cname}</div>
                          <div className="text-sm text-gray-600">{course.cou_code} • {course.credits} credits</div>
                        </div>
                        <Badge variant="outline">{course.credits} credits</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total Credits */}
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Total Credits:</span>
                  <span className="font-bold">{activeSchedule?.totalCredits || 0}</span>
                </div>

                {/* Conflicts Warning */}
                {conflicts.length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <div className="flex items-center space-x-2 text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Time Conflicts Detected</span>
                    </div>
                    <p className="text-sm text-red-600 mt-1">
                      Please resolve {conflicts.length} time conflict{conflicts.length > 1 ? 's' : ''} before submitting.
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={conflicts.length > 0}
                  className={conflicts.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm & Submit
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Schedule Tabs */}
      <Tabs value={activePlan} onValueChange={onSetActivePlan}>
        <TabsList>
          {scheduleValues.map((schedule) => (
            <TabsTrigger key={schedule.id} value={schedule.id}>
              {schedule.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {scheduleValues.map((schedule) => (
          <TabsContent key={schedule.id} value={schedule.id} className="space-y-6">
            {/* Schedule Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="text-2xl font-bold">{schedule.courses.length}</div>
                      <div className="text-sm text-gray-600">Courses</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="text-2xl font-bold">{schedule.totalCredits}</div>
                      <div className="text-sm text-gray-600">Total Credits</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    {conflicts.length > 0 ? (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    <div>
                      <div className="text-2xl font-bold">{conflicts.length}</div>
                      <div className="text-sm text-gray-600">Conflicts</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Conflicts Display */}
            {conflicts.length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-red-800">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Time Conflicts</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {conflicts.map((conflict, index) => (
                      <div key={index} className="p-3 bg-white border border-red-200 rounded">
                        <div className="text-sm text-red-800">
                          <strong>{conflict.course1.cou_cname}</strong> conflicts with{' '}
                          <strong>{conflict.course2.cou_cname}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Weekly Schedule */}
            <WeeklySchedule 
              courses={schedule.courses} 
              onRemoveCourse={onRemoveCourse}
            />

            {/* Course List */}
            {schedule.courses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Course List</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {schedule.courses.map((course) => (
                      <div key={course.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex-1">
                          <div className="font-medium">{course.cou_cname}</div>
                          <div className="text-sm text-gray-600">
                            {course.cou_ename} • {course.cou_code} • {course.instructor}
                          </div>
                          <div className="text-xs text-gray-500">
                            {course.timeSlots.map((slot, index) => (
                              <span key={index}>
                                {slot.day} {slot.start}-{slot.end}
                                {index < course.timeSlots.length - 1 && ', '}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{course.credits} credits</Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onRemoveCourse(course.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {schedule.courses.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">No courses added to this schedule yet</p>
                  <p className="text-sm text-gray-500">
                    Go to the Browse tab to add courses to your planning schedule
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
