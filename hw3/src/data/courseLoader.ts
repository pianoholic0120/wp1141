import Papa from 'papaparse';
import { ParsedCourse, TimeSlot } from '@/types/course';

// Function to parse time slots from the CSV format
const parseTimeSlots = (dayStr: string | undefined, timeStr: string | undefined): TimeSlot[] => {
  const timeSlots: TimeSlot[] = [];
  if (!timeStr || timeStr.trim() === '') return timeSlots;

  // NTU day mapping: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun, S=Sat, N=Sun
  const dayMap: { [key: string]: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun' } = {
    '1': 'Mon', '2': 'Tue', '3': 'Wed', '4': 'Thu', '5': 'Fri', '6': 'Sat', '7': 'Sun',
    'S': 'Sat', 'N': 'Sun'
  };

  // NTU time slot mapping
  const timeSlotMap: { [key: string]: { start: number; end: number } } = {
    '0': { start: 7, end: 8 },   // 07:10 - 08:00
    '1': { start: 8, end: 9 },   // 08:10 - 09:00
    '2': { start: 9, end: 10 },  // 09:10 - 10:00
    '3': { start: 10, end: 11 }, // 10:20 - 11:10
    '4': { start: 11, end: 12 }, // 11:20 - 12:10
    '5': { start: 12, end: 13 }, // 12:20 - 13:10
    '6': { start: 13, end: 14 }, // 13:20 - 14:10
    '7': { start: 14, end: 15 }, // 14:20 - 15:10
    '8': { start: 15, end: 16 }, // 15:30 - 16:20
    '9': { start: 16, end: 17 }, // 16:30 - 17:20
    'A': { start: 17, end: 18 }, // 18:25 - 19:15
    'B': { start: 18, end: 19 }, // 19:20 - 20:10
    'C': { start: 19, end: 20 }, // 20:15 - 21:05
    'D': { start: 20, end: 21 }  // 21:10 - 22:00
  };

  // Parse time string (e.g., "567" -> ['5', '6', '7'] or "12" -> ['1', '2'])
  const timeCodes = timeStr.trim().split('').filter(t => timeSlotMap[t]);

  if (timeCodes.length === 0) return timeSlots;

  // If day is specified, use it; otherwise assume Monday for now
  const day = dayStr && dayStr.trim() ? dayMap[dayStr.trim()] : 'Mon';

  // Create time slots for each time code
  timeCodes.forEach(timeCode => {
    const timeSlot = timeSlotMap[timeCode];
    if (timeSlot) {
      timeSlots.push({
        day,
        start: timeSlot.start,
        end: timeSlot.end
      });
    }
  });

  return timeSlots;
};

export const loadCourseData = async (): Promise<ParsedCourse[]> => {
  return new Promise((resolve, reject) => {
    fetch('/data/hw3-ntucourse-data-1002.csv')
      .then(response => response.text())
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
              console.log('CSV parsed, total rows:', results.data.length);
              const courses: ParsedCourse[] = results.data.map((row: any, index: number) => {
              const timeSlots: TimeSlot[] = [];
              // Iterate through possible time slot columns (st1, day1, st2, day2, etc.)
              for (let i = 1; i <= 6; i++) { // Assuming up to 6 time slots
                const dayKey = `day${i}`;
                const stKey = `st${i}`;
                if (row[stKey] && row[stKey].trim() !== '' && row[dayKey] && row[dayKey].trim() !== '') {
                  const parsedSlots = parseTimeSlots(row[dayKey], row[stKey]);
                  if (parsedSlots.length > 0) {
                    console.log(`Row ${index}: day${i}=${row[dayKey]}, st${i}=${row[stKey]} -> ${parsedSlots.length} time slots`);
                  }
                  timeSlots.push(...parsedSlots);
                }
              }

              const instructorCName = row.tea_cname || '';
              const instructorEName = row.tea_ename || '';
              const instructor = instructorCName && instructorEName 
                                 ? `${instructorCName} (${instructorEName})` 
                                 : instructorCName || instructorEName || 'N/A';

              return {
                // Base Course properties
                yyse: row.yyse || '',
                ser_no: row.ser_no || '',
                co_chg: row.co_chg || '',
                dpt_code: row.dpt_code || '',
                year: row.year || '',
                cou_code: row.cou_code || '',
                class: row.class || '',
                credit: row.credit || '0',
                tlec: row.tlec || '0',
                tlab: row.tlab || '0',
                forh: row.forh || '0',
                sel_code: row.sel_code || '',
                cou_cname: row.cou_cname || 'N/A',
                cou_ename: row.cou_ename || 'N/A',
                tea_seq: row.tea_seq || '',
                tea_code: row.tea_code || '',
                tea_cname: instructorCName,
                tea_ename: instructorEName,
                clsrom_1: row.clsrom_1 || '',
                clsrom_2: row.clsrom_2 || '',
                clsrom_3: row.clsrom_3 || '',
                clsrom_4: row.clsrom_4 || '',
                clsrom_5: row.clsrom_5 || '',
                clsrom_6: row.clsrom_6 || '',
                st1: row.st1 || '',
                day1: row.day1 || '',
                st2: row.st2 || '',
                day2: row.day2 || '',
                st3: row.st3 || '',
                day3: row.st3 || '',
                st4: row.st4 || '',
                day4: row.day4 || '',
                st5: row.st5 || '',
                day5: row.day5 || '',
                st6: row.st6 || '',
                day6: row.day6 || '',
                limit: row.limit || '0',
                tno: row.tno || '0',
                eno: row.eno || '0',
                co_select: row.co_select || '',
                sno: row.sno || '0',
                mark: row.mark || '',
                co_rep: row.co_rep || '',
                co_tp: row.co_tp || '',
                co_gmark: row.co_gmark || '',
                co_eng: row.co_eng || '',
                grpno: row.grpno || '',
                initsel: row.initsel || '0',
                outside: row.outside || '',
                pre_course: row.pre_course || '',
                dpt_abbr: row.dpt_abbr || 'N/A',
                cou_teacno: row.cou_teacno || '',
                chgitem: row.chgitem || '',
                engmark: row.engmark || '',
                
                // ParsedCourse properties
                id: `${row.cou_code}-${row.ser_no}-${row.dpt_code}`, // Unique ID
                instructor: instructor,
                timeSlots: timeSlots,
                description: row.co_gmark || 'No description available.',
                language: row.co_eng === '1' ? 'English' : 'Chinese',
                capacity: parseInt(row.limit || '0'),
                credits: parseInt(row.credit || '0'),
                department: row.dpt_abbr || 'N/A',
                enrolled: parseInt(row.tno || '0'),
                year: ['1', '2', '3', '4'].includes(row.year) ? row.year : '1', // Only allow valid years
              };
            });
            resolve(courses);
          },
          error: (err: any) => {
            reject(err);
          }
        });
      })
      .catch(error => {
        reject(error);
      });
  });
};

// Filter courses based on criteria
export function filterCourses(
  courses: ParsedCourse[],
  filters: {
    department?: string[];
    year?: string[];
    credits?: number[];
    search?: string;
  }
): ParsedCourse[] {
  console.log('Filtering courses with:', filters);
  console.log('Total courses to filter:', courses.length);
  
  const filtered = courses.filter(course => {
    // Department filter
    if (filters.department && filters.department.length > 0) {
      if (!filters.department.includes(course.department)) {
        return false;
      }
    }
    
    // Year filter
    if (filters.year && filters.year.length > 0) {
      if (!filters.year.includes(course.year)) {
        return false;
      }
    }
    
    // Credits filter
    if (filters.credits && filters.credits.length > 0) {
      if (!filters.credits.includes(course.credits)) {
        return false;
      }
    }
    
    // Search filter
    if (filters.search && filters.search.trim()) {
      const searchLower = filters.search.toLowerCase().trim();
      const matchesSearch = 
        course.cou_cname.toLowerCase().includes(searchLower) ||
        course.cou_ename.toLowerCase().includes(searchLower) ||
        course.cou_code.toLowerCase().includes(searchLower) ||
        course.instructor.toLowerCase().includes(searchLower) ||
        course.department.toLowerCase().includes(searchLower) ||
        course.dpt_code.toLowerCase().includes(searchLower) ||
        course.tea_cname.toLowerCase().includes(searchLower) ||
        course.tea_ename.toLowerCase().includes(searchLower) ||
        course.dpt_abbr.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) {
        return false;
      }
    }
    
    return true;
  });
  
  console.log('Filtered result:', filtered.length);
  return filtered;
}

// Check for time conflicts between courses
export function hasTimeConflict(course1: ParsedCourse, course2: ParsedCourse): boolean {
  if (course1.id === course2.id) return false; // A course doesn't conflict with itself

  for (const slot1 of course1.timeSlots) {
    for (const slot2 of course2.timeSlots) {
      if (slot1.day === slot2.day) {
        // Check for overlap in time
        // [start1, end1] and [start2, end2] overlap if (start1 <= end2 AND start2 <= end1)
        if (slot1.start <= slot2.end && slot2.start <= slot1.end) {
          return true;
        }
      }
    }
  }
  return false;
}

// Calculate total credits for a schedule
export function calculateTotalCredits(courses: ParsedCourse[]): number {
  return courses.reduce((total, course) => total + course.credits, 0);
}
