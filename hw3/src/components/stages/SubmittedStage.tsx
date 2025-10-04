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
        showDeleteButton={false}
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
                        {slot.day} {slot.start.toString().padStart(2, '0')}:10-{slot.end.toString().padStart(2, '0')}:00
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
            <Button variant="outline" className="btn-enhanced btn-outline-enhanced border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 active:bg-orange-100 btn-press-animation">
              <span className="btn-icon-inner">
                <Edit3 className="h-4 w-4 mr-2" />
              </span>
              Modify Registration
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white shadow-2xl w-[90vw] max-w-4xl p-6">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-lg text-gray-900 leading-tight break-words">
                修改註冊 / Modify Registration
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-700 leading-relaxed">
                <div className="space-y-2">
                  <p className="break-words overflow-wrap-anywhere">您確定要修改已提交的註冊嗎？這將開啟修改介面。</p>
                  <p className="text-xs text-gray-600 break-words overflow-wrap-anywhere">Are you sure you want to modify your submitted registration? This will open the modification interface.</p>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowModifyDialog(false)} className="btn-enhanced btn-outline-enhanced w-full sm:w-auto text-sm btn-press-animation">
                取消 / Cancel
              </Button>
              <Button onClick={handleModify} className="btn-enhanced btn-warning-enhanced w-full sm:w-auto text-sm btn-press-animation">
                <span className="hidden sm:inline">繼續修改 / Proceed to Modification</span>
                <span className="sm:hidden">繼續修改 / Proceed</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" className="btn-enhanced btn-outline-enhanced border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 active:bg-red-100 btn-press-animation">
              <span className="btn-icon-inner">
                <RotateCcw className="h-4 w-4 mr-2" />
              </span>
              Start New Registration
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white shadow-2xl w-[95vw] max-w-7xl sm:max-w-7xl p-10">
            <DialogHeader className="space-y-6">
              <DialogTitle className="text-xl text-gray-900 leading-tight break-words">
                <span className="hidden sm:inline">開始新的註冊 / Start New Registration</span>
                <span className="sm:hidden">開始新的註冊</span>
              </DialogTitle>
              <DialogDescription className="text-lg text-gray-700 leading-relaxed">
                <div className="space-y-4">
                  <p className="break-words overflow-wrap-anywhere">這將清除您目前的註冊並開始新的課程選擇流程。您確定嗎？</p>
                  <p className="text-base text-gray-600 break-words overflow-wrap-anywhere">This will clear your current registration and start a new course selection process. Are you sure?</p>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-6 mt-8">
              <Button variant="outline" onClick={() => setShowResetDialog(false)} className="btn-enhanced btn-outline-enhanced w-full sm:w-auto text-base btn-press-animation">
                取消 / Cancel
              </Button>
              <Button onClick={handleReset} className="btn-enhanced btn-danger-enhanced w-full sm:w-auto text-base btn-press-animation">
                <span className="btn-icon-inner">
                  <RotateCcw className="h-5 w-5 mr-2" />
                </span>
                <span className="hidden xl:inline">確認並開始新註冊 / Confirm & Start New Registration</span>
                <span className="hidden lg:inline xl:hidden">確認並開始新註冊 / Confirm & Start New</span>
                <span className="hidden sm:inline lg:hidden">開始新註冊 / Start New</span>
                <span className="sm:hidden">開始新註冊</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
