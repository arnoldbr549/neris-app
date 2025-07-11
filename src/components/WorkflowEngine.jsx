import React, { useState, useEffect } from 'react';
import FormStep from './FormStep';
import DecisionStep from './DecisionStep';
import MessageStep from './MessageStep';
import ActionStep from './ActionStep';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

const WorkflowEngine = ({
  workflowData,
  currentPage,
  formData,
  workflowState,
  onStepComplete,
  onPageChange,
  onBack
}) => {

  const [stepData, setStepData] = useState({});

  const currentPageData = workflowData.workflow.pages.find(page => page.id === currentPage);

  const currentStep = currentPageData?.steps?.[workflowState.currentStep];

  // Defensive check AFTER all hooks
  if (!currentStep) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Step not found</h2>
        <p className="text-gray-600">The requested workflow step could not be found.</p>
      </div>
    );
  }

  const handleStepSubmit = (data) => {
    const newStepData = { ...stepData, ...data };
    setStepData(newStepData);



    if (currentStep.type === 'page-reference') {
      // Navigate to the referenced page
      const referencedPage = currentStep.next;
      onPageChange(referencedPage);
    } else if (currentStep.type === 'end') {
      // Workflow completed
      alert('Workflow completed successfully!');
    } else {
      // Check if next step exists in current page
      const nextStepId = currentStep.next;
      const nextStepIndex = currentPageData.steps.findIndex(step => step.id === nextStepId);
      
      if (nextStepIndex !== -1) {
        // Next step exists in current page
        onStepComplete(currentStep.id, newStepData);
      } else {
        // Next step is in a different page, find which page contains it
        const targetPage = workflowData.workflow.pages.find(page => 
          page.steps.some(step => step.id === nextStepId)
        );
        
        if (targetPage) {
          // Navigate to the page containing the next step
          onPageChange(targetPage.id);
        } else {
          console.error('Next step not found in any page:', nextStepId);
          alert('Navigation error: Next step not found');
        }
      }
    }
  };

  const handleDecision = (decision) => {
    const selectedOption = currentStep.options.find(option => option.value === decision);
    if (selectedOption) {
      if (selectedOption.next === 'end') {
        alert('Workflow completed successfully!');
      } else if (selectedOption.next.startsWith('page-')) {
        // Navigate to referenced page
        onPageChange(selectedOption.next);
      } else {
        // Move to next step
        onStepComplete(currentStep.id, { decision });
      }
    }
  };

  const handleBack = () => {
    if (workflowState.currentStep > 0) {
      onStepComplete(currentStep.id, stepData, -1); // Go back one step
    } else {
      onBack();
    }
  };

  const canGoBack = workflowState.currentStep > 0 || workflowState.pageHistory?.length > 0;

  if (!currentPageData || !currentStep) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Page not found</h2>
        <p className="text-gray-600">The requested workflow page could not be found.</p>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep.type) {
      case 'form':
        return (
          <FormStep
            step={currentStep}
            formData={formData}
            onSubmit={(data) => { handleStepSubmit(data); }}
            onPrevious={handleBack}
            showPrevious={currentPage === 'incident-times-units'}
          />
        );

      case 'decision':
        return (
          <DecisionStep
            step={currentStep}
            onDecision={handleDecision}
          />
        );

      case 'message':
        return (
          <MessageStep
            step={currentStep}
            onSubmit={handleStepSubmit}
          />
        );

      case 'action':
        return (
          <ActionStep
            step={currentStep}
            onSubmit={handleStepSubmit}
            formData={formData}
            stepData={stepData}
          />
        );

      case 'page-reference':
        return (
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Navigating...</h2>
            <p className="text-gray-600 mb-6">Preparing to navigate to the next section</p>
            <button
              onClick={() => handleStepSubmit({})}
              className="bg-blue-600 text-white px-6 py-2 hover:bg-blue-700 transition-colors"
            >
              Continue
            </button>
          </div>
        );

      case 'end':
        return (
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-green-600 mb-4">Workflow Complete</h2>
            <p className="text-gray-600">The workflow has been completed successfully.</p>
          </div>
        );

      case 'start':
        return (
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{currentStep.label || 'Start'}</h2>
            <button
              onClick={() => handleStepSubmit({})}
              className="bg-blue-600 text-white px-6 py-2 hover:bg-blue-700 transition-colors"
            >
              Continue
            </button>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Unknown Step Type</h2>
            <p className="text-gray-600">Step type "{currentStep.type}" is not supported.</p>
          </div>
        );
    }
  };

  return (
    <div className="form-container">
      <div className="bg-white shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {currentStep.label}
          </h2>
          <div className="flex items-center space-x-4">
            {currentStep.type === 'form' && (
              <button
                type="button"
                onClick={() => {
                  if (window.generateSampleData) {
                    window.generateSampleData();
                  }
                }}
                className="px-3 py-1 bg-gray-200 text-gray-700 border hover:bg-gray-300 text-xs"
              >
                GenData
              </button>
            )}
            {canGoBack && (
              <button
                onClick={handleBack}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ChevronLeftIcon className="w-4 h-4 mr-1" />
                Back
              </button>
            )}
          </div>
        </div>

        {renderStep()}
      </div>
    </div>
  );
};

export default WorkflowEngine; 