import React from 'react';

const DecisionStep = ({ step, onDecision }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {step.label}
        </h3>
        <p className="text-gray-600 mb-6">
          Please select one of the following options:
        </p>
      </div>

      <div className="grid gap-4">
        {step.options.map((option) => (
          <button
            key={option.value}
            onClick={() => onDecision(option.value)}
            className="w-full p-4 text-left border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">
                {option.label}
              </span>
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DecisionStep; 