import React from 'react';
import { AppProvider, useAppContext, appActions } from './contexts/AppContext';
import { useCourseData } from './hooks/useCourseData';
import { AppShell } from './components/AppShell';
import { BrowseStage } from './components/stages/BrowseStage';
import { PlanningStage } from './components/stages/PlanningStage';
import { SubmittedStage } from './components/stages/SubmittedStage';
import { ModificationStage } from './components/stages/ModificationStage';
import { Toaster } from './components/ui/sonner';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">發生錯誤</h2>
            <p className="text-gray-600 mb-4">應用程式遇到問題，請重新載入頁面</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              重新載入
            </button>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">錯誤詳情</summary>
                <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppContent() {
  const { state, dispatch } = useAppContext();
  const {
    filteredCourses,
    loading,
    error,
    applyFilters,
    refreshData
  } = useCourseData();

  // Apply filters when they change
  React.useEffect(() => {
    console.log('App: Filters changed, applying...', state.filters);
    applyFilters(state.filters);
  }, [applyFilters, state.filters]);

  // Error boundary effect
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const renderCurrentStage = () => {
    switch (state.currentStage) {
              case 'browse':
                return (
                  <BrowseStage
                    courses={filteredCourses}
                    loading={loading}
                    error={error}
                    filters={state.filters}
                    onUpdateFilters={(filters) => dispatch(appActions.updateFilters(filters))}
                    onAddToPlanning={(course) => dispatch(appActions.addToPlanning(course))}
                    onRefreshData={refreshData}
                    onNavigateToPlanning={() => dispatch(appActions.setCurrentStage('planning'))}
                  />
                );
      
      case 'planning':
        return (
          <PlanningStage
            schedules={state.planningSchedules}
            activePlan={state.activePlan}
            onSetActivePlan={(planId) => dispatch(appActions.setActivePlan(planId))}
            onCreateSchedule={(name) => {
              const newPlan = {
                id: `plan-${Date.now()}`,
                name,
                courses: [],
                totalCredits: 0
              };
              dispatch(appActions.createPlanningSchedule(newPlan));
            }}
            onRemoveCourse={(courseId) => dispatch(appActions.removeFromPlanning(courseId))}
            onSubmitRegistration={() => dispatch(appActions.submitRegistration())}
          />
        );
      
      case 'submitted':
        return (
          <SubmittedStage
            registration={state.submittedRegistration!}
            onStartModification={() => dispatch(appActions.startModification())}
            onReset={() => dispatch(appActions.resetApp())}
          />
        );
      
      case 'modification':
        return (
          <ModificationStage
            originalRegistration={state.submittedRegistration!}
            onCompleteModification={(courses) => dispatch(appActions.completeModification(courses))}
            onCancel={() => dispatch(appActions.setCurrentStage('submitted'))}
          />
        );
      
      default:
        return <BrowseStage
          courses={filteredCourses}
          loading={loading}
          error={error}
          filters={state.filters}
          onUpdateFilters={(filters) => dispatch(appActions.updateFilters(filters))}
          onAddToPlanning={(course) => dispatch(appActions.addToPlanning(course))}
          onRefreshData={refreshData}
        />;
    }
  };

          return (
            <AppShell
              currentStage={state.currentStage}
              onStageChange={(stage) => dispatch(appActions.setCurrentStage(stage))}
              submittedRegistration={state.submittedRegistration}
              planningSchedules={state.planningSchedules}
              activePlan={state.activePlan}
            >
              {renderCurrentStage()}
            </AppShell>
          );
}

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
        <Toaster />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
