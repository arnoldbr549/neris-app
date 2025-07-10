import React, { useState, useEffect } from 'react';
import WorkflowEngine from './components/WorkflowEngine';
import './App.css';

function App() {
  const [workflowData, setWorkflowData] = useState(null);
  const [currentPage, setCurrentPage] = useState('incident-basics');
  const [formData, setFormData] = useState({});
  const [workflowState, setWorkflowState] = useState({
    currentStep: 0,
    completedSteps: [],
    pageHistory: []
  });


  useEffect(() => {
    // Load workflow data with cache busting
    const timestamp = new Date().getTime();
    fetch(`/incident-workflow-logic.json?v=${timestamp}&nocache=true`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setWorkflowData(data);
      })
      .catch(error => {
        console.error('App: Error loading workflow data:', error);
        // Fallback to a simple workflow structure
        setWorkflowData({
          workflow: {
            name: "Incident Management",
            pages: [{
              id: 'incident-basics',
              name: 'Incident Basics',
              steps: [{
                id: 'start',
                type: 'start',
                label: 'Start',
                next: 'end'
              }, {
                id: 'end',
                type: 'end',
                label: 'End'
              }]
            }]
          }
        });
      });
  }, []);

  const handleStepComplete = (stepId, data) => {
    setFormData(prev => ({ ...prev, [stepId]: data }));
    
    // Navigate to next page
    if (currentPage === 'incident-basics') {
      handlePageChange('incident-times-units');
    }
  };

  const handlePageChange = (newPage) => {
    setWorkflowState(prev => ({
      ...prev,
      pageHistory: [...prev.pageHistory, currentPage],
      currentStep: 0,
      completedSteps: []
    }));
    setCurrentPage(newPage);
  };

  const handleBack = () => {
    if (workflowState.pageHistory.length > 0) {
      const previousPage = workflowState.pageHistory[workflowState.pageHistory.length - 1];
      setWorkflowState(prev => ({
        ...prev,
        pageHistory: prev.pageHistory.slice(0, -1),
        currentStep: 0,
        completedSteps: []
      }));
      setCurrentPage(previousPage);
    }
  };

  if (!workflowData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workflow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            National Emergency Response Information System
          </h1>
        </header>

        <WorkflowEngine
          workflowData={workflowData}
          currentPage={currentPage}
          formData={formData}
          workflowState={workflowState}
          onStepComplete={handleStepComplete}
          onPageChange={handlePageChange}
          onBack={handleBack}
        />
      </div>
    </div>
  );
}

export default App;
