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
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepData, setStepData] = useState({});

  const currentPageData = workflowData.workflow.pages.find(page => page.id === currentPage);
  const currentStep = currentPageData?.steps?.[currentStepIndex];

  useEffect(() => {
    setCurrentStepIndex(workflowState.currentStep);
  }, [workflowState.currentStep]);

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
      // Move to next step
      onStepComplete(currentStep.id, newStepData);
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
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    } else {
      onBack();
    }
  };

  const canGoBack = currentStepIndex > 0 || workflowState.pageHistory.length > 0;

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
            onSubmit={handleStepSubmit}
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
          />
        );

      case 'page-reference':
        return (
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Navigating...</h2>
            <p className="text-gray-600 mb-6">Preparing to navigate to the next section</p>
            <button
              onClick={() => handleStepSubmit({})}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
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
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {currentStep.label}
          </h2>
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

        {renderStep()}
      </div>
    </div>
  );
};

export default WorkflowEngine; 