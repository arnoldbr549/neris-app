import React from 'react';

const MessageStep = ({ step, onSubmit }) => {
  return (
    <div className="text-center space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">
          {step.label}
        </h3>
        <p className="text-blue-700">
          {step.message}
        </p>
      </div>

      <div className="flex justify-center space-x-4">
        <button
          onClick={() => onSubmit({ acknowledged: true })}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default MessageStep; 