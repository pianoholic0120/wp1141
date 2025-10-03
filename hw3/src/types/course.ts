export interface Course {
  yyse: string;
  ser_no: string;
  co_chg: string;
  dpt_code: string;
  year: string;
  cou_code: string;
  class: string;
  credit: string;
  tlec: string;
  tlab: string;
  forh: string;
  sel_code: string;
  cou_cname: string;
  cou_ename: string;
  tea_seq: string;
  tea_code: string;
  tea_cname: string;
  tea_ename: string;
  clsrom_1: string;
  clsrom_2: string;
  clsrom_3: string;
  clsrom_4: string;
  clsrom_5: string;
  clsrom_6: string;
  st1: string;
  day1: string;
  st2: string;
  day2: string;
  st3: string;
  day3: string;
  st4: string;
  day4: string;
  st5: string;
  day5: string;
  st6: string;
  day6: string;
  limit: string;
  tno: string;
  eno: string;
  co_select: string;
  sno: string;
  mark: string;
  co_rep: string;
  co_tp: string;
  co_gmark: string;
  co_eng: string;
  grpno: string;
  initsel: string;
  outside: string;
  pre_course: string;
  dpt_abbr: string;
  cou_teacno: string;
  chgitem: string;
  engmark: string;
}

export interface TimeSlot {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  start: number; // e.g., 1 for 8:00, 2 for 9:00
  end: number;   // e.g., 3 for 10:00
}

export interface ParsedCourse extends Omit<Course, 'st1' | 'day1' | 'st2' | 'day2' | 'st3' | 'day3' | 'st4' | 'day4' | 'st5' | 'day5' | 'st6' | 'day6'> {
  id: string;
  timeSlots: TimeSlot[];
  credits: number;
  department: string;
  instructor: string;
  capacity: number;
  enrolled: number;
  colorClass?: string;
}

export interface PlanningSchedule {
  id: string;
  name: string;
  courses: ParsedCourse[];
  totalCredits: number;
}

export interface AppState {
  currentStage: 'browse' | 'planning' | 'submitted' | 'modification';
  courses: ParsedCourse[];
  planningSchedules: {
    [key: string]: PlanningSchedule;
  };
  activePlan: string;
  submittedRegistration: {
    courses: ParsedCourse[];
    timestamp: string;
    confirmationNumber: string;
  } | null;
  filters: {
    department: string[];
    year: string[];
    credits: number[];
    search: string;
  };
  selectedCourse: ParsedCourse | null;
}

export interface ModificationState {
  original: ParsedCourse[];
  current: ParsedCourse[];
  changes: {
    type: 'add' | 'remove' | 'modify';
    course: ParsedCourse;
    original?: ParsedCourse;
  }[];
  isModifying: boolean;
  reason: string;
}
