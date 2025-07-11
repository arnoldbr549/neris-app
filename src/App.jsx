import './App.css'
import { useEffect, useState } from 'react'
import WorkflowEngine from './components/WorkflowEngine'
import nerisLogo from './assets/neris_logo.jpg'
import pulsiamLogo from './assets/puslaim_horizontal.png'

function App() {
  const [workflowData, setWorkflowData] = useState(null)
  const [currentPage, setCurrentPage] = useState('')
  const [formData, setFormData] = useState({})
  const [workflowState, setWorkflowState] = useState({ currentStep: 0, pageHistory: [] })
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/incident-workflow-logic.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load workflow JSON')
        return res.json()
      })
      .then(data => {
        setWorkflowData(data)
        if (data?.workflow?.pages?.length > 0) {
          const firstPage = data.workflow.pages[0].id;
          setCurrentPage(firstPage)
        } else {
          setError('No pages found in workflow data.')
        }
      })
      .catch(e => setError(e.message))
  }, [])

  useEffect(() => {
    setWorkflowState(prev => ({ ...prev, currentStep: 0 }));
  }, [currentPage]);

  const onStepComplete = (stepId, stepData, stepDelta = 1) => {

    setFormData(prev => ({ ...prev, [stepId]: stepData }));
    setWorkflowState(prev => {
      const newState = { ...prev, currentStep: prev.currentStep + stepDelta };

      return newState;
    });
  }
  const onPageChange = (pageId) => {
    setCurrentPage(pageId)
    // No need to reset currentStep here; useEffect will handle it
  }
  const onBack = () => {
    setWorkflowState(prev => ({ ...prev, currentStep: Math.max(prev.currentStep - 1, 0) }))
  }

  if (error) return <div style={{color:'red'}}>Error: {error}</div>
  if (!workflowData || !currentPage) return <div style={{color:'blue'}}>Loading workflow...</div>

  return (
    <div className="app-container">
      <div className="flex items-center justify-center gap-6 mb-4">
        <img src={nerisLogo} alt="NERIS Logo" className="max-h-20" />
        <div className="flex flex-col items-center text-xs font-semibold text-purple-800 select-none lowercase">
          <span>powered</span>
          <span>by</span>
        </div>
        <img src={pulsiamLogo} alt="Pulsiam Logo" className="max-h-16" />
      </div>
      <WorkflowEngine
        workflowData={workflowData}
        currentPage={currentPage}
        formData={formData}
        workflowState={workflowState}
        onStepComplete={onStepComplete}
        onPageChange={onPageChange}
        onBack={onBack}
      />
    </div>
  )
}

export default App
