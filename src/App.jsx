import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [currentTask, setCurrentTask] = useState(null);
  const [taskDescription, setTaskDescription] = useState('');
  const [projectName, setProjectName] = useState('');
  const [ticketNumber, setTicketNumber] = useState('NA');

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US');
  };

  const formatTime = (date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}.${minutes} ${ampm}`;
  };

  const startNewTask = () => {
    const now = new Date();
    const newTask = {
      startDate: formatDate(now),
      startTime: formatTime(now),
      project: projectName,
      ticket: ticketNumber,
      description: '',
      endDate: '',
      endTime: '',
      status: 'pending'
    };
    setCurrentTask(newTask);
  };

  const completeTask = () => {
    const now = new Date();
    const completedTask = {
      ...currentTask,
      description: taskDescription,
      endDate: formatDate(now),
      endTime: formatTime(now),
      status: 'completed'
    };
    
    setTasks([...tasks, completedTask]);
    setCurrentTask(null);
    setTaskDescription('');
  };

  const copyToClipboard = () => {
    const tasksText = tasks.map(task => 
      `${task.startDate}\t${task.startTime}\t${task.project}\t${task.ticket}\t${task.description}\t${task.endDate}\t${task.endTime}\t${task.status}`
    ).join('\n');
    
    navigator.clipboard.writeText(tasksText)
      .then(() => alert('Tasks copied to clipboard!'))
      .catch(err => console.error('Failed to copy: ', err));
  };

  return (
    <div className="app">
      <h1>Work Time Tracker</h1>
      
      <div className="input-section">
        <div className="form-group">
          <label>Project Name:</label>
          <input 
            type="text" 
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Enter project name"
          />
        </div>
        
        <div className="form-group">
          <label>Ticket Number:</label>
          <input 
            type="text" 
            value={ticketNumber}
            onChange={(e) => setTicketNumber(e.target.value)}
            placeholder="Enter ticket number"
          />
        </div>
      </div>
      
      {!currentTask ? (
        <button className="add-button" onClick={startNewTask}>+</button>
      ) : (
        <div className="current-task">
          <div className="task-info">
            <span>{currentTask.startDate}</span>
            <span>{currentTask.startTime}</span>
            <span>{currentTask.project}</span>
            <span>{currentTask.ticket}</span>
          </div>
          
          <textarea
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            placeholder="Enter task description"
            rows={3}
          />
          
          <button className="complete-button" onClick={completeTask}>
            Complete
          </button>
        </div>
      )}
      
      {tasks.length > 0 && (
        <>
          <div className="task-list">
            <table>
              <thead>
                <tr>
                  <th>Start Date</th>
                  <th>Start Time</th>
                  <th>Project</th>
                  <th>Ticket</th>
                  <th>Description</th>
                  <th>End Date</th>
                  <th>End Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task, index) => (
                  <tr key={index}>
                    <td>{task.startDate}</td>
                    <td>{task.startTime}</td>
                    <td>{task.project}</td>
                    <td>{task.ticket}</td>
                    <td>{task.description}</td>
                    <td>{task.endDate}</td>
                    <td>{task.endTime}</td>
                    <td>{task.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <button className="copy-button" onClick={copyToClipboard}>
            Copy All Tasks
          </button>
        </>
      )}
    </div>
  );
}

export default App;