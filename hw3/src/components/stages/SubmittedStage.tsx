import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { CheckCircle, Edit3, RotateCcw, Calendar, BookOpen, Users, Clock } from 'lucide-react';
import { AppState } from '@/types/course';
import { WeeklySchedule } from '../WeeklySchedule';

interface SubmittedStageProps {
  registration: NonNullable<AppState['submittedRegistration']>;
  onStartModification: () => void;
  onReset: () => void;
}

export function SubmittedStage({
  registration,
  onStartModification,
  onReset
}: SubmittedStageProps) {
  const [showModifyDialog, setShowModifyDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const totalCredits = registration.courses.reduce((sum, course) => sum + course.credits, 0);

  const handleModify = () => {
    onStartModification();
    setShowModifyDialog(false);
  };

  const handleReset = () => {
    onReset();
    setShowResetDialog(false);
  };

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center py-8">
        <CheckCircle className="h-16 w-16 mx-auto text-green-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Submitted Successfully!</h2>
        <p className="text-gray-600 mb-4">
          準備好迎接新學期了！Good luck with your courses!
        </p>
        <Badge variant="secondary" className="bg-green-100 text-green-800 text-lg px-4 py-2">
          Confirmation: {registration.confirmationNumber}
        </Badge>
      </div>

      {/* Registration Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{new Date(registration.timestamp).toLocaleDateString()}</div>
                <div className="text-sm text-gray-600">Submitted</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{registration.courses.length}</div>
                <div className="text-sm text-gray-600">Courses</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{totalCredits}</div>
                <div className="text-sm text-gray-600">Total Credits</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">100%</div>
                <div className="text-sm text-gray-600">Complete</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Schedule */}
      <WeeklySchedule 
        courses={registration.courses} 
        onRemoveCourse={() => {}} // Read-only in submitted state
      />

      {/* Course List */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {registration.courses.map((course) => (
              <div key={course.id} className="flex items-center justify-between p-3 border rounded bg-gray-50">
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
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Registered
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Important Dates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Important Dates</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Semester Start:</span>
              <Badge variant="outline">2025 Spring Semester</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Add/Drop Deadline:</span>
              <Badge variant="outline">Week 2 (Mock)</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Last Modified:</span>
              <span className="text-sm text-gray-600">
                {new Date(registration.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Dialog open={showModifyDialog} onOpenChange={setShowModifyDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50">
              <Edit3 className="h-4 w-4 mr-2" />
              Modify Registration
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl text-gray-900">Modify Registration</DialogTitle>
              <DialogDescription className="text-lg text-gray-700">
                Are you sure you want to modify your submitted registration? This will open the modification interface.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowModifyDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleModify} className="bg-orange-600 hover:bg-orange-700">
                Proceed to Modification
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Start New Registration
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl text-gray-900">Start New Registration</DialogTitle>
              <DialogDescription className="text-lg text-gray-700">
                This will clear your current registration and start a new course selection process. Are you sure?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowResetDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleReset} variant="destructive">
                Start New Registration
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
