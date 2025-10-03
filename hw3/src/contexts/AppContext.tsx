import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AppState, ParsedCourse, PlanningSchedule } from '@/types/course';
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
    search: ''
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
      return {
        ...state,
        filters: { ...state.filters, ...action.payload }
      };

            case 'ADD_TO_PLANNING':
              const targetPlan = action.payload.planId || state.activePlan;
              const planningSchedules = { ...state.planningSchedules };
              const plan = planningSchedules[targetPlan];
              
              console.log('ADD_TO_PLANNING: Adding course', action.payload.course.cou_cname, 'to plan', targetPlan);
              
              if (plan) {
                // Check if course already exists in the plan
                const existingCourse = plan.courses.find(c => c.id === action.payload.course.id);
                if (!existingCourse) {
                  plan.courses.push(action.payload.course);
                  plan.totalCredits = calculateTotalCredits(plan.courses);
                  console.log('Course added successfully. Total courses in plan:', plan.courses.length);
                } else {
                  console.log('Course already exists in plan');
                }
              } else {
                console.log('Plan not found:', targetPlan);
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
          confirmationNumber
        }
      };

    case 'START_MODIFICATION':
      return { ...state, currentStage: 'modification' };

    case 'COMPLETE_MODIFICATION':
      const confirmationNumberMod = `NTU-2025-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      return {
        ...state,
        currentStage: 'submitted',
        submittedRegistration: {
          courses: action.payload,
          timestamp: new Date().toISOString(),
          confirmationNumber: confirmationNumberMod
        }
      };

    case 'RESET_APP':
      return initialState;

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
