import React from 'react';

const StepIndicator = ({ steps, currentStep, completedSteps }) => {
  if (!steps || steps.length === 0) {
    return null;
  }

  return (
    <div className="flex justify-center items-center space-x-4 p-4 bg-white border-b">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = completedSteps.includes(step.id);
        
        return (
          <div
            key={step.id}
            className={`flex flex-col items-center ${
              isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
              isActive 
                ? 'bg-blue-600 text-white border-blue-600' 
                : isCompleted 
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-gray-200 text-gray-500 border-gray-300'
            }`}>
              {isCompleted ? '✓' : index + 1}
            </div>
            <div className="text-xs text-center mt-1 max-w-20">
              {step.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicator; 