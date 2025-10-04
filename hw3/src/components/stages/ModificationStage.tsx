import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AlertTriangle, Save, X, Plus, Trash2, CheckCircle } from 'lucide-react';
import { AppState, ParsedCourse } from '@/types/course';
import { BrowseStage } from './BrowseStage';
import { useCourseData } from '../../hooks/useCourseData';

interface ModificationStageProps {
  originalRegistration: AppState['submittedRegistration'];
  onCompleteModification: (courses: ParsedCourse[]) => void;
  onCancel: () => void;
  onNavigateToBrowse?: () => void;
}

export function ModificationStage({
  originalRegistration,
  onCompleteModification,
  onCancel,
  onNavigateToBrowse
}: ModificationStageProps) {
  const [currentCourses, setCurrentCourses] = useState<ParsedCourse[]>(originalRegistration?.courses || []);
  const [reason, setReason] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showBrowseDialog, setShowBrowseDialog] = useState(false);

  const { filteredCourses, loading, error, refreshData } = useCourseData();

  // Calculate changes
  const changes = useMemo(() => {
    const added: ParsedCourse[] = [];
    const removed: ParsedCourse[] = [];
    const modified: { original: ParsedCourse; current: ParsedCourse }[] = [];

    // Find added courses
    currentCourses.forEach(course => {
      if (!originalRegistration?.courses.find(orig => orig.id === course.id)) {
        added.push(course);
      }
    });

    // Find removed courses
    originalRegistration?.courses.forEach(origCourse => {
      if (!currentCourses.find(curr => curr.id === origCourse.id)) {
        removed.push(origCourse);
      }
    });

    return { added, removed, modified };
  }, [currentCourses, originalRegistration?.courses]);

  const totalChanges = changes.added.length + changes.removed.length + changes.modified.length;

  const handleAddCourse = (course: ParsedCourse) => {
    if (!currentCourses.find(c => c.id === course.id)) {
      setCurrentCourses([...currentCourses, course]);
    }
    setShowBrowseDialog(false);
  };

  const handleRemoveCourse = (courseId: string) => {
    setCurrentCourses(currentCourses.filter(c => c.id !== courseId));
  };

  const handleComplete = () => {
    onCompleteModification(currentCourses);
    setShowConfirmDialog(false);
  };

  const totalCredits = currentCourses.reduce((sum, course) => sum + course.credits, 0);

  return (
    <div className="space-y-6">
      {/* Warning Header */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-orange-800">
          <AlertTriangle className="h-6 w-6" />
          <div>
            <h2 className="text-xl font-bold">Modification Mode</h2>
            <p className="text-sm text-orange-700">
              Changes will affect your submitted registration. Please review carefully.
            </p>
          </div>
        </div>
      </div>

      {/* Reason for Modification */}
      <Card>
        <CardHeader>
          <CardTitle>Reason for Modification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-base font-medium text-gray-900">Modification Type</label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent className="z-[10000]">
                  <SelectItem value="add">Add Course</SelectItem>
                  <SelectItem value="drop">Drop Course</SelectItem>
                  <SelectItem value="swap">Swap Course</SelectItem>
                  <SelectItem value="adjust">Adjust Schedule</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <label className="text-base font-medium text-gray-900">Additional Notes (Optional)</label>
              <Input placeholder="Enter additional notes..." className="bg-white border-gray-300" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Changes Summary */}
      {totalChanges > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              <span>Pending Changes ({totalChanges})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {changes.added.length > 0 && (
                <div>
                  <h4 className="font-medium text-green-800 mb-2">Added Courses:</h4>
                  {changes.added.map((course) => (
                    <div key={course.id} className="flex items-center justify-between p-2 bg-green-100 border border-green-200 rounded">
                      <span className="text-sm text-green-800">
                        ➕ {course.cou_cname} ({course.credits} credits)
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveCourse(course.id)}
                        className="text-green-700 border-green-300 hover:bg-green-200"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {changes.removed.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-800 mb-2">Removed Courses:</h4>
                  {changes.removed.map((course) => (
                    <div key={course.id} className="flex items-center justify-between p-2 bg-red-100 border border-red-200 rounded">
                      <span className="text-sm text-red-800 line-through">
                        ➖ {course.cou_cname} ({course.credits} credits)
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentCourses([...currentCourses, course])}
                        className="text-red-700 border-red-300 hover:bg-red-200"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Schedule */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Current Schedule</CardTitle>
            <Button
              onClick={() => onNavigateToBrowse?.()}
              variant="outline"
              size="sm"
              className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              <Plus className="h-4 w-4 mr-2" />
              Browse & Add Course
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {currentCourses.map((course) => (
              <div key={course.id} className="flex items-center justify-between p-3 border rounded">
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveCourse(course.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {currentCourses.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No courses in current schedule
              </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Credits:</span>
              <span className="font-bold">{totalCredits}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button onClick={onCancel} variant="outline">
          <X className="h-4 w-4 mr-2" />
          Cancel Modification
        </Button>
        
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <Button 
            onClick={() => setShowConfirmDialog(true)}
            disabled={totalChanges === 0}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Save className="h-4 w-4 mr-2" />
            Complete Modification
          </Button>
          <DialogContent className="max-w-2xl bg-white shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl text-gray-900">Confirm Modification</DialogTitle>
              <DialogDescription className="text-lg text-gray-700">
                Review your changes before updating your registration.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Change Summary */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Changes Summary:</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-green-100 border border-green-200 rounded-lg">
                    <div className="text-3xl font-bold text-green-800">+{changes.added.length}</div>
                    <div className="text-base text-green-600 font-medium">Added</div>
                  </div>
                  <div className="p-4 bg-red-100 border border-red-200 rounded-lg">
                    <div className="text-3xl font-bold text-red-800">-{changes.removed.length}</div>
                    <div className="text-base text-red-600 font-medium">Removed</div>
                  </div>
                  <div className="p-4 bg-blue-100 border border-blue-200 rounded-lg">
                    <div className="text-3xl font-bold text-blue-800">{totalCredits}</div>
                    <div className="text-base text-blue-600 font-medium">Total Credits</div>
                  </div>
                </div>
              </div>

              {/* Original vs Current */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Original Registration</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto bg-gray-50 p-3 rounded-lg">
                    {originalRegistration?.courses.map((course) => (
                      <div key={course.id} className="text-base p-3 bg-white border border-gray-200 rounded-lg">
                        {course.cou_cname} ({course.credits} credits)
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Updated Registration</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto bg-gray-50 p-3 rounded-lg">
                    {currentCourses.map((course) => (
                      <div key={course.id} className="text-base p-3 bg-white border border-gray-200 rounded-lg">
                        {course.cou_cname} ({course.credits} credits)
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Confirmation Checkbox */}
              <div className="flex items-center space-x-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <CheckCircle className="h-6 w-6 text-orange-600" />
                <span className="text-base text-orange-800 font-medium">
                  I understand these changes will update my official registration
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleComplete}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Confirm Modification
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Browse Dialog for Adding Courses */}
      <Dialog open={showBrowseDialog} onOpenChange={setShowBrowseDialog}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden bg-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-gray-900">Add Course to Modified Schedule</DialogTitle>
            <DialogDescription className="text-lg text-gray-700">
              Browse and add courses to your modified registration.
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-[60vh]">
            <BrowseStage
              courses={filteredCourses}
              loading={loading}
              error={error}
              filters={{ department: [], year: [], credits: [], search: '' }}
              onUpdateFilters={() => {}}
              onAddToPlanning={handleAddCourse}
              onRefreshData={refreshData}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBrowseDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
