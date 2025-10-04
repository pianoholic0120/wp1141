import React from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { RefreshCw, BookOpen, Calendar, CheckCircle, Edit3 } from 'lucide-react';
import { AppState } from '@/types/course';

interface AppShellProps {
  currentStage: AppState['currentStage'];
  onStageChange: (stage: AppState['currentStage']) => void;
  submittedRegistration: AppState['submittedRegistration'] | null;
  planningSchedules: AppState['planningSchedules'];
  activePlan: string;
  children: React.ReactNode;
}

const stages = [
  { id: 'browse', name: 'Browse', icon: BookOpen, color: 'bg-blue-100 text-blue-800' },
  { id: 'planning', name: 'Planning', icon: Calendar, color: 'bg-teal-100 text-teal-800' },
  { id: 'submitted', name: 'Submitted', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  { id: 'modification', name: 'Modify', icon: Edit3, color: 'bg-orange-100 text-orange-800' },
] as const;

export function AppShell({ currentStage, onStageChange, submittedRegistration, planningSchedules, activePlan, children }: AppShellProps) {
  const getStageIndex = (stage: AppState['currentStage']) => {
    return stages.findIndex(s => s.id === stage);
  };

  const currentStageIndex = getStageIndex(currentStage);
          const canNavigateToStage = (stageId: string) => {
            const stageIndex = getStageIndex(stageId as AppState['currentStage']);
            // Always allow navigation to browse stage
            if (stageId === 'browse') return true;
            
            // Always allow navigation to planning stage
            if (stageId === 'planning') {
              return true;
            }
            
            // Allow navigation to submitted if registration is complete
            if (stageId === 'submitted') {
              return submittedRegistration !== null;
            }
            
            // Allow navigation to modification if registration is complete
            if (stageId === 'modification') {
              return submittedRegistration !== null;
            }
            
            // Default: allow navigation to previous stages or current stage
            return stageIndex <= currentStageIndex;
          };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
          <div className="flex items-center justify-between h-20">
            {/* Logo and Title */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <BookOpen className="h-10 w-10 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">
                  NTU Course Registration
                </h1>
              </div>
              {submittedRegistration && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 text-base px-4 py-2">
                  Registration Complete
                </Badge>
              )}
            </div>

            {/* Stage Navigation */}
            <nav className="flex items-center space-x-2">
              {stages.map((stage) => {
                const Icon = stage.icon;
                const isActive = stage.id === currentStage;
                const isAccessible = canNavigateToStage(stage.id);
                
                return (
                  <Button
                    key={stage.id}
                    variant={isActive ? "default" : "ghost"}
                    size="default"
                    onClick={() => isAccessible && onStageChange(stage.id as AppState['currentStage'])}
                    disabled={!isAccessible}
                    className={`flex items-center space-x-2 text-base ${
                      isActive 
                        ? stage.color 
                        : isAccessible 
                          ? 'text-gray-600 hover:text-gray-900' 
                          : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="hidden sm:inline">{stage.name}</span>
                  </Button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
          <div className="flex items-center space-x-6 py-4">
            <div className="flex-1 bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${((currentStageIndex + 1) / stages.length) * 100}%` }}
              />
            </div>
            <span className="text-base text-gray-600 font-medium">
              Step {currentStageIndex + 1} of {stages.length}
            </span>
          </div>
        </div>
      </div>

              {/* Main Content */}
              <main className="w-full px-4 sm:px-6 lg:px-8 py-10">
                <div className="w-full">
                  {children}
                </div>
              </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-8">
          <div className="flex items-center justify-between">
            <div className="text-base text-gray-500">
              © 2025 National Taiwan University Course Registration System
            </div>
            <div className="flex items-center space-x-4 text-base text-gray-500">
              <span>Data updates automatically</span>
              <RefreshCw className="h-5 w-5" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
