// Data service to handle all MySQL operations via PHP backend
/*
const DATA_TYPES = {
  COMPANIES: 'companies',
  EMPLOYEES: 'employees',
  TASKS: 'tasks',
  FORMS: 'forms'
};

// Base URL for API (ajuste conforme necessário)
const API_BASE_URL = 'http://localhost/api';

// Utility function to make API calls
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
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

// Cache for better performance
const cache = {};

// MySQL Data Service
const mysqlDataService = {
  // Initialize cache from localStorage if exists (migration helper)
  initialize: async function() {
    console.log('Initializing MySQL Data Service...');
    
    // Migration helper: if localStorage data exists, migrate to MySQL
    for (const type of Object.values(DATA_TYPES)) {
      const localData = localStorage.getItem(`${type}_ndjson`);
      if (localData) {
        console.log(`Migrating ${type} data from localStorage to MySQL...`);
        try {
          const items = this.parseNDJSON(localData);
          for (const item of items) {
            await this.create(type, item);
          }
          console.log(`${type} migration completed`);
        } catch (error) {
          console.error(`Error migrating ${type}:`, error);
        }
      }
    }
    
    return this;
  },
  
  // Convert array to NDJSON string (for compatibility)
  toNDJSON: function(array) {
    return array.map(item => JSON.stringify(item)).join('\n');
  },
  
  // Parse NDJSON string to array (for compatibility)
  parseNDJSON: function(ndjson) {
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
  },
  
  // Create operation
  create: async function(type, item) {
    try {
      await apiCall('save.php', {
        method: 'POST',
        body: JSON.stringify({
          type,
          id: item.id,
          data: item
        })
      });
      
      // Update cache
      if (!cache[type]) cache[type] = [];
      const existingIndex = cache[type].findIndex(cached => cached.id === item.id);
      if (existingIndex >= 0) {
        cache[type][existingIndex] = item;
      } else {
        cache[type].push(item);
      }
      
      return item;
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  },
  
  // Read operation - get all
  getAll: async function(type) {
    try {
      // Check cache first
      if (cache[type]) {
        return cache[type];
      }
      
      const response = await apiCall(`read.php?type=${type}`);
      cache[type] = response.data || [];
      return cache[type];
    } catch (error) {
      console.error('Error getting all items:', error);
      // Return empty array on error to maintain compatibility
      return [];
    }
  },
  
  // Read operation - get by id
  getById: async function(type, id) {
    try {
      // Check cache first
      if (cache[type]) {
        const cached = cache[type].find(item => item.id === id);
        if (cached) return cached;
      }
      
      const response = await apiCall(`read.php?type=${type}&id=${id}`);
      return response.data;
    } catch (error) {
      console.error('Error getting item by id:', error);
      return null;
    }
  },
  
  // Update operation
  update: async function(type, id, updates) {
    try {
      // Get current item
      const current = await this.getById(type, id);
      if (!current) return null;
      
      // Merge updates
      const updated = { ...current, ...updates };
      
      await apiCall('save.php', {
        method: 'POST',
        body: JSON.stringify({
          type,
          id,
          data: updated
        })
      });
      
      // Update cache
      if (cache[type]) {
        const index = cache[type].findIndex(item => item.id === id);
        if (index >= 0) {
          cache[type][index] = updated;
        }
      }
      
      return updated;
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  },
  
  // Delete operation
  delete: async function(type, id) {
    try {
      await apiCall('delete.php', {
        method: 'DELETE',
        body: JSON.stringify({ type, id })
      });
      
      // Update cache
      if (cache[type]) {
        cache[type] = cache[type].filter(item => item.id !== id);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting item:', error);
      return false;
    }
  },
  
  // Task status operations (keeping all existing functionality)
  startTransit: async function(taskId, coordinates) {
    const task = await this.getById(this.DATA_TYPES.TASKS, taskId);
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
    
    return await this.update(this.DATA_TYPES.TASKS, taskId, updates);
  },
  
  endTransit: async function(taskId, coordinates) {
    const task = await this.getById(this.DATA_TYPES.TASKS, taskId);
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
    
    return await this.update(this.DATA_TYPES.TASKS, taskId, updates);
  },
  
  startTask: async function(taskId, coordinates) {
    const task = await this.getById(this.DATA_TYPES.TASKS, taskId);
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
      pauseTimes: []
    };
    
    return await this.update(this.DATA_TYPES.TASKS, taskId, updates);
  },
  
  pauseTask: async function(taskId, coordinates, reason) {
    const task = await this.getById(this.DATA_TYPES.TASKS, taskId);
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
    
    return await this.update(this.DATA_TYPES.TASKS, taskId, updates);
  },
  
  resumeTask: async function(taskId, coordinates) {
    const task = await this.getById(this.DATA_TYPES.TASKS, taskId);
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
    
    return await this.update(this.DATA_TYPES.TASKS, taskId, updates);
  },
  
  startReturnTransit: async function(taskId, coordinates) {
    const task = await this.getById(this.DATA_TYPES.TASKS, taskId);
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
      transitStartedAt: timestamp
    };
    
    return await this.update(this.DATA_TYPES.TASKS, taskId, updates);
  },
  
  completeTask: async function(taskId, coordinates, observations) {
    const task = await this.getById(this.DATA_TYPES.TASKS, taskId);
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
    
    return await this.update(this.DATA_TYPES.TASKS, taskId, updates);
  },
  
  finalizeTask: async function(taskId, finalObservations) {
    const task = await this.getById(this.DATA_TYPES.TASKS, taskId);
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
    
    return await this.update(this.DATA_TYPES.TASKS, taskId, updates);
  },
  
  // Constants
  DATA_TYPES
};

// Export
window.dataService = mysqlDataService;
*/
