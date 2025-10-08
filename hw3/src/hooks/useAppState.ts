import { useState, useCallback } from 'react';
import { AppState, PlanningSchedule, ParsedCourse } from '@/types/course';
import { calculateTotalCredits } from '@/data/courseLoader';

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

export function useAppState() {
  const [state, setState] = useState<AppState>(initialState);

  // Update current stage
  const setCurrentStage = useCallback((stage: AppState['currentStage']) => {
    setState(prev => ({ ...prev, currentStage: stage }));
  }, []);

  // Update filters
  const updateFilters = useCallback((filters: Partial<AppState['filters']>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...filters }
    }));
  }, []);

  // Add course to planning
  const addToPlanning = useCallback((course: ParsedCourse, planId?: string) => {
    const targetPlan = planId || state.activePlan;
    
    setState(prev => {
      const planningSchedules = { ...prev.planningSchedules };
      const plan = planningSchedules[targetPlan];
      
      if (plan && !plan.courses.find(c => c.id === course.id)) {
        plan.courses.push(course);
        plan.totalCredits = calculateTotalCredits(plan.courses);
      }
      
      return {
        ...prev,
        planningSchedules
      };
    });
  }, [state.activePlan]);

  // Remove course from planning
  const removeFromPlanning = useCallback((courseId: string, planId?: string) => {
    const targetPlan = planId || state.activePlan;
    
    setState(prev => {
      const planningSchedules = { ...prev.planningSchedules };
      const plan = planningSchedules[targetPlan];
      
      if (plan) {
        plan.courses = plan.courses.filter(c => c.id !== courseId);
        plan.totalCredits = calculateTotalCredits(plan.courses);
      }
      
      return {
        ...prev,
        planningSchedules
      };
    });
  }, [state.activePlan]);

  // Create new planning schedule
  const createPlanningSchedule = useCallback((name: string) => {
    const newPlan: PlanningSchedule = {
      id: `plan-${Date.now()}`,
      name,
      courses: [],
      totalCredits: 0
    };
    
    setState(prev => ({
      ...prev,
      planningSchedules: {
        ...prev.planningSchedules,
        [newPlan.id]: newPlan
      },
      activePlan: newPlan.id
    }));
    
    return newPlan.id;
  }, []);

  // Set active plan
  const setActivePlan = useCallback((planId: string) => {
    setState(prev => ({ ...prev, activePlan: planId }));
  }, []);

  // Submit registration
  const submitRegistration = useCallback(() => {
    const activePlan = state.planningSchedules[state.activePlan];
    if (!activePlan) return;

    const confirmationNumber = `NTU-2025-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    setState(prev => ({
      ...prev,
      currentStage: 'submitted',
      submittedRegistration: {
        courses: [...activePlan.courses], // 創建新數組，避免引用共享
        timestamp: new Date().toISOString(),
        confirmationNumber,
        sourcePlanId: state.activePlan // 記錄提交來源
      }
    }));
  }, [state.planningSchedules, state.activePlan]);

  // Start modification
  const startModification = useCallback(() => {
    if (!state.submittedRegistration) return;
    
    setState(prev => ({
      ...prev,
      currentStage: 'modification'
    }));
  }, [state.submittedRegistration]);

  // Complete modification
  const completeModification = useCallback((modifiedCourses: ParsedCourse[]) => {
    const confirmationNumber = `NTU-2025-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    setState(prev => {
      // 只更新原本提交的那個 plan
      const updatedPlanningSchedules = { ...prev.planningSchedules };
      const sourcePlanId = prev.submittedRegistration?.sourcePlanId;
      
      if (sourcePlanId && updatedPlanningSchedules[sourcePlanId]) {
        // 只更新源 plan 的課程列表（創建新數組）
        updatedPlanningSchedules[sourcePlanId] = {
          ...updatedPlanningSchedules[sourcePlanId],
          courses: [...modifiedCourses], // 創建新數組副本
          totalCredits: calculateTotalCredits(modifiedCourses)
        };
      }
      
      return {
        ...prev,
        currentStage: 'submitted',
        planningSchedules: updatedPlanningSchedules,
        submittedRegistration: {
          courses: [...modifiedCourses], // 創建新數組，避免引用共享
          timestamp: new Date().toISOString(),
          confirmationNumber,
          sourcePlanId: sourcePlanId || prev.activePlan // 保留或使用當前 active plan
        }
      };
    });
  }, []);

  // Reset to browse stage
  const resetToBrowse = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    state,
    setCurrentStage,
    updateFilters,
    addToPlanning,
    removeFromPlanning,
    createPlanningSchedule,
    setActivePlan,
    submitRegistration,
    startModification,
    completeModification,
    resetToBrowse
  };
}
