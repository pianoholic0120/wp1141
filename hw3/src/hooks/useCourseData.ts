import { useState, useEffect, useCallback } from 'react';
import { ParsedCourse, AppState } from '@/types/course';
import { loadCourseData, filterCourses } from '@/data/courseLoader';

export function useCourseData() {
  const [courses, setCourses] = useState<ParsedCourse[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<ParsedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  // Load course data with hot reload capability
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Add timestamp to force cache refresh
      const timestamp = Date.now();
      const data = await loadCourseData();
      
      setCourses(data);
      setFilteredCourses(data);
      setLastFetch(timestamp);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course data');
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Hot reload: Check for data updates every 30 seconds (reduced frequency for better performance)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // Check if data has been updated by fetching with a timestamp
        const response = await fetch(`/data/hw3-ntucourse-data-1002.csv?t=${Date.now()}`, {
          method: 'HEAD'
        });
        
        if (response.ok) {
          const lastModified = response.headers.get('last-modified');
          if (lastModified) {
            const modifiedTime = new Date(lastModified).getTime();
            if (modifiedTime > lastFetch) {
              console.log('Course data updated, reloading...');
              await loadData();
            }
          }
        }
      } catch (err) {
        // Silently fail for hot reload checks
        console.debug('Hot reload check failed:', err);
      }
    }, 30000); // Increased from 5 seconds to 30 seconds

    return () => clearInterval(interval);
  }, [lastFetch, loadData]);

  // Apply filters to courses
  const applyFilters = useCallback((filters: AppState['filters']) => {
    console.log('Applying filters:', filters);
    console.log('Total courses:', courses.length);
    const filtered = filterCourses(courses, filters);
    console.log('Filtered courses:', filtered.length);
    setFilteredCourses(filtered);
  }, [courses]);

  // Manual refresh function
  const refreshData = useCallback(() => {
    loadData();
  }, [loadData]);

  return {
    courses,
    filteredCourses,
    loading,
    error,
    applyFilters,
    refreshData,
    lastFetch
  };
}
