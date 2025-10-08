import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AppState, ParsedCourse, PlanningSchedule } from '@/types/course';
import { hasTimeConflict } from '@/data/courseLoader';
import { toast } from 'sonner';
import { calculateTotalCredits } from '@/data/courseLoader';

// Action types
type AppAction =
  | { type: 'SET_CURRENT_STAGE'; payload: AppState['currentStage'] }
  | { type: 'SET_COURSES'; payload: ParsedCourse[] }
  | { type: 'UPDATE_FILTERS'; payload: Partial<AppState['filters']> }
  | { type: 'ADD_TO_PLANNING'; payload: { course: ParsedCourse; planId?: string } }
  | { type: 'REMOVE_FROM_PLANNING'; payload: { courseId: string; planId?: string } }
  | { type: 'CREATE_PLANNING_SCHEDULE'; payload: PlanningSchedule }
  | { type: 'SET_ACTIVE_PLAN'; payload: string }
  | { type: 'SUBMIT_REGISTRATION' }
  | { type: 'START_MODIFICATION' }
  | { type: 'COMPLETE_MODIFICATION'; payload: ParsedCourse[] }
  | { type: 'RESET_APP' };

// Initial state
const initialState: AppState = {
  currentStage: 'browse',
  courses: [],
  planningSchedules: {
    'plan-a': {
      id: 'plan-a',
      name: 'Plan A',
      courses: [],
      totalCredits: 0
    }
  },
  activePlan: 'plan-a',
  submittedRegistration: null,
  filters: {
    department: [],
    year: [],
    credits: [],
    search: '',
    days: [],
    timeSlots: []
  },
  selectedCourse: null
};

// Reducer function
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CURRENT_STAGE':
      return { ...state, currentStage: action.payload };

    case 'SET_COURSES':
      return { ...state, courses: action.payload };

    case 'UPDATE_FILTERS':
      console.log('AppContext: Updating filters with', action.payload);
      const newFilters = { ...state.filters, ...action.payload };
      console.log('AppContext: New filters state:', newFilters);
      return {
        ...state,
        filters: newFilters
      };

            case 'ADD_TO_PLANNING':
              const targetPlan = action.payload.planId || state.activePlan;
              const planningSchedules = { ...state.planningSchedules };
              const plan = planningSchedules[targetPlan];
              
              console.log('ADD_TO_PLANNING: Adding course', action.payload.course.cou_cname, 'to plan', targetPlan);
              
              if (plan) {
                // Check if course already exists in the plan
                const existingCourse = plan.courses.find(c => c.id === action.payload.course.id);
                
                if (existingCourse) {
                  console.log('Course already exists in plan');
                  toast.info("課程已在計劃中", {
                    description: `${action.payload.course.cou_cname} 已經在您的計劃中了`,
                  });
                  return state; // Early return to prevent further processing
                }
                
                // Check for time conflicts before adding
                const conflictingCourse = plan.courses.find(existingCourse => 
                  hasTimeConflict(action.payload.course, existingCourse)
                );
                
                if (conflictingCourse) {
                  console.log('Time conflict detected:', action.payload.course.cou_cname, 'vs', conflictingCourse.cou_cname);
                  toast.error("衝堂衝突", {
                    description: `${action.payload.course.cou_cname} 與 ${conflictingCourse.cou_cname} 時間衝突。請到 Planning 階段進行修改。`,
                  });
                  return state;
                }
                
                // Add course to existing plan
                plan.courses.push(action.payload.course);
                plan.totalCredits = calculateTotalCredits(plan.courses);
                console.log('Course added successfully. Total courses in plan:', plan.courses.length);
                
                // Show success toast
                toast.success("課程已加入計劃", {
                  description: `${action.payload.course.cou_cname} 已成功加入您的計劃中`,
                });
              } else {
                console.log('Plan not found:', targetPlan);
                // Create new plan if it doesn't exist
                planningSchedules[targetPlan] = {
                  id: targetPlan,
                  name: `Plan ${Object.keys(planningSchedules).length + 1}`,
                  courses: [action.payload.course],
                  totalCredits: calculateTotalCredits([action.payload.course])
                };
                console.log('Created new plan:', targetPlan);
                
                // Only show success toast for new plan creation
                toast.success("課程已加入計劃", {
                  description: `${action.payload.course.cou_cname} 已成功加入您的計劃中`,
                });
              }
              
              return { ...state, planningSchedules };

    case 'REMOVE_FROM_PLANNING':
      const removeTargetPlan = action.payload.planId || state.activePlan;
      const updatedPlanningSchedules = { ...state.planningSchedules };
      const removePlan = updatedPlanningSchedules[removeTargetPlan];
      
      if (removePlan) {
        removePlan.courses = removePlan.courses.filter(c => c.id !== action.payload.courseId);
        removePlan.totalCredits = calculateTotalCredits(removePlan.courses);
      }
      
      return { ...state, planningSchedules: updatedPlanningSchedules };

    case 'CREATE_PLANNING_SCHEDULE':
      return {
        ...state,
        planningSchedules: {
          ...state.planningSchedules,
          [action.payload.id]: action.payload
        },
        activePlan: action.payload.id
      };

    case 'SET_ACTIVE_PLAN':
      return { ...state, activePlan: action.payload };

    case 'SUBMIT_REGISTRATION':
      const activePlan = state.planningSchedules[state.activePlan];
      if (!activePlan) return state;

      const confirmationNumber = `NTU-2025-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      return {
        ...state,
        currentStage: 'submitted',
        submittedRegistration: {
          courses: activePlan.courses,
          timestamp: new Date().toISOString(),
          confirmationNumber,
          sourcePlanId: state.activePlan // 記錄提交來源
        }
      };

    case 'START_MODIFICATION':
      return { ...state, currentStage: 'modification' };

    case 'COMPLETE_MODIFICATION':
      const confirmationNumberMod = `NTU-2025-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      // 只更新原本提交的那個 plan
      const updatedPlanningSchedulesAfterMod = { ...state.planningSchedules };
      const sourcePlanId = state.submittedRegistration?.sourcePlanId;
      
      if (sourcePlanId && updatedPlanningSchedulesAfterMod[sourcePlanId]) {
        // 只更新源 plan 的課程列表
        updatedPlanningSchedulesAfterMod[sourcePlanId] = {
          ...updatedPlanningSchedulesAfterMod[sourcePlanId],
          courses: [...action.payload], // 使用修改後的課程列表
          totalCredits: calculateTotalCredits(action.payload)
        };
      }
      
      return {
        ...state,
        currentStage: 'submitted',
        planningSchedules: updatedPlanningSchedulesAfterMod,
        submittedRegistration: {
          courses: action.payload,
          timestamp: new Date().toISOString(),
          confirmationNumber: confirmationNumberMod,
          sourcePlanId: sourcePlanId || state.activePlan // 保留或使用當前 active plan
        }
      };

    case 'RESET_APP':
      return {
        ...initialState,
        planningSchedules: {
          'plan-a': {
            id: 'plan-a',
            name: 'Plan A',
            courses: [],
            totalCredits: 0
          }
        },
        activePlan: 'plan-a'
      };

    default:
      return state;
  }
}

// Context type
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook to use context
export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// Action creators for easier usage
export const appActions = {
  setCurrentStage: (stage: AppState['currentStage']) => ({
    type: 'SET_CURRENT_STAGE' as const,
    payload: stage
  }),
  
  setCourses: (courses: ParsedCourse[]) => ({
    type: 'SET_COURSES' as const,
    payload: courses
  }),
  
  updateFilters: (filters: Partial<AppState['filters']>) => ({
    type: 'UPDATE_FILTERS' as const,
    payload: filters
  }),
  
  addToPlanning: (course: ParsedCourse, planId?: string) => ({
    type: 'ADD_TO_PLANNING' as const,
    payload: { course, planId }
  }),
  
  removeFromPlanning: (courseId: string, planId?: string) => ({
    type: 'REMOVE_FROM_PLANNING' as const,
    payload: { courseId, planId }
  }),
  
  createPlanningSchedule: (plan: PlanningSchedule) => ({
    type: 'CREATE_PLANNING_SCHEDULE' as const,
    payload: plan
  }),
  
  setActivePlan: (planId: string) => ({
    type: 'SET_ACTIVE_PLAN' as const,
    payload: planId
  }),
  
  submitRegistration: () => ({
    type: 'SUBMIT_REGISTRATION' as const
  }),
  
  startModification: () => ({
    type: 'START_MODIFICATION' as const
  }),
  
  completeModification: (courses: ParsedCourse[]) => ({
    type: 'COMPLETE_MODIFICATION' as const,
    payload: courses
  }),
  
  resetApp: () => ({
    type: 'RESET_APP' as const
  })
};
