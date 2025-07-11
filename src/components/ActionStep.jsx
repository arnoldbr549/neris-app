import React, { useState } from 'react';

const ActionStep = ({ step, onSubmit, formData, stepData }) => {
  const [showJson, setShowJson] = useState(false);
  const [jsonData, setJsonData] = useState(null);

  const handleAction = () => {
    // Handle different action types
    switch (step.action) {
      case 'increment_counter':
        // Simulate incrementing a counter
    
        break;
      case 'submit_incident':
        // Handle incident submission

        
        // Flatten the formData object to get all form values
        const flattenedData = {};
        Object.keys(formData).forEach(stepId => {
          if (formData[stepId] && typeof formData[stepId] === 'object') {
            Object.assign(flattenedData, formData[stepId]);
          }
        });
        
        // Also include current stepData
        const allData = { ...flattenedData, ...stepData };

        setJsonData(allData);
        setShowJson(true);
        return; // Don't proceed to next step yet
      default:

    }
    
    onSubmit({ actionCompleted: true });
  };

  const getActionContent = () => {
    switch (step.action) {
      case 'submit_incident':
        return {
          title: 'Submit Incident Data',
          description: 'Click the button below to submit the incident data to the system.',
          buttonText: 'Submit Incident',
          buttonClass: 'bg-blue-600 hover:bg-blue-700',
          bgClass: 'bg-blue-50 border-blue-200',
          textClass: 'text-blue-900',
          descClass: 'text-blue-700'
        };
      default:
        return {
          title: step.label,
          description: 'This action will be executed automatically.',
          buttonText: 'Execute Action',
          buttonClass: 'bg-green-600 hover:bg-green-700',
          bgClass: 'bg-green-50 border-green-200',
          textClass: 'text-green-900',
          descClass: 'text-green-700'
        };
    }
  };

  const content = getActionContent();

  if (showJson && jsonData) {
    return (
      <div className="space-y-6">
        <div className={`${content.bgClass} border rounded-lg p-6`}>
          <h3 className={`text-lg font-medium ${content.textClass} mb-2`}>
            Form Data Submitted
          </h3>
          <p className={content.descClass}>
            Below is the JSON data from all form fields:
          </p>
        </div>

        <div className="bg-gray-100 border rounded-lg p-4 text-left">
          <pre className="text-sm text-gray-800 overflow-x-auto whitespace-pre-wrap text-left">
            {JSON.stringify(jsonData, null, 2)}
          </pre>
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={() => onSubmit({ actionCompleted: true })}
            className="bg-green-600 text-white px-8 py-3 rounded-md transition-colors font-medium hover:bg-green-700"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center space-y-6">
      <div className={`${content.bgClass} border rounded-lg p-6`}>
        <h3 className={`text-lg font-medium ${content.textClass} mb-2`}>
          {content.title}
        </h3>
        <p className={content.descClass}>
          {content.description}
        </p>
      </div>

      <div className="flex justify-center space-x-4">
        <button
          onClick={handleAction}
          className={`text-white px-8 py-3 rounded-md transition-colors font-medium ${content.buttonClass}`}
        >
          {content.buttonText}
        </button>
      </div>
    </div>
  );
};

export default ActionStep; 