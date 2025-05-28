// Data service to handle all NDJSON operations
const DATA_TYPES = {
  COMPANIES: 'companies',
  EMPLOYEES: 'employees',
  TASKS: 'tasks',
  FORMS: 'forms'
};

// Initialize data store
const dataStore = {};

// Initialize from localStorage
function initializeFromLocalStorage() {
  // Load existing data from localStorage (for compatibility with previous version)
  Object.values(DATA_TYPES).forEach(type => {
    const existingData = localStorage.getItem(type);
    if (existingData) {
      try {
        dataStore[type] = JSON.parse(existingData);
      } catch (e) {
        console.error(`Error parsing ${type} data:`, e);
        dataStore[type] = [];
      }
    } else {
      dataStore[type] = [];
    }
  });
  
  // Save to NDJSON format
  Object.entries(dataStore).forEach(([type, data]) => {
    saveToNDJSON(type, data);
  });
}

// Convert array to NDJSON string
function toNDJSON(array) {
  return array.map(item => JSON.stringify(item)).join('\n');
}

// Parse NDJSON string to array
function parseNDJSON(ndjson) {
  if (!ndjson || ndjson.trim() === '') return [];
  
  return ndjson
    .split('\n')
    .filter(line => line.trim() !== '')
    .map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        console.error('Failed to parse NDJSON line:', line, e);
        return null;
      }
    })
    .filter(item => item !== null);
}

// Save data to NDJSON format in localStorage
function saveToNDJSON(type, data) {
  const ndjson = toNDJSON(data);
  localStorage.setItem(`${type}_ndjson`, ndjson);
  
  // Keep the JSON format for backward compatibility
  localStorage.setItem(type, JSON.stringify(data));
  
  return ndjson;
}

// Load data from NDJSON format
function loadFromNDJSON(type) {
  const ndjson = localStorage.getItem(`${type}_ndjson`);
  if (!ndjson) {
    return [];
  }
  return parseNDJSON(ndjson);
}

// Calculate time difference and format as HH:MM:SS
function calculateTimeDifference(startTime, endTime) {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const diffMs = end - start;
  
  // Convert to hours, minutes, seconds
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  
  // Format as HH:MM:SS
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Generic CRUD operations
const dataService = {
  initialize: function() {
    initializeFromLocalStorage();
    return this;
  },
  
  // Create operation
  create: function(type, item) {
    const items = this.getAll(type);
    items.push(item);
    saveToNDJSON(type, items);
    return item;
  },
  
  // Read operation - get all
  getAll: function(type) {
    return loadFromNDJSON(type);
  },
  
  // Read operation - get by id
  getById: function(type, id) {
    const items = this.getAll(type);
    return items.find(item => item.id === id);
  },
  
  // Update operation
  update: function(type, id, updates) {
    const items = this.getAll(type);
    const index = items.findIndex(item => item.id === id);
    
    if (index !== -1) {
      items[index] = { ...items[index], ...updates };
      saveToNDJSON(type, items);
      return items[index];
    }
    
    return null;
  },
  
  // Delete operation
  delete: function(type, id) {
    const items = this.getAll(type);
    const filtered = items.filter(item => item.id !== id);
    
    if (filtered.length < items.length) {
      saveToNDJSON(type, filtered);
      return true;
    }
    
    return false;
  },
  
  // Task status operations
  startTransit: function(taskId, coordinates) {
    const task = this.getById(this.DATA_TYPES.TASKS, taskId);
    if (!task) return null;
    
    const timestamp = new Date().toISOString();
    
    // Add to history
    const history = task.history || [];
    history.push({
      timestamp,
      action: 'iniciou_translado',
      coordinates,
      observations: 'Translado iniciado pelo técnico'
    });
    
    // Update task
    const updates = {
      status: 'em_translado',
      history,
      transitStartedAt: timestamp
    };
    
    return this.update(this.DATA_TYPES.TASKS, taskId, updates);
  },
  
  endTransit: function(taskId, coordinates) {
    const task = this.getById(this.DATA_TYPES.TASKS, taskId);
    if (!task || !task.transitStartedAt) return null;
    
    const timestamp = new Date().toISOString();
    
    // Add to history
    const history = task.history || [];
    history.push({
      timestamp,
      action: 'encerrou_translado',
      coordinates,
      observations: 'Translado encerrado pelo técnico'
    });
    
    // Calculate transit time
    const transitTime = calculateTimeDifference(task.transitStartedAt, timestamp);
    
    // Initialize or update report
    const report = task.report || {};
    
    // If this is return transit
    if (task.status === 'retornando') {
      report.returnTransitTime = transitTime;
      report.returnEndLocation = coordinates;
      report.returnObservations = 'Retorno concluído';
    } else {
      report.transitTime = transitTime;
      report.transitEndLocation = coordinates;
      report.transitObservations = 'Chegada ao local da tarefa';
    }
    
    // Update task
    const updates = {
      status: task.status === 'retornando' ? 'finalizado' : 'aguardando_inicio',
      history,
      report
    };
    
    return this.update(this.DATA_TYPES.TASKS, taskId, updates);
  },
  
  startTask: function(taskId, coordinates) {
    const task = this.getById(this.DATA_TYPES.TASKS, taskId);
    if (!task) return null;
    
    const timestamp = new Date().toISOString();
    
    // Add to history
    const history = task.history || [];
    history.push({
      timestamp,
      action: 'iniciada',
      coordinates,
      observations: 'Tarefa iniciada pelo técnico'
    });
    
    // Initialize or update report
    const report = task.report || {};
    report.startLocation = coordinates;
    report.taskStartedAt = timestamp;
    report.startObservations = 'Início da execução da tarefa';
    
    // Update task
    const updates = {
      status: 'em_andamento',
      history,
      report,
      taskStartedAt: timestamp,
      pauseTimes: [] // Initialize pause times array
    };
    
    return this.update(this.DATA_TYPES.TASKS, taskId, updates);
  },
  
  pauseTask: function(taskId, coordinates, reason) {
    const task = this.getById(this.DATA_TYPES.TASKS, taskId);
    if (!task || task.status !== 'em_andamento') return null;
    
    const timestamp = new Date().toISOString();
    
    // Add to history
    const history = task.history || [];
    history.push({
      timestamp,
      action: 'pausada',
      coordinates,
      observations: reason || 'Tarefa pausada pelo técnico'
    });
    
    // Initialize pause time entry
    const pauseEntry = {
      startedAt: timestamp,
      location: coordinates,
      reason: reason || 'Pausa sem motivo especificado'
    };
    
    // Add to pause times array
    const pauseTimes = task.pauseTimes || [];
    pauseTimes.push(pauseEntry);
    
    // Update task
    const updates = {
      status: 'pausada',
      history,
      pauseTimes,
      currentPauseStartedAt: timestamp
    };
    
    return this.update(this.DATA_TYPES.TASKS, taskId, updates);
  },
  
  resumeTask: function(taskId, coordinates) {
    const task = this.getById(this.DATA_TYPES.TASKS, taskId);
    if (!task || task.status !== 'pausada') return null;
    
    const timestamp = new Date().toISOString();
    
    // Add to history
    const history = task.history || [];
    history.push({
      timestamp,
      action: 'retomada',
      coordinates,
      observations: 'Tarefa retomada pelo técnico'
    });
    
    // Update the last pause time entry with end time
    const pauseTimes = task.pauseTimes || [];
    if (pauseTimes.length > 0) {
      const lastPauseIndex = pauseTimes.length - 1;
      pauseTimes[lastPauseIndex] = {
        ...pauseTimes[lastPauseIndex],
        endedAt: timestamp,
        duration: calculateTimeDifference(pauseTimes[lastPauseIndex].startedAt, timestamp)
      };
    }
    
    // Update task
    const updates = {
      status: 'em_andamento',
      history,
      pauseTimes,
      currentPauseStartedAt: null
    };
    
    return this.update(this.DATA_TYPES.TASKS, taskId, updates);
  },
  
  startReturnTransit: function(taskId, coordinates) {
    const task = this.getById(this.DATA_TYPES.TASKS, taskId);
    if (!task || !['concluida', 'aguardando_retorno'].includes(task.status)) return null;
    
    const timestamp = new Date().toISOString();
    
    // Add to history
    const history = task.history || [];
    history.push({
      timestamp,
      action: 'iniciou_retorno',
      coordinates,
      observations: 'Retorno iniciado pelo técnico'
    });
    
    // Initialize or update report
    const report = task.report || {};
    report.returnStartLocation = coordinates;
    report.returnStartObservations = 'Início do retorno';
    
    // Update task
    const updates = {
      status: 'retornando',
      history,
      report,
      transitStartedAt: timestamp // Reuse the same field for return transit
    };
    
    return this.update(this.DATA_TYPES.TASKS, taskId, updates);
  },
  
  completeTask: function(taskId, coordinates, observations) {
    const task = this.getById(this.DATA_TYPES.TASKS, taskId);
    if (!task || task.status !== 'em_andamento') return null;
    
    const timestamp = new Date().toISOString();
    
    // Add to history
    const history = task.history || [];
    history.push({
      timestamp,
      action: 'concluida',
      coordinates,
      observations: observations || 'Tarefa concluída pelo técnico'
    });
    
    // Calculate work time
    let workTime = '00:00:00';
    if (task.taskStartedAt) {
      // Calculate total time
      const totalTime = calculateTimeDifference(task.taskStartedAt, timestamp);
      
      // Calculate pause time
      let totalPauseMs = 0;
      if (task.pauseTimes && task.pauseTimes.length > 0) {
        for (const pause of task.pauseTimes) {
          if (pause.startedAt && pause.endedAt) {
            const pauseStart = new Date(pause.startedAt).getTime();
            const pauseEnd = new Date(pause.endedAt).getTime();
            totalPauseMs += (pauseEnd - pauseStart);
          }
        }
      }
      
      // Calculate work time by subtracting pause time
      const totalWorkMs = new Date(timestamp).getTime() - new Date(task.taskStartedAt).getTime() - totalPauseMs;
      const hours = Math.floor(totalWorkMs / (1000 * 60 * 60));
      const minutes = Math.floor((totalWorkMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((totalWorkMs % (1000 * 60)) / 1000);
      workTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Initialize or update report
    const report = task.report || {};
    report.endLocation = coordinates;
    report.completedAt = timestamp;
    report.workTime = workTime;
    report.observations = observations || '';
    report.completionObservations = observations || 'Tarefa finalizada sem observações';
    
    // Calculate total pause time
    if (task.pauseTimes && task.pauseTimes.length > 0) {
      let totalPauseTime = '00:00:00';
      const validPauses = task.pauseTimes.filter(pause => pause.startedAt && pause.endedAt);
      
      if (validPauses.length > 0) {
        const totalPauseMs = validPauses.reduce((total, pause) => {
          const pauseStart = new Date(pause.startedAt).getTime();
          const pauseEnd = new Date(pause.endedAt).getTime();
          return total + (pauseEnd - pauseStart);
        }, 0);
        
        const hours = Math.floor(totalPauseMs / (1000 * 60 * 60));
        const minutes = Math.floor((totalPauseMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((totalPauseMs % (1000 * 60)) / 1000);
        totalPauseTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      
      report.pauseTime = totalPauseTime;
      report.pauseDetails = task.pauseTimes;
    }
    
    // Update task
    const updates = {
      status: 'aguardando_retorno',
      history,
      report
    };
    
    return this.update(this.DATA_TYPES.TASKS, taskId, updates);
  },
  
  finalizeTask: function(taskId, finalObservations) {
    const task = this.getById(this.DATA_TYPES.TASKS, taskId);
    if (!task || task.status !== 'finalizado') return null;
    
    const timestamp = new Date().toISOString();
    
    // Add to history
    const history = task.history || [];
    history.push({
      timestamp,
      action: 'finalizada',
      observations: finalObservations || 'Tarefa finalizada completamente'
    });
    
    // Update report
    const report = task.report || {};
    report.finalObservations = finalObservations || '';
    report.finalizedAt = timestamp;
    
    // Update task
    const updates = {
      status: 'concluida',
      history,
      report
    };
    
    return this.update(this.DATA_TYPES.TASKS, taskId, updates);
  },
  
  // Constants
  DATA_TYPES
};

// Initialize the data service
dataService.initialize();


window.dataService = dataService;
