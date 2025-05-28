
// Global variables
let currentUserId = null;
let map = null;
let userMarker = null;
let taskMarkers = [];
let watchId = null;
let currentCoordinates = null;
let currentTask = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  // Check if the user is already logged in
  checkLogin();
  
  // Event listeners
  document.getElementById('loginForm').addEventListener('submit', login);
  document.getElementById('btn-logout').addEventListener('click', logout);
  
  // Load task list if user is logged in
  if (currentUserId) {
    loadTaskList();
  }
});

// Check if user is logged in
function checkLogin() {
  const userId = localStorage.getItem('currentUserId');
  const userName = localStorage.getItem('currentUserName');
  
  if (userId && userName) {
    // User is logged in
    currentUserId = parseInt(userId);
    showUserPanel(userName);
  } else {
    // User is not logged in
    showLoginPanel();
    loadEmployees();
  }
}

// Show login panel
function showLoginPanel() {
  document.getElementById('login-container').classList.remove('d-none');
  document.getElementById('user-panel').classList.add('d-none');
}

// Show user panel
function showUserPanel(userName) {
  document.getElementById('login-container').classList.add('d-none');
  document.getElementById('user-panel').classList.remove('d-none');
  document.getElementById('current-user-name').textContent = userName;
  
  // Initialize the map
  initializeMap();
  
  // Start tracking user's location
  startLocationTracking();
  
  // Load user's tasks
  loadTaskList();
}

// Login function
function login(e) {
  e.preventDefault();
  
  const userId = document.getElementById('userSelect').value;
  if (!userId) {
    alert('Por favor, selecione um usuário');
    return;
  }
  
  // Get user details
  const employees = window.dataService.getAll(window.dataService.DATA_TYPES.EMPLOYEES);
  const user = employees.find(emp => emp.id === parseInt(userId));
  
  if (!user) {
    alert('Usuário não encontrado');
    return;
  }
  
  // Save user to localStorage
  localStorage.setItem('currentUserId', userId);
  localStorage.setItem('currentUserName', user.nome);
  
  // Set current user
  currentUserId = parseInt(userId);
  
  // Show user panel
  showUserPanel(user.nome);
}

// Logout function
function logout(e) {
  e.preventDefault();
  
  // Clear user data
  localStorage.removeItem('currentUserId');
  localStorage.removeItem('currentUserName');
  currentUserId = null;
  
  // Stop location tracking
  stopLocationTracking();
  
  // Show login panel
  showLoginPanel();
  loadEmployees();
}

// Load employees for login select
function loadEmployees() {
  const userSelect = document.getElementById('userSelect');
  
  // Get employees from data service
  const employees = window.dataService.getAll(window.dataService.DATA_TYPES.EMPLOYEES);
  
  // Clear existing options
  userSelect.innerHTML = '<option value="">Selecione seu usuário</option>';
  
  // Add each employee as an option
  employees.forEach(employee => {
    const option = document.createElement('option');
    option.value = employee.id;
    option.textContent = employee.nome;
    userSelect.appendChild(option);
  });
}

// Initialize map
function initializeMap() {
  // Create map if it doesn't exist
  if (!map) {
    map = L.map('map').setView([-2.9055, -41.7734], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Create user location marker (green)
    const userIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    
    userMarker = L.marker([-2.9055, -41.7734], {
      icon: userIcon
    }).addTo(map);
    
    userMarker.bindPopup('Sua localização atual').openPopup();
  }
}

// Start tracking user's location
function startLocationTracking() {
  if (navigator.geolocation) {
    // Update the status indicator
    document.getElementById('status-indicator').style.backgroundColor = '#28a745';
    document.getElementById('location-status').textContent = 'Rastreando sua localização em tempo real...';
    
    // Start watching position
    watchId = navigator.geolocation.watchPosition(
      updateLocation,
      handleLocationError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  } else {
    handleLocationError({ code: 0, message: 'Seu navegador não suporta geolocalização.' });
  }
}

// Update location
function updateLocation(position) {
  const { latitude, longitude } = position.coords;
  currentCoordinates = `${longitude},${latitude}`;
  
  // Update marker position
  if (userMarker) {
    userMarker.setLatLng([latitude, longitude]);
    map.setView([latitude, longitude], map.getZoom());
  }
  
  // Update status indicator
  document.getElementById('status-indicator').style.backgroundColor = '#28a745';
  document.getElementById('location-status').textContent = 'Localização sendo rastreada em tempo real';
  
  // If there's an active task, update it
  if (currentTask) {
    // This would update the current location for the active task if needed
    // For example, you might want to update location every X minutes for an active task
  }
}

// Handle location errors
function handleLocationError(error) {
  let errorMessage = 'Erro ao obter sua localização.';
  
  switch(error.code) {
    case 1:
      errorMessage = 'Permissão negada para geolocalização.';
      break;
    case 2:
      errorMessage = 'Localização indisponível.';
      break;
    case 3:
      errorMessage = 'Tempo esgotado ao obter localização.';
      break;
  }
  
  // Update status indicator
  document.getElementById('status-indicator').style.backgroundColor = '#dc3545';
  document.getElementById('location-status').textContent = errorMessage;
}

// Stop location tracking
function stopLocationTracking() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  
  // Clear the map
  if (map) {
    map.remove();
    map = null;
  }
}

// Load user's tasks
function loadTaskList() {
  if (!currentUserId) return;
  
  const taskList = document.getElementById('task-list');
  
  // Get all tasks from data service
  const allTasks = window.dataService.getAll(window.dataService.DATA_TYPES.TASKS);
  
  // Filter tasks for current user
  const userTasks = allTasks.filter(task => task.colaboradorId === currentUserId);
  
  // Clear existing task markers
  clearTaskMarkers();
  
  if (userTasks.length === 0) {
    taskList.innerHTML = `
      <div class="text-center py-4 text-muted">
        <p>Nenhuma tarefa atribuída a você</p>
      </div>
    `;
    return;
  }
  
  // Separate tasks into active and completed
  const pendingTasks = userTasks.filter(task => task.status !== 'concluida');
  const completedTasks = userTasks.filter(task => task.status === 'concluida');
  
  // Generate HTML for task list
  let html = '';
  
  // Active tasks section
  if (pendingTasks.length > 0) {
    html += '<h5 class="my-3">Tarefas Ativas</h5>';
    
    pendingTasks.forEach(task => {
      // Format date (DD/MM/YYYY)
      const dateParts = task.data.split('-');
      const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
      
      // Determine badge style based on status
      let badgeClass = 'bg-secondary';
      let statusText = 'Pendente';
      
      switch(task.status) {
        case 'pendente':
          badgeClass = 'bg-warning text-dark';
          statusText = 'Pendente';
          break;
        case 'em_translado':
          badgeClass = 'bg-warning text-dark';
          statusText = 'Em Translado';
          break;
        case 'aguardando_inicio':
          badgeClass = 'bg-info text-dark';
          statusText = 'Aguardando Início';
          break;
        case 'em_andamento':
          badgeClass = 'bg-primary';
          statusText = 'Em Andamento';
          break;
        case 'pausada':
          badgeClass = 'bg-info text-dark';
          statusText = 'Pausada';
          break;
        case 'aguardando_retorno':
          badgeClass = 'bg-info text-dark';
          statusText = 'Aguardando Retorno';
          break;
        case 'retornando':
          badgeClass = 'bg-warning text-dark';
          statusText = 'Retornando';
          break;
        case 'finalizado':
          badgeClass = 'bg-info text-dark';
          statusText = 'Finalizado';
          break;
      }
      
      html += `
        <div class="list-group-item task-item" data-id="${task.id}" data-bs-toggle="modal" data-bs-target="#taskDetailModal">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h6 class="mb-1">${task.empresaNome}</h6>
              <small class="text-muted">${formattedDate} às ${task.hora}</small>
            </div>
            <span class="badge ${badgeClass}">${statusText}</span>
          </div>
          <p class="mb-1 small task-description">${task.descricao.length > 100 ? task.descricao.substring(0, 100) + '...' : task.descricao}</p>
        </div>
      `;
      
      // Add task marker to map
      addTaskMarker(task);
    });
  }
  
  // Completed tasks section with dropdown
  if (completedTasks.length > 0) {
    html += `
      <h5 class="mt-4 mb-2">Tarefas Concluídas</h5>
      <div class="mb-2">
        <select class="form-select form-select-sm" id="completed-date-filter">
          <option value="">Todas as datas</option>
          ${getUniqueDates(completedTasks).map(date => `<option value="${date}">${formatDate(date)}</option>`).join('')}
        </select>
      </div>
      <div id="completed-tasks-container">
    `;
    
    completedTasks.forEach(task => {
      // Format date (DD/MM/YYYY)
      const dateParts = task.data.split('-');
      const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
      
      html += `
        <div class="list-group-item task-item completed-task" data-id="${task.id}" data-date="${task.data}" data-bs-toggle="modal" data-bs-target="#taskDetailModal">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h6 class="mb-1">${task.empresaNome}</h6>
              <small class="text-muted">${formattedDate} às ${task.hora}</small>
            </div>
            <span class="badge bg-success">Concluída</span>
          </div>
          <p class="mb-1 small task-description">${task.descricao.length > 100 ? task.descricao.substring(0, 100) + '...' : task.descricao}</p>
        </div>
      `;
      
      // Add task marker to map with different color for completed tasks
      addTaskMarker(task, true);
    });
    
    html += '</div>';
  }
  
  taskList.innerHTML = html;
  
  // Add click event listeners to task items
  document.querySelectorAll('.task-item').forEach(item => {
    item.addEventListener('click', function() {
      const taskId = parseInt(this.getAttribute('data-id'));
      showTaskDetails(taskId);
    });
  });
  
  // Add change event listener to date filter
  const dateFilter = document.getElementById('completed-date-filter');
  if (dateFilter) {
    dateFilter.addEventListener('change', function() {
      filterCompletedTasks(this.value);
    });
  }
}

// Get unique dates from completed tasks
function getUniqueDates(tasks) {
  const dates = tasks.map(task => task.data);
  return [...new Set(dates)].sort().reverse(); // Most recent first
}

// Format date from YYYY-MM-DD to DD/MM/YYYY
function formatDate(dateStr) {
  const dateParts = dateStr.split('-');
  return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
}

// Filter completed tasks by date
function filterCompletedTasks(date) {
  const completedTasks = document.querySelectorAll('.completed-task');
  
  if (!date) {
    // Show all
    completedTasks.forEach(task => {
      task.style.display = '';
    });
  } else {
    // Filter by date
    completedTasks.forEach(task => {
      if (task.getAttribute('data-date') === date) {
        task.style.display = '';
      } else {
        task.style.display = 'none';
      }
    });
  }
}

// Add task marker to the map
function addTaskMarker(task, completed = false) {
  if (!map) return;
  
  // Parse coordinates
  const [lng, lat] = task.coordinates.split(',').map(parseFloat);
  
  // Choose icon color based on task status
  let iconColor = 'red'; // Default for pending
  
  if (completed) {
    iconColor = 'green';
  } else if (task.status === 'em_andamento' || task.status === 'pausada') {
    iconColor = 'blue';
  } else if (task.status === 'em_translado' || task.status === 'retornando') {
    iconColor = 'orange';
  }
  
  // Create icon
  const taskIcon = L.icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${iconColor}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
  
  // Create marker
  const marker = L.marker([lat, lng], {
    icon: taskIcon
  }).addTo(map);
  
  // Format date (DD/MM/YYYY)
  const dateParts = task.data.split('-');
  const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
  
  // Create popup with task details
  marker.bindPopup(`
    <strong>${task.empresaNome}</strong><br>
    ${formattedDate} às ${task.hora}<br>
    <small>${task.descricao.substring(0, 50)}${task.descricao.length > 50 ? '...' : ''}</small><br>
    <button class="btn btn-sm btn-primary mt-2 view-task-btn" data-id="${task.id}">Ver Detalhes</button>
  `);
  
  // Add click handler to the button in popup
  marker.on('popupopen', function() {
    const viewBtn = document.querySelector(`.view-task-btn[data-id="${task.id}"]`);
    if (viewBtn) {
      viewBtn.addEventListener('click', function() {
        showTaskDetails(task.id);
        // Open the modal
        const modal = new bootstrap.Modal(document.getElementById('taskDetailModal'));
        modal.show();
      });
    }
  });
  
  // Store the marker to clear it later
  taskMarkers.push(marker);
}

// Clear all task markers
function clearTaskMarkers() {
  taskMarkers.forEach(marker => {
    marker.remove();
  });
  taskMarkers = [];
}

// Show task details in modal
function showTaskDetails(taskId) {
  // Get task from data service
  const task = window.dataService.getById(window.dataService.DATA_TYPES.TASKS, taskId);
  
  if (!task) return;
  
  // Set current task
  currentTask = task;
  
  // Format date for display (DD/MM/YYYY)
  const dateParts = task.data.split('-');
  const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
  
  // Update modal content
  const detailContent = document.getElementById('task-detail-content');
  const modalFooter = document.querySelector('#taskDetailModal .modal-footer');
  
  let statusBadge = '';
  switch(task.status) {
    case 'pendente':
      statusBadge = '<span class="badge bg-warning text-dark">Pendente</span>';
      break;
    case 'em_translado':
      statusBadge = '<span class="badge bg-warning text-dark">Em Translado</span>';
      break;
    case 'aguardando_inicio':
      statusBadge = '<span class="badge bg-info text-dark">Aguardando Início</span>';
      break;
    case 'em_andamento':
      statusBadge = '<span class="badge bg-primary">Em Andamento</span>';
      break;
    case 'pausada':
      statusBadge = '<span class="badge bg-info text-dark">Pausada</span>';
      break;
    case 'aguardando_retorno':
      statusBadge = '<span class="badge bg-info text-dark">Aguardando Retorno</span>';
      break;
    case 'retornando':
      statusBadge = '<span class="badge bg-warning text-dark">Retornando</span>';
      break;
    case 'finalizado':
      statusBadge = '<span class="badge bg-info text-dark">Finalizado</span>';
      break;
    case 'concluida':
      statusBadge = '<span class="badge bg-success">Concluída</span>';
      break;
  }
  
  detailContent.innerHTML = `
    <h5>${task.empresaNome}</h5>
    <p><strong>Data:</strong> ${formattedDate} às ${task.hora}</p>
    <p><strong>Status:</strong> ${statusBadge}</p>
    <p><strong>Descrição:</strong></p>
    <div class="border p-2 bg-light mb-3">${task.descricao}</div>
  `;
  
  // Add report information if available
  if (task.report) {
    let reportHtml = '<h6>Relatório de Atividade:</h6><div class="border p-2 bg-light mb-3">';
    
    if (task.report.transitTime) {
      reportHtml += `<p><small><strong>Tempo de Translado (Ida):</strong> ${task.report.transitTime}</small></p>`;
    }
    
    if (task.report.workTime) {
      reportHtml += `<p><small><strong>Tempo de Trabalho:</strong> ${task.report.workTime}</small></p>`;
    }
    
    if (task.report.pauseTime) {
      reportHtml += `<p><small><strong>Tempo em Pausa:</strong> ${task.report.pauseTime}</small></p>`;
    }
    
    if (task.report.returnTransitTime) {
      reportHtml += `<p><small><strong>Tempo de Translado (Volta):</strong> ${task.report.returnTransitTime}</small></p>`;
    }
    
    if (task.report.observations) {
      reportHtml += `<p><small><strong>Observações:</strong> ${task.report.observations}</small></p>`;
    }
    
    reportHtml += '</div>';
    
    detailContent.innerHTML += reportHtml;
  }
  
  // Clear existing buttons
  modalFooter.innerHTML = '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>';
  
  // Add action buttons based on task status
  if (task.status === 'pendente') {
    modalFooter.innerHTML += `
      <button type="button" class="btn btn-primary" id="start-transit-btn">
        <i class="bi bi-truck"></i> Iniciar Translado
      </button>
    `;
    
    // Add event listener
    setTimeout(() => {
      document.getElementById('start-transit-btn').addEventListener('click', startTransit);
    }, 100);
  }
  else if (task.status === 'em_translado') {
    modalFooter.innerHTML += `
      <button type="button" class="btn btn-primary" id="end-transit-btn">
        <i class="bi bi-check2-circle"></i> Encerrar Translado
      </button>
    `;
    
    // Add event listener
    setTimeout(() => {
      document.getElementById('end-transit-btn').addEventListener('click', endTransit);
    }, 100);
  }
  else if (task.status === 'aguardando_inicio') {
    modalFooter.innerHTML += `
      <button type="button" class="btn btn-primary" id="start-task-btn">
        <i class="bi bi-play-circle"></i> Iniciar Atendimento
      </button>
    `;
    
    // Add event listener
    setTimeout(() => {
      document.getElementById('start-task-btn').addEventListener('click', startTask);
    }, 100);
  }
  else if (task.status === 'em_andamento') {
    modalFooter.innerHTML += `
      <button type="button" class="btn btn-warning me-2" id="pause-task-btn">
        <i class="bi bi-pause-circle"></i> Pausar
      </button>
      <button type="button" class="btn btn-success" id="complete-task-btn">
        <i class="bi bi-check2-circle"></i> Concluir
      </button>
    `;
    
    // Add event listeners
    setTimeout(() => {
      document.getElementById('pause-task-btn').addEventListener('click', pauseTask);
      document.getElementById('complete-task-btn').addEventListener('click', completeTask);
    }, 100);
  }
  else if (task.status === 'pausada') {
    modalFooter.innerHTML += `
      <button type="button" class="btn btn-primary" id="resume-task-btn">
        <i class="bi bi-play-circle"></i> Retomar
      </button>
    `;
    
    // Add event listener
    setTimeout(() => {
      document.getElementById('resume-task-btn').addEventListener('click', resumeTask);
    }, 100);
  }
  else if (task.status === 'aguardando_retorno') {
    modalFooter.innerHTML += `
      <button type="button" class="btn btn-primary" id="start-return-btn">
        <i class="bi bi-truck"></i> Iniciar Retorno
      </button>
    `;
    
    // Add event listener
    setTimeout(() => {
      document.getElementById('start-return-btn').addEventListener('click', startReturnTransit);
    }, 100);
  }
  else if (task.status === 'retornando') {
    modalFooter.innerHTML += `
      <button type="button" class="btn btn-primary" id="end-return-btn">
        <i class="bi bi-check2-circle"></i> Encerrar Retorno
      </button>
    `;
    
    // Add event listener
    setTimeout(() => {
      document.getElementById('end-return-btn').addEventListener('click', endReturnTransit);
    }, 100);
  }
  else if (task.status === 'finalizado') {
    modalFooter.innerHTML += `
      <button type="button" class="btn btn-success" id="finalize-task-btn">
        <i class="bi bi-check2-all"></i> Finalizar Tarefa
      </button>
    `;
    
    // Add event listener
    setTimeout(() => {
      document.getElementById('finalize-task-btn').addEventListener('click', finalizeTask);
    }, 100);
  }
}

// Start transit function
function startTransit() {
  if (!currentTask) return;
  
  if (!currentCoordinates) {
    alert('Não foi possível obter sua localização atual. Por favor, verifique as permissões de localização.');
    return;
  }
  
  // Update task in data service
  const updatedTask = window.dataService.startTransit(currentTask.id, currentCoordinates);
  
  if (updatedTask) {
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('taskDetailModal'));
    modal.hide();
    
    // Update current task
    currentTask = updatedTask;
    
    // Reload task list
    loadTaskList();
    
    // Show success message
    alert('Translado iniciado com sucesso!');
  }
}

// End transit function
function endTransit() {
  if (!currentTask) return;
  
  if (!currentCoordinates) {
    alert('Não foi possível obter sua localização atual. Por favor, verifique as permissões de localização.');
    return;
  }
  
  // Update task in data service
  const updatedTask = window.dataService.endTransit(currentTask.id, currentCoordinates);
  
  if (updatedTask) {
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('taskDetailModal'));
    modal.hide();
    
    // Update current task
    currentTask = updatedTask;
    
    // Reload task list
    loadTaskList();
    
    // Show success message
    alert('Translado encerrado com sucesso!');
  }
}

// Start task function
function startTask() {
  if (!currentTask) return;
  
  if (!currentCoordinates) {
    alert('Não foi possível obter sua localização atual. Por favor, verifique as permissões de localização.');
    return;
  }
  
  // Update task in data service
  const updatedTask = window.dataService.startTask(currentTask.id, currentCoordinates);
  
  if (updatedTask) {
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('taskDetailModal'));
    modal.hide();
    
    // Update current task
    currentTask = updatedTask;
    
    // Reload task list
    loadTaskList();
    
    // Show success message
    alert('Atendimento iniciado com sucesso!');
  }
}

// Pause task function
function pauseTask() {
  if (!currentTask) return;
  
  if (!currentCoordinates) {
    alert('Não foi possível obter sua localização atual. Por favor, verifique as permissões de localização.');
    return;
  }
  
  // Prompt for pause reason
  const reason = prompt('Por favor, informe o motivo da pausa:');
  
  if (reason === null) {
    // User canceled
    return;
  }
  
  // Update task in data service
  const updatedTask = window.dataService.pauseTask(currentTask.id, currentCoordinates, reason);
  
  if (updatedTask) {
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('taskDetailModal'));
    modal.hide();
    
    // Update current task
    currentTask = updatedTask;
    
    // Reload task list
    loadTaskList();
    
    // Show success message
    alert('Atendimento pausado com sucesso!');
  }
}

// Resume task function
function resumeTask() {
  if (!currentTask) return;
  
  if (!currentCoordinates) {
    alert('Não foi possível obter sua localização atual. Por favor, verifique as permissões de localização.');
    return;
  }
  
  // Update task in data service
  const updatedTask = window.dataService.resumeTask(currentTask.id, currentCoordinates);
  
  if (updatedTask) {
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('taskDetailModal'));
    modal.hide();
    
    // Update current task
    currentTask = updatedTask;
    
    // Reload task list
    loadTaskList();
    
    // Show success message
    alert('Atendimento retomado com sucesso!');
  }
}

// Complete task function
function completeTask() {
  if (!currentTask) return;
  
  if (!currentCoordinates) {
    alert('Não foi possível obter sua localização atual. Por favor, verifique as permissões de localização.');
    return;
  }
  
  // Prompt for observations
  const observations = prompt('Observações sobre o atendimento (opcional):');
  
  // Update task in data service
  const updatedTask = window.dataService.completeTask(currentTask.id, currentCoordinates, observations);
  
  if (updatedTask) {
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('taskDetailModal'));
    modal.hide();
    
    // Update current task
    currentTask = updatedTask;
    
    // Reload task list
    loadTaskList();
    
    // Show success message
    alert('Atendimento concluído com sucesso!');
  }
}

// Start return transit function
function startReturnTransit() {
  if (!currentTask) return;
  
  if (!currentCoordinates) {
    alert('Não foi possível obter sua localização atual. Por favor, verifique as permissões de localização.');
    return;
  }
  
  // Update task in data service
  const updatedTask = window.dataService.startReturnTransit(currentTask.id, currentCoordinates);
  
  if (updatedTask) {
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('taskDetailModal'));
    modal.hide();
    
    // Update current task
    currentTask = updatedTask;
    
    // Reload task list
    loadTaskList();
    
    // Show success message
    alert('Retorno iniciado com sucesso!');
  }
}

// End return transit function
function endReturnTransit() {
  if (!currentTask) return;
  
  if (!currentCoordinates) {
    alert('Não foi possível obter sua localização atual. Por favor, verifique as permissões de localização.');
    return;
  }
  
  // Update task in data service
  const updatedTask = window.dataService.endTransit(currentTask.id, currentCoordinates);
  
  if (updatedTask) {
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('taskDetailModal'));
    modal.hide();
    
    // Update current task
    currentTask = updatedTask;
    
    // Reload task list
    loadTaskList();
    
    // Show success message
    alert('Retorno encerrado com sucesso!');
  }
}

// Finalize task function
function finalizeTask() {
  if (!currentTask) return;
  
  // Prompt for final observations
  const finalObservations = prompt('Observações finais sobre a tarefa (opcional):');
  
  // Update task in data service
  const updatedTask = window.dataService.finalizeTask(currentTask.id, finalObservations);
  
  if (updatedTask) {
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('taskDetailModal'));
    modal.hide();
    
    // Update current task
    currentTask = updatedTask;
    
    // Reload task list
    loadTaskList();
    
    // Show success message
    alert('Tarefa finalizada com sucesso!');
  }
}
