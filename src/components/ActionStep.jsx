import React from 'react';

const ActionStep = ({ step, onSubmit }) => {
  const handleAction = () => {
    // Handle different action types
    switch (step.action) {
      case 'increment_counter':
        // Simulate incrementing a counter
        console.log('Incrementing counter for:', step.label);
        break;
      default:
        console.log('Executing action:', step.action);
    }
    
    onSubmit({ actionCompleted: true });
  };

  return (
    <div className="text-center space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-green-900 mb-2">
          {step.label}
        </h3>
        <p className="text-green-700">
          This action will be executed automatically.
        </p>
      </div>

      <div className="flex justify-center space-x-4">
        <button
          onClick={handleAction}
          className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
        >
          Execute Action
        </button>
      </div>
    </div>
  );
};

export default ActionStep; 