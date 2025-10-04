import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Search, Filter, Grid, List, Plus, Clock, Users, BookOpen, RefreshCw, Check, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { ParsedCourse, AppState } from '@/types/course';
import { toast } from 'sonner';

// Helper function to format time slots display
const formatTimeSlotsDisplay = (timeSlots: ParsedCourse['timeSlots']): string => {
  if (timeSlots.length === 0) return 'TBA';
  
  // Group by day and collect time codes
  const dayGroups: { [key: string]: string[] } = {};
  timeSlots.forEach(slot => {
    if (!dayGroups[slot.day]) {
      dayGroups[slot.day] = [];
    }
    // Map start hour back to time code
    const timeCodeMap: { [key: number]: string } = {
      7: '0', 8: '1', 9: '2', 10: '3', 11: '4', 12: '5', 
      13: '6', 14: '7', 15: '8', 16: '9', 18: 'A', 19: 'B', 20: 'C', 21: 'D'
    };
    const timeCode = timeCodeMap[slot.start];
    if (timeCode && !dayGroups[slot.day].includes(timeCode)) {
      dayGroups[slot.day].push(timeCode);
    }
  });
  
  return Object.entries(dayGroups)
    .map(([day, codes]) => `${day} ${codes.sort().join('')}`)
    .join(', ');
};

interface BrowseStageProps {
  courses: ParsedCourse[];
  loading: boolean;
  error: string | null;
  filters: AppState['filters'];
  onUpdateFilters: (filters: Partial<AppState['filters']>) => void;
  onAddToPlanning: (course: ParsedCourse) => void;
  onRefreshData: () => void;
  onNavigateToPlanning?: () => void;
}

export function BrowseStage({ 
  courses, 
  loading, 
  error, 
  filters, 
  onUpdateFilters, 
  onAddToPlanning, 
  onRefreshData,
  onNavigateToPlanning
}: BrowseStageProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [pendingFilters, setPendingFilters] = useState(filters);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(500);
  const [filtersApplied, setFiltersApplied] = useState(false);

  // Extract unique filter options
  const filterOptions = useMemo(() => {
    const departments = [...new Set(courses.map(c => c.department))].filter(Boolean);
    const years = [...new Set(courses.map(c => c.year))].filter(Boolean);
    // Filter credits to only show reasonable values (0-6 credits typically)
    const allCredits = [...new Set(courses.map(c => c.credit))].filter(Boolean);
    const credits = allCredits.filter(credit => {
      const creditNum = parseInt(credit);
      return !isNaN(creditNum) && creditNum >= 0 && creditNum <= 6;
    }).sort((a, b) => parseInt(a) - parseInt(b));
    
    return { departments, years, credits };
  }, [courses]);

  // Calculate pagination
  const totalPages = Math.ceil(courses.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCourses = courses.slice(startIndex, endIndex);

  // Calculate page numbers for pagination
  const pageNumbers = useMemo(() => {
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start if we're near the end
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Sync pending filters with actual filters when filters change
  React.useEffect(() => {
    setPendingFilters(filters);
    setFiltersApplied(true); // 標記為已套用
  }, [filters]);

  // Reset to first page when courses change and validate current page
  React.useEffect(() => {
    const newTotalPages = Math.ceil(courses.length / pageSize);
    console.log('Courses changed. Current page:', currentPage, 'New total pages:', newTotalPages, 'Courses length:', courses.length);
    
    if (currentPage > newTotalPages && newTotalPages > 0) {
      console.log('Adjusting current page from', currentPage, 'to', newTotalPages);
      setCurrentPage(newTotalPages);
    } else if (courses.length === 0) {
      console.log('No courses, setting page to 1');
      setCurrentPage(1);
    }
  }, [courses, pageSize]); // Remove currentPage from dependencies to prevent infinite loop

  const handleFilterChange = (key: keyof AppState['filters'], value: any) => {
    console.log('BrowseStage: Filter change', key, value);
    const updatedFilters = { ...pendingFilters, [key]: value };
    setPendingFilters(updatedFilters);
    setFiltersApplied(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;
    console.log('BrowseStage: Search change', searchValue);
    const updatedFilters = { ...pendingFilters, search: searchValue };
    setPendingFilters(updatedFilters);
    setFiltersApplied(false);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      console.log('BrowseStage: Search submitted via Enter key');
      handleApplyFilters();
    }
  };

  const handleApplyFilters = () => {
    console.log('BrowseStage: Applying filters', pendingFilters);
    onUpdateFilters(pendingFilters);
    setFiltersApplied(true);
    setCurrentPage(1);
    setShowFilters(false); // 自動收回篩選介面
    toast.success("篩選條件已套用", {
      description: "已根據您設定的條件篩選課程",
    });
  };


  const handleResetFilters = () => {
    const resetFilters = { department: [], year: [], credits: [], search: '' };
    setPendingFilters(resetFilters);
    onUpdateFilters(resetFilters);
    setFiltersApplied(true);
    setCurrentPage(1);
    setShowFilters(false);
    toast.info("篩選條件已重置", {
      description: "所有篩選條件已清除",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading course data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={onRefreshData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 w-full">
      {/* Time Reference Table - Left Side */}
      <div className="w-80 flex-shrink-0">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>節次時間對照表</span>
            </CardTitle>
            <CardDescription>
              課程節次與時間對照
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="font-medium text-center bg-gray-100 p-2 rounded">節次</div>
                <div className="font-medium text-center bg-gray-100 p-2 rounded">開始時間</div>
                <div className="font-medium text-center bg-gray-100 p-2 rounded">結束時間</div>
              </div>
              {[
                { code: '0', start: '07:10', end: '08:00' },
                { code: '1', start: '08:10', end: '09:00' },
                { code: '2', start: '09:10', end: '10:00' },
                { code: '3', start: '10:20', end: '11:10' },
                { code: '4', start: '11:20', end: '12:10' },
                { code: '5', start: '12:20', end: '13:10' },
                { code: '6', start: '13:20', end: '14:10' },
                { code: '7', start: '14:20', end: '15:10' },
                { code: '8', start: '15:30', end: '16:20' },
                { code: '9', start: '16:30', end: '17:20' },
                { code: 'A', start: '18:25', end: '19:15' },
                { code: 'B', start: '19:20', end: '20:10' },
                { code: 'C', start: '20:15', end: '21:05' },
                { code: 'D', start: '21:10', end: '22:00' },
              ].map(({ code, start, end }) => (
                <div key={code} className="grid grid-cols-3 gap-2 text-sm">
                  <div className="font-medium text-center bg-blue-50 p-2 rounded border">{code}</div>
                  <div className="text-center p-2 border">{start}</div>
                  <div className="text-center p-2 border">{end}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Course Catalog</h2>
                  <p className="text-lg text-gray-600">
                    Explore {courses.length} available courses
                    {totalPages > 1 && (
                      <span className="ml-2">
                        (Page {currentPage} of {totalPages})
                      </span>
                    )}
                  </p>
                </div>
        
                <div className="flex items-center space-x-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Filters
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>開啟篩選選項</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <div className="flex items-center border rounded-md">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={viewMode === 'grid' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('grid')}
                          className="rounded-r-none"
                        >
                          <Grid className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>網格檢視</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={viewMode === 'list' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('list')}
                          className="rounded-l-none"
                        >
                          <List className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>清單檢視</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search courses, instructors, or course codes..."
                    value={pendingFilters.search}
                    onChange={handleSearchChange}
                    onKeyPress={handleSearchKeyPress}
                    className="pl-12 text-base h-12"
                  />
                </div>

                {/* Filter Panel */}
                {showFilters && (
                  <Card className="relative z-[9999] shadow-2xl bg-white border border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-xl text-gray-900">Filters</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Department Filter */}
                        <div className="space-y-3">
                          <label className="text-base font-medium text-gray-900">Department</label>
                          <Select
                            value={pendingFilters.department[0] || 'all'}
                            onValueChange={(value) => handleFilterChange('department', value !== 'all' ? [value] : [])}
                          >
                            <SelectTrigger className="bg-white border-gray-300">
                              <SelectValue placeholder="All departments" />
                            </SelectTrigger>
                            <SelectContent className="z-[10000]">
                              <SelectItem value="all">All departments</SelectItem>
                              {filterOptions.departments.map((dept) => (
                                <SelectItem key={dept} value={dept}>
                                  {dept}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Year Filter */}
                        <div className="space-y-3">
                          <label className="text-base font-medium text-gray-900">Year</label>
                          <Select
                            value={pendingFilters.year[0] || 'all'}
                            onValueChange={(value) => handleFilterChange('year', value !== 'all' ? [value] : [])}
                          >
                            <SelectTrigger className="bg-white border-gray-300">
                              <SelectValue placeholder="All years" />
                            </SelectTrigger>
                            <SelectContent className="z-[10000]">
                              <SelectItem value="all">All years</SelectItem>
                              {filterOptions.years.map((year) => (
                                <SelectItem key={year} value={year}>
                                  Year {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                {/* Credits Filter */}
                <div className="space-y-3">
                  <label className="text-base font-medium text-gray-900">Credits</label>
                  <Select
                    value={pendingFilters.credits[0]?.toString() || 'all'}
                    onValueChange={(value) => handleFilterChange('credits', value !== 'all' ? [parseInt(value)] : [])}
                  >
                    <SelectTrigger className="bg-white border-gray-300">
                      <SelectValue placeholder="All credits" />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="all">All credits</SelectItem>
                      {filterOptions.credits.map((credit) => (
                        <SelectItem key={credit} value={credit}>
                          {credit} credits
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Filter Action Buttons */}
              <div className="flex justify-end space-x-3 mt-6">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={handleResetFilters} className="text-base">
                      Reset All Filters
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>清除所有篩選條件</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={handleApplyFilters} 
                      disabled={filtersApplied}
                      className="text-base"
                      variant={filtersApplied ? "secondary" : "default"}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {filtersApplied ? "已套用" : "套用篩選"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{filtersApplied ? "篩選條件已套用" : "套用篩選條件"}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Course List */}
      <div className="relative z-10">
        <ScrollArea className="h-[700px]">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onAddToPlanning={onAddToPlanning}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedCourses.map((course) => (
                <CourseListItem
                  key={course.id}
                  course={course}
                  onAddToPlanning={onAddToPlanning}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-base text-gray-600">每頁顯示</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(parseInt(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-24 h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="200">200</SelectItem>
                <SelectItem value="500">500</SelectItem>
                <SelectItem value="1000">1000</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-base text-gray-600">筆課程</span>
          </div>

          <div className="flex items-center space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newPage = Math.max(currentPage - 1, 1);
                    setCurrentPage(newPage);
                  }}
                  disabled={currentPage === 1 || totalPages === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  上一頁
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>上一頁</p>
              </TooltipContent>
            </Tooltip>

            {/* Page Numbers */}
            <div className="flex items-center space-x-1">
              {pageNumbers.map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    console.log('Clicking page:', pageNum, 'totalPages:', totalPages);
                    if (pageNum >= 1 && pageNum <= totalPages) {
                      setCurrentPage(pageNum);
                    }
                  }}
                  disabled={pageNum < 1 || pageNum > totalPages}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              ))}
            </div>

            <span className="text-base text-gray-600">
              第 {currentPage} 頁，共 {totalPages} 頁
            </span>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newPage = Math.min(currentPage + 1, totalPages);
                    setCurrentPage(newPage);
                  }}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  下一頁
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>下一頁</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}

      {courses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No courses found matching your criteria.</p>
        </div>
      )}

      {courses.length > 0 && paginatedCourses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">此頁面沒有課程資料。</p>
        </div>
      )}

        {/* Next Step Button */}
        {onNavigateToPlanning && (
          <div className="flex justify-center mt-16 mb-12">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={() => {
                    onNavigateToPlanning();
                    toast.success("進入計劃階段", {
                      description: "您已成功進入課程計劃階段",
                    });
                  }}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  進入課程計劃
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>進入課程計劃階段</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
}

// Course Card Component for Grid View
const CourseCard = React.memo(function CourseCard({ course, onAddToPlanning }: { course: ParsedCourse, onAddToPlanning: (course: ParsedCourse) => void }) {
  const handleAddToPlanning = () => {
    console.log('Adding course to planning:', course.cou_cname);
    try {
      onAddToPlanning(course);
      // Toast will be handled by AppContext
    } catch (error) {
      console.error('Error adding course to planning:', error);
      toast.error("加入失敗", {
        description: "無法將課程加入計劃，請稍後再試",
      });
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-xl">{course.cou_cname}</CardTitle>
            <CardDescription className="text-base">
              {course.cou_ename} • {course.cou_code}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-base">{course.credits} credits</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center text-base text-gray-600">
            <Users className="h-5 w-5 mr-2" />
            {course.instructor}
          </div>
          
                  <div className="flex items-center text-base text-gray-600">
                    <Clock className="h-5 w-5 mr-2" />
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                      {formatTimeSlotsDisplay(course.timeSlots)}
                    </span>
                  </div>
          
          <div className="flex items-center text-base text-gray-600">
            <Users className="h-5 w-5 mr-2" />
            {course.enrolled}/{course.capacity} students
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-sm">
            {course.department}
          </Badge>
          <Badge variant="outline" className="text-sm">
            Year {course.year}
          </Badge>
        </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={handleAddToPlanning}
                      className="w-full text-base"
                      size="default"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Add to Planning
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>將此課程加入計劃</p>
                  </TooltipContent>
                </Tooltip>
      </CardContent>
    </Card>
  );
});

// Course List Item Component for List View
const CourseListItem = React.memo(function CourseListItem({ course, onAddToPlanning }: { course: ParsedCourse, onAddToPlanning: (course: ParsedCourse) => void }) {
  const handleAddToPlanning = () => {
    try {
      onAddToPlanning(course);
      // Toast will be handled by AppContext
    } catch (error) {
      console.error('Error adding course to planning:', error);
      toast.error("加入失敗", {
        description: "無法將課程加入計劃，請稍後再試",
      });
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-3">
              <h3 className="font-semibold text-lg">{course.cou_cname}</h3>
              <Badge variant="secondary" className="text-base">{course.credits} credits</Badge>
            </div>
            
            <p className="text-base text-gray-600">
              {course.cou_ename} • {course.cou_code} • {course.instructor}
            </p>
            
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                {formatTimeSlotsDisplay(course.timeSlots)}
              </span>
              <span>{course.enrolled}/{course.capacity} students</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-sm">
                {course.department}
              </Badge>
              <Badge variant="outline" className="text-sm">
                Year {course.year}
              </Badge>
            </div>
            
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button onClick={handleAddToPlanning} size="default" className="text-base">
                          <Plus className="h-5 w-5 mr-2" />
                          Add
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>將此課程加入計劃</p>
                      </TooltipContent>
                    </Tooltip>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
