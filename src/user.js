//user.js
// Global variables
let currentUserId = null;
let map = null;
let userMarker = null;
let taskMarkers = [];
let watchId = null;
let currentCoordinates = null;
let currentTask = null;

// Variáveis para cancelamento
let currentCancellationTask = null;
let cameraStream = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
  // Check if the user is already logged in
  checkLogin();

  // Event listeners
  document.getElementById('loginForm').addEventListener('submit', login);
  document.getElementById('btn-logout').addEventListener('click', logout);

  // Load task list if user is logged in
  if (currentUserId) {
    loadTaskList();
  }

  // Event listeners para cancelamento
  document.getElementById('capture-btn').addEventListener('click', function () {
    const photoData = capturePhoto();
    const preview = document.getElementById('photo-preview');
    preview.innerHTML = `<img src="${photoData}" class="img-fluid rounded" alt="Foto do local">`;
  });

  document.getElementById('confirm-cancel-btn').addEventListener('click', cancelTask);
  document.getElementById('cancelTaskModal').addEventListener('hidden.bs.modal', stopCamera);
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

  fetch("https://localhost/EBEN/api/listemploye.php")
    .then(response => response.json())
    .then(users => {
      const user = users.find(u => u.id === userId || u.id === parseInt(userId));

      if (!user) {
        alert('Usuário não encontrado');
        return;
      }

      // Definir o usuário atual
      currentUserId = user.id;
      

      // Exibir painel do usuário
      showUserPanel(user.nome);
      
    })
    .catch(error => {
      console.error('Erro ao carregar funcionários:', error);
      alert('Erro ao tentar fazer login. Verifique sua conexão.');
    });
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
  fetch("https://localhost/EBEN/api/listemploye.php")
    .then(response => response.json())
    .then(funcionarios => {
    const userSelect = document.getElementById('userSelect');
    userSelect.innerHTML = '<option value="">Selecione seu usuário</option>';
    funcionarios.forEach(employee => {
    const option = document.createElement('option');
    option.value = employee.id;
    option.textContent = employee.nome;
    userSelect.appendChild(option);
  });
    
    })
    .catch(error => {
      console.error('Erro ao carregar funcionários:', error)
    });

  /*
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
  */
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

  switch (error.code) {
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
  const nomeUsuario = document.getElementById("current-user-name").textContent.trim();
  if (!nomeUsuario) return;

  const taskList = document.getElementById('task-list');

  fetch("https://localhost/EBEN/api/tasklist.php")
    .then(response => response.json())
    .then(tasks => {
      
      // Filtrar tarefas do usuário atual pelo nome
      const userTasks = tasks.filter(task => task.colaborador === nomeUsuario);

      // Mapear os campos do banco para os nomes esperados pelo sistema
      const mappedTasks = userTasks.map(task => ({
        id: task.id,
        colaboradorId: task.colaborador,
        data: task.data_tarefa,
        hora: task.hora_tarefa,
        empresaNome: task.empresa,
        status: task.status,
        descricao: task.descricao || '',
        coordinates: task.coordenadas // AGORA ESTAMOS INCLUINDO AS COORDENADAS
      }));

      renderTaskList(mappedTasks, taskList);
    })
    .catch(error => {
      console.error('Erro ao carregar tarefas:', error);
      taskList.innerHTML = `
        <div class="text-center py-4 text-danger">
          <p>Erro ao carregar tarefas</p>
        </div>
      `;
    });
}

// Função que renderiza a lista de tarefas (baseada no seu código original)
function renderTaskList(userTasks, taskList) {
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

  // Calcular datas limites
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + 6);
  const pastDate = new Date(today);
  pastDate.setDate(today.getDate() - 6);

  const todayStr = today.toISOString().split('T')[0];
  const futureDateStr = futureDate.toISOString().split('T')[0];
  const pastDateStr = pastDate.toISOString().split('T')[0];

  // Filtrar tarefas pendentes
  const pendingTasks = userTasks.filter(task =>
    task.status !== 'concluida' &&
    (task.data <= futureDateStr || task.data < todayStr)
  );

  // Filtrar tarefas concluídas
  const completedTasks = userTasks.filter(task =>
    task.status === 'concluida' &&
    task.data >= pastDateStr &&
    task.data <= futureDateStr
  );

  // Generate HTML for task list
  let html = '';

  // Active tasks section
  if (pendingTasks.length > 0) {
    html += `
      <div class="accordion mb-3" id="active-tasks-accordion">
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#active-tasks-collapse" aria-expanded="true">
              <i class="bi bi-chevron-down me-2 collapse-icon"></i> Tarefas Ativas
            </button>
          </h2>
          <div id="active-tasks-collapse" class="accordion-collapse collapse show" data-bs-parent="#active-tasks-accordion">
            <div class="accordion-body p-0">
    `;

    // Ordenar e processar tarefas pendentes
    pendingTasks.sort((a, b) => new Date(a.data) - new Date(b.data)).forEach(task => {
      const dateParts = task.data.split('-');
      const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
      
      let badgeClass = 'bg-secondary';
      let statusText = 'Pendente';
      const isLate = new Date(task.data + 'T' + task.hora) < new Date();

      if (isLate && task.status === 'pendente') {
        badgeClass = 'bg-danger';
        statusText = 'Atrasada';
      } else {
        switch (task.status) {
          case 'pendente': badgeClass = 'bg-warning text-dark'; break;
          case 'em_translado': badgeClass = 'bg-warning text-dark'; statusText = 'Em Translado'; break;
          case 'aguardando_inicio': badgeClass = 'bg-info text-dark'; statusText = 'Aguardando Início'; break;
          case 'em_andamento': badgeClass = 'bg-primary'; statusText = 'Em Andamento'; break;
          case 'pausada': badgeClass = 'bg-info text-dark'; statusText = 'Pausada'; break;
          case 'aguardando_retorno': badgeClass = 'bg-info text-dark'; statusText = 'Aguardando Retorno'; break;
          case 'retornando': badgeClass = 'bg-warning text-dark'; statusText = 'Retornando'; break;
          case 'finalizado': badgeClass = 'bg-info text-dark'; statusText = 'Finalizado'; break;
          case 'cancelada': badgeClass = 'bg-dark'; statusText = 'Cancelada'; break;
        }
      }

      html += `
        <div class="list-group-item task-item ${isLate ? 'task-late' : ''}" data-id="${task.id}" data-bs-toggle="modal" data-bs-target="#taskDetailModal">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h6 class="mb-1">${task.empresaNome}</h6>
              <small class="text-muted">${formattedDate} às ${task.hora}</small>
            </div>
            <span class="badge ${badgeClass}">${statusText}</span>
          </div>
          <p class="mb-1 small task-description">${task.descricao.length > 100 ? task.descricao.substring(0, 100) + '...' : task.descricao}</p>
          ${isLate ? '<small class="text-danger"><i class="bi bi-exclamation-circle"></i> Esta tarefa está atrasada</small>' : ''}
        </div>
      `;

      addTaskMarker(task);
    });

    html += `
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Completed tasks section
  if (completedTasks.length > 0) {
    html += `
      <div class="accordion" id="completed-tasks-accordion">
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#completed-tasks-collapse" aria-expanded="false">
              <i class="bi bi-chevron-down me-2 collapse-icon"></i> Tarefas Concluídas
            </button>
          </h2>
          <div id="completed-tasks-collapse" class="accordion-collapse collapse" data-bs-parent="#completed-tasks-accordion">
            <div class="accordion-body p-0">
              <div class="mb-2">
                <select class="form-select form-select-sm" id="completed-date-filter">
                  <option value="">Todas as datas</option>
                  ${getUniqueDates(completedTasks).map(date => `<option value="${date}">${formatDate(date)}</option>`).join('')}
                </select>
              </div>
              <div id="completed-tasks-container">
    `;

    completedTasks.forEach(task => {
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

      addTaskMarker(task, true);
    });

    html += `
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  if (!html) {
    taskList.innerHTML = `
      <div class="text-center py-4 text-muted">
        <p>Nenhuma tarefa para exibir</p>
      </div>
    `;
    return;
  }

  taskList.innerHTML = html;

  // Adicionar event listeners
  document.querySelectorAll('.task-item').forEach(item => {
    item.addEventListener('click', function() {
      const taskId = this.getAttribute('data-id');
      showTaskDetails(taskId);
    });
  });

  const dateFilter = document.getElementById('completed-date-filter');
  if (dateFilter) {
    dateFilter.addEventListener('change', function() {
      filterCompletedTasks(this.value);
    });
  }

  document.querySelectorAll('.accordion-button').forEach(button => {
    button.addEventListener('click', function() {
      const icon = this.querySelector('.collapse-icon');
      if (icon) {
        icon.style.transform = this.classList.contains('collapsed') 
          ? 'rotate(0deg)' 
          : 'rotate(180deg)';
      }
    });
  });
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
  } else if (task.status === 'cancelada') {
    iconColor = 'black';
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
  marker.on('popupopen', function () {
    const viewBtn = document.querySelector(`.view-task-btn[data-id="${task.id}"]`);
    if (viewBtn) {
      viewBtn.addEventListener('click', function () {
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
  const idSelect =  {id: taskId};
    // Fazer requisição à API para obter os detalhes da tarefa
  fetch("https://localhost/EBEN/api/showtaskid.php", {
    method: 'POST',
    headers: {
        'Content-Type':'application/json'
        },
        body: JSON.stringify(idSelect)
  })
    .then(response => response.json())
    .then(task => {
      if (!task) {
        console.error('Tarefa não encontrada');
        return;
      }

      // Set current task
      currentTask = task;

      // Format date for display (DD/MM/YYYY)
      const dateParts = task.data_tarefa.split('-');
      const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;

      // Update modal content
      const detailContent = document.getElementById('task-detail-content');
      const modalFooter = document.querySelector('#taskDetailModal .modal-footer');

      let statusBadge = '';
      switch (task.status) {
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
        case 'cancelada':
          statusBadge = '<span class="badge bg-dark">Cancelada</span>';
          break;
      }

      detailContent.innerHTML = `
        <h5>${task.empresa}</h5>
        <p><strong>Responsável no local:</strong> ${task.responsavel || 'Não informado'}</p>
        <p><strong>Data:</strong> ${formattedDate} às ${task.hora_tarefa}</p>
        <p><strong>Status:</strong> ${statusBadge}</p>
        <p><strong>Descrição:</strong></p>
        <div class="border p-2 bg-light mb-3">${task.descricao}</div>
      `;

      // Add report information if available
      // NOTA: Se sua API retorna relatório, adicione aqui
      // Nova seção de relatório
let reportHtml = '';

// Verificar se temos dados de relatório para exibir
if (task.transitTime || task.workTime || task.pauseTime || task.returnTransitTime || task.observations || task.completionObservations || task.finalObservations) {
  reportHtml = '<h6>Relatório de Atividade:</h6><div class="border p-2 bg-light mb-3">';

  if (task.transitTime) {
    reportHtml += `<p><small><strong>Tempo de Translado (Ida):</strong> ${task.transitTime}</small></p>`;
  }

  if (task.workTime) {
    reportHtml += `<p><small><strong>Tempo de Trabalho:</strong> ${task.workTime}</small></p>`;
  }

  if (task.pauseTime) {
    reportHtml += `<p><small><strong>Tempo em Pausa:</strong> ${task.pauseTime}</small></p>`;
  }

  if (task.returnTransitTime) {
    reportHtml += `<p><small><strong>Tempo de Translado (Volta):</strong> ${task.returnTransitTime}</small></p>`;
  }

  if (task.observations) {
    reportHtml += `<p><small><strong>Observações:</strong> ${task.observations}</small></p>`;
  }

  if (task.completionObservations) {
    reportHtml += `<p><small><strong>Observações de Conclusão:</strong> ${task.completionObservations}</small></p>`;
  }

  if (task.finalObservations) {
    reportHtml += `<p><small><strong>Observações Finais:</strong> ${task.finalObservations}</small></p>`;
  }

  reportHtml += '</div>';
  detailContent.innerHTML += reportHtml;
}

      // Clear existing buttons
      modalFooter.innerHTML = '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>';

      // FLUXO DE BOTÕES
      if (task.status === 'pendente') {
        modalFooter.innerHTML += `
          <button type="button" class="btn btn-primary" id="start-transit-btn">
            <i class="bi bi-truck"></i> Iniciar Translado
          </button>
        `;
        setTimeout(() => {
          document.getElementById('start-transit-btn').addEventListener('click', startTransit);
        }, 100);
      }
      else if (task.status === 'em_translado') {
        modalFooter.innerHTML += `
          <button type="button" class="btn btn-primary" id="end-transit-btn">
            <i class="bi bi-check2-circle"></i> Terminar Translado
          </button>
        `;
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
            <i class="bi bi-check2-circle"></i> Terminar Atendimento
          </button>
        `;
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
        setTimeout(() => {
          document.getElementById('resume-task-btn').addEventListener('click', resumeTask);
        }, 100);
      }
      else if (task.status === 'aguardando_retorno') {
        modalFooter.innerHTML += `
          <button type="button" class="btn btn-primary" id="start-return-btn">
            <i class="bi bi-truck"></i> Iniciar Translado de Volta
          </button>
        `;
        setTimeout(() => {
          document.getElementById('start-return-btn').addEventListener('click', startReturnTransit);
        }, 100);
      }
      else if (task.status === 'retornando') {
        modalFooter.innerHTML += `
          <button type="button" class="btn btn-primary" id="end-return-btn">
            <i class="bi bi-check2-circle"></i> Terminar Translado de Volta
          </button>
        `;
        setTimeout(() => {
          const endReturnBtn = document.getElementById('end-return-btn');
          if (endReturnBtn) {
            endReturnBtn.addEventListener('click', endReturnTransit);
          }
        }, 100);
      }
      else if (task.status === 'finalizado') {
        modalFooter.innerHTML += `
          <button type="button" class="btn btn-success" id="finalize-task-btn">
            <i class="bi bi-check2-all"></i> Concluir Tarefa
          </button>
        `;
        setTimeout(() => {
          document.getElementById('finalize-task-btn').addEventListener('click', finalizeTask);
        }, 100);
      }

      // Adicionar botão de cancelamento
      if (['pendente', 'em_translado', 'aguardando_inicio', 'em_andamento', 'pausada'].includes(task.status)) {
        modalFooter.innerHTML += `
          <button type="button" class="btn btn-danger" id="cancel-task-btn">
            <i class="bi bi-x-circle"></i> Cancelar Tarefa
          </button>
        `;

        setTimeout(() => {
          document.getElementById('cancel-task-btn').addEventListener('click', function () {
            currentCancellationTask = task;
            document.getElementById('cancel-reason').value = '';
            document.getElementById('photo-preview').innerHTML = '';

            const cancelModal = new bootstrap.Modal(document.getElementById('cancelTaskModal'));

            const cancelModalEl = document.getElementById('cancelTaskModal');
            const handler = function () {
              startCamera();
              cancelModalEl.removeEventListener('shown.bs.modal', handler);
            };

            cancelModalEl.addEventListener('shown.bs.modal', handler);
            cancelModal.show();
          });
        }, 100);
      }
    })
    .catch(error => {
      console.error('Erro ao carregar detalhes da tarefa:', error);
    });
}

// Start transit function
function getLocalISOString() {
  const now = new Date();
  const tzo = -now.getTimezoneOffset();
  const pad = (num) => (num < 10 ? '0' : '') + num;
  
  return now.getFullYear() + '-' +
    pad(now.getMonth() + 1) + '-' +
    pad(now.getDate()) + ' ' +
    pad(now.getHours()) + ':' +
    pad(now.getMinutes()) + ':' +
    pad(now.getSeconds());
}

// Função startTransit atualizada
function startTransit() {
  if (!currentTask) return;

  if (!currentCoordinates) {
    alert('Não foi possível obter sua localização atual. Por favor, verifique as permissões de localização.');
    return;
  }

  // Usar função para obter data/hora local correta
  const startTime = getLocalISOString();

  const updateData = {
    taskId: currentTask.id,
    newStatus: 'em_translado',
    transitStartLocation: currentCoordinates,
    startTime: startTime
  };

  // Enviar atualização para o servidor
  fetch("https://localhost/EBEN/api/updateTaskStatus.php", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
  })
  .then(response => response.json())
  .then(result => {
    if (result.success) {
      // Atualizar localmente a tarefa atual
      currentTask.status = 'em_translado';
      
      // Fechar modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('taskDetailModal'));
      if (modal) modal.hide();

      // Atualizar lista de tarefas
      loadTaskList();

      alert('Translado iniciado com sucesso!');
    } else {
      alert('Erro ao iniciar translado: ' + (result.message || 'Erro desconhecido'));
    }
  })
  .catch(error => {
    console.error('Erro ao iniciar translado:', error);
    alert('Erro ao iniciar translado. Tente novamente.');
  });
}

// Função endTransit atualizada
function endTransit() {
  if (!currentTask) {
    alert('Nenhuma tarefa ativa encontrada.');
    return;
  }

  if (!currentCoordinates) {
    alert('Não foi possível obter sua localização atual. Por favor, verifique as permissões de localização.');
    return;
  }

  if (currentTask.status !== 'em_translado') {
    alert('A tarefa não está no status de "em translado".');
    return;
  }

  // Usar função para obter data/hora local correta
  const endTime = getLocalISOString();

  const updateData = {
    taskId: currentTask.id,
    newStatus: 'aguardando_inicio',
    coordinates: currentCoordinates,
    endTime: endTime
  };
  
  // Enviar atualização para o servidor
  fetch("https://localhost/EBEN/api/updateTaskStatus.php", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
  })
  .then(response => response.json())
  .then(result => {
    if (result.success) {
      // Atualizar localmente a tarefa atual
      currentTask.status = 'aguardando_inicio';
      
      // Fechar modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('taskDetailModal'));
      if (modal) modal.hide();

      // Atualizar lista de tarefas
      loadTaskList();

      alert('Translado encerrado com sucesso!');
    } else {
      alert('Erro ao encerrar translado: ' + (result.message || 'Erro desconhecido'));
    }
  })
  .catch(error => {
    console.error('Erro ao encerrar translado:', error);
    alert('Erro ao encerrar translado. Tente novamente.');
  });
}

// Start task function
function startTask() {
  if (!currentTask) {
    alert('Nenhuma tarefa ativa encontrada.');
    return;
  }

  if (!currentCoordinates) {
    alert('Não foi possível obter sua localização atual. Por favor, verifique as permissões de localização.');
    return;
  }

  // Verificar se a tarefa está no status correto
  if (currentTask.status !== 'aguardando_inicio') {
    alert('A tarefa não está no status de "aguardando início".');
    return;
  }

  // Usar função para obter data/hora local correta
  const startTime = getLocalISOString();

  // Dados para enviar à API
  const updateData = {
    taskId: currentTask.id,
    newStatus: 'em_andamento',
    startTime: startTime,
    startLocation: currentCoordinates
  };

  // Enviar atualização para o servidor
  fetch("https://localhost/EBEN/api/updateTaskStatus.php", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
  })
  .then(response => response.json())
  .then(result => {
    if (result.success) {
      // Atualizar localmente a tarefa atual
      currentTask.status = 'em_andamento';
      
      // Fechar modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('taskDetailModal'));
      if (modal) modal.hide();

      // Atualizar lista de tarefas
      loadTaskList();

      // Mostrar mensagem de sucesso
      alert('Atendimento iniciado com sucesso!');
    } else {
      alert('Erro ao iniciar atendimento: ' + (result.message || 'Erro desconhecido'));
    }
  })
  .catch(error => {
    console.error('Erro ao iniciar atendimento:', error);
    alert('Erro ao iniciar atendimento. Tente novamente.');
  });
}

// Pause task function
function pauseTask() {
    if (!currentTask) {
    alert('Nenhuma tarefa ativa encontrada.');
    return;
  }

  if (!currentCoordinates) {
    alert('Não foi possível obter sua localização atual. Por favor, verifique as permissões de localização.');
    return;
  }

  // Solicitar motivo da pausa
  const reason = prompt('Por favor, informe o motivo da pausa:');
  
  if (reason === null) {
    return; // Usuário cancelou
  }

  // Obter data/hora local para o início da pausa
  const startedAt = getLocalISOString();

  // Dados para enviar à API
  const pauseData = {
    taskId: currentTask.id,
    startedAt: startedAt,
    location: currentCoordinates,
    reason: reason
  };

  // Enviar requisição para iniciar a pausa
  fetch("https://localhost/EBEN/api/pauseTask.php", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(pauseData)
  })
  .then(response => response.json())
  .then(result => {
    if (result.success) {
      // Atualizar localmente a tarefa atual
      currentTask.status = 'pausada';
      
      // Fechar modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('taskDetailModal'));
      if (modal) modal.hide();

      // Atualizar lista de tarefas
      loadTaskList();
  

      alert('Atendimento pausado com sucesso!');
    } else {
      alert('Erro ao pausar atendimento: ' + (result.message || 'Erro desconhecido'));
    }
  })
  .catch(error => {
    console.error('Erro ao pausar atendimento:', error);
    alert('Erro ao pausar atendimento. Tente novamente.');
  });
}

// Resume task function
function resumeTask() {
    if (!currentTask) {
    alert('Nenhuma tarefa ativa encontrada.');
    return;
  }

  if (!currentCoordinates) {
    alert('Não foi possível obter sua localização atual. Por favor, verifique as permissões de localização.');
    return;
  }

  // Obter data/hora local para o término da pausa
  const endedAt = getLocalISOString();

  // Dados para enviar à API
  const resumeData = {
    taskId: currentTask.id,
    endLocation: currentCoordinates,
    endedAt: endedAt
  };

  // Enviar requisição para terminar a pausa
  fetch("https://localhost/EBEN/api/resumeTask.php", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(resumeData)
  })
  .then(response => response.json())
  .then(result => {
    if (result.success) {
      // Atualizar localmente a tarefa atual
      currentTask.status = 'em_andamento';
      
      // Fechar modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('taskDetailModal'));
      if (modal) modal.hide();

  

      // Atualizar lista de tarefas
      loadTaskList();

      alert('Atendimento retomado com sucesso!');
    } else {
      alert('Erro ao retomar atendimento: ' + (result.message || 'Erro desconhecido'));
    }
  })
  .catch(error => {
    console.error('Erro ao retomar atendimento:', error);
    alert('Erro ao retomar atendimento. Tente novamente.');
  });
}

// Complete task function (agora chama o formulário)
function completeTask() {
  if (!currentTask) {
    alert('Nenhuma tarefa ativa encontrada.');
    return;
  }

  if (!currentCoordinates) {
    alert('Não foi possível obter sua localização atual. Por favor, verifique as permissões de localização.');
    return;
  }

  if (currentTask.status !== 'em_andamento') {
    alert('Esta etapa já foi concluída!');
    return;
  }

  // Verificar se a tarefa tem formulário
  fetch("https://localhost/EBEN/api/formdescription.php", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task_id: currentTask.id })
  })
    .then(response => response.json())
    .then(form => {
      if (form && form.perguntas && form.perguntas.length > 0) {
        // Existe formulário: mostrar o modal e bloquear execução até ser respondido
        showTaskFormModal(currentTask.id, form);
        
        
      } else {
        // Sem formulário: seguir fluxo normal
        finalizarTarefaSemFormulario();
      }
    })
    .catch(error => {
      console.error('Erro ao verificar formulário:', error);
      alert('Erro ao verificar se a tarefa possui formulário.');
    });
}
function finalizarTarefaSemFormulario() {
  const observations = prompt('Observações sobre o atendimento (opcional):') || '';
  const completedAt = getLocalISOString();

  const updateData = {
    taskId: currentTask.id,
    newStatus: 'aguardando_retorno',
    locationEndTask: currentCoordinates,
    completedAt: completedAt,
    observations: observations,
    completionObservations: observations
  };

  fetch("https://localhost/EBEN/api/updateTaskStatus.php", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData)
  })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        currentTask.status = 'aguardando_retorno';

        const modal = bootstrap.Modal.getInstance(document.getElementById('taskDetailModal'));
        if (modal) modal.hide();

        loadTaskList();
        console.log(currentTask);
      } else {
        alert('Erro ao concluir atendimento: ' + (result.message || 'Erro desconhecido'));
      }
    })
    .catch(error => {
      console.error('Erro ao concluir atendimento:', error);
      alert('Erro ao concluir atendimento. Tente novamente.');
    });
}



// Start return transit function
function startReturnTransit() {
  if (!currentTask) {
    alert('Nenhuma tarefa ativa encontrada.');
    return;
  }

  if (!currentCoordinates) {
    alert('Não foi possível obter sua localização atual. Por favor, verifique as permissões de localização.');
    return;
  }

  // Verificar status correto (deve estar em "aguardando_retorno")
  if (currentTask.status !== 'aguardando_retorno') {
    alert('A tarefa não está no status correto para iniciar o retorno.');
    return;
  }

  // Obter data/hora local para o início do retorno
  const startTime = getLocalISOString();

  // Dados para enviar à API
  const updateData = {
    taskId: currentTask.id,
    newStatus: 'retornando',
    startTime: startTime,
    returnStartLocation: currentCoordinates
  };

  // Enviar atualização para o servidor
  fetch("https://localhost/EBEN/api/updateTaskStatus.php", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
  })
  .then(response => response.json())
  .then(result => {
    if (result.success) {
      // Atualizar localmente a tarefa atual
      currentTask.status = 'retornando';
      
      // Fechar modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('taskDetailModal'));
      if (modal) modal.hide();

      // Atualizar lista de tarefas
      loadTaskList();

      alert('Retorno iniciado com sucesso!');
    } else {
      alert('Erro ao iniciar retorno: ' + (result.message || 'Erro desconhecido'));
    }
  })
  .catch(error => {
    console.error('Erro ao iniciar retorno:', error);
    alert('Erro ao iniciar retorno. Tente novamente.');
  });
}

// End return transit function (atualizado)
function endReturnTransit() {
  if (!currentTask) {
    alert('Nenhuma tarefa ativa encontrada.');
    return;
  }

  if (!currentCoordinates) {
    alert('Não foi possível obter sua localização atual. Por favor, verifique as permissões de localização.');
    return;
  }

  if (currentTask.status !== 'retornando') {
    alert('A tarefa não está no status de "retornando".');
    return;
  }

  // Obter data/hora local para o término do retorno
  const endTime = getLocalISOString();

  // Dados para enviar à API
  const updateData = {
    taskId: currentTask.id,
    newStatus: 'finalizado',
    endTime: endTime,
    returnEndLocation: currentCoordinates
  };

  // Enviar atualização para o servidor
  fetch("https://localhost/EBEN/api/updateTaskStatus.php", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
  })
  .then(response => response.json())
  .then(result => {
    if (result.success) {
      // Atualizar localmente a tarefa atual
      currentTask.status = 'finalizado';
      
      // Fechar modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('taskDetailModal'));
      if (modal) modal.hide();

      // Atualizar lista de tarefas
      loadTaskList();

      alert('Retorno finalizado com sucesso!');
    } else {
      alert('Erro ao finalizar retorno: ' + (result.message || 'Erro desconhecido'));
    }
  })
  .catch(error => {
    console.error('Erro ao finalizar retorno:', error);
    alert('Erro ao finalizar retorno. Tente novamente.');
  });
}

// Finalize task function
function finalizeTask() {
  if (!currentTask) {
    alert('Nenhuma tarefa selecionada');
    return;
  }

  if (currentTask.status !== 'finalizado') {
    alert('Só é possível concluir tarefas finalizadas');
    return;
  }

  // Coletar observações finais
  const observations = prompt('Observações finais (opcional):') || '';

  // Obter data/hora local para a finalização
  const finalizedAt = getLocalISOString();

  // Dados para enviar à API
  const updateData = {
    taskId: currentTask.id,
    newStatus: 'concluida',
    finalizedAt: finalizedAt,
    finalObservations: observations
  };

  // Enviar atualização para o servidor
  fetch("https://localhost/EBEN/api/updateTaskStatus.php", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
  })
  .then(response => response.json())
  .then(result => {
    if (result.success) {
      // Atualizar localmente a tarefa atual
      currentTask.status = 'concluida';
      
      // Fechar modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('taskDetailModal'));
      if (modal) modal.hide();

      // Atualizar lista de tarefas
      loadTaskList();

      alert('Tarefa concluída com sucesso!');
    } else {
      alert('Erro ao concluir tarefa: ' + (result.message || 'Erro desconhecido'));
    }
  })
  .catch(error => {
    console.error('Erro ao concluir tarefa:', error);
    alert('Erro ao concluir tarefa. Tente novamente.');
  });
}

// Funções para cancelamento de tarefas
async function startCamera() {
  try {
    const video = document.getElementById('camera-preview');
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' } // Preferir câmera traseira
    });
    video.srcObject = cameraStream;
  } catch (error) {
    console.error('Erro ao acessar a câmera:', error);
    alert('Não foi possível acessar a câmera. Verifique as permissões.');
  }
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
}

function capturePhoto() {
  const video = document.getElementById('camera-preview');
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  return canvas.toDataURL('image/jpeg');
}

  function cancelTask() {
    const reason = document.getElementById('cancel-reason').value;
    if (!reason) {
        alert('Por favor, informe o motivo do cancelamento.');
        return;
    }

    const photoData = capturePhoto(); // Base64 da foto
    stopCamera();

    const endTime = getLocalISOString();

  // Dados para enviar à API
    const updateData = {
    taskId: currentTask.id,
    newStatus: 'cancelada',
    endTime: endTime,
    coordinates: currentCoordinates,
    Reason: reason,
    photo: photoData
  };


    fetch("https://localhost/EBEN/api/cancel_task.php", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
    })
    .then(res => res.json())
    .then(data => {
        console.log(data)
        if (data.success) {
            // Fecha modais
            const cancelModal = bootstrap.Modal.getInstance(document.getElementById('cancelTaskModal'));
            if (cancelModal) cancelModal.hide();
            const taskModal = bootstrap.Modal.getInstance(document.getElementById('taskDetailModal'));
            if (taskModal) taskModal.hide();

            loadTaskList();
            
        } else {
            alert("Erro: " + data.message);
        }
    })
    .catch(err => console.error(err));
}

  

function showTaskFormModal(taskId, form) {
    console.log('Opening form modal for task:', taskId);
  /*
        .then(response => response.text()) // <- Use .text() temporariamente
        .then(text => {
        console.log('Resposta bruta:', text);
          const form = JSON.parse(text);
    */    
      if (!form || !form.perguntas) {
        throw new Error('Formulário inválido ou vazio');
      }

      // Gerar HTML do modal
      const modalHtml = `
        <div class="modal fade" id="taskFormModal" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header bg-success text-white">
                <h5 class="modal-title">Formulário: ${form.titulo_formulario}</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <div class="alert alert-info">
                  <strong>Atenção:</strong> Este formulário deve ser preenchido antes de finalizar a tarefa.
                </div>
                ${form.descricao_formulario ? `<p class="text-muted">${form.descricao_formulario}</p>` : ''}
                <form id="taskFormAnswers">
                  ${generateFormQuestions(form.perguntas)}
                  <div class="d-grid mt-4">
                    <button type="submit" class="btn btn-success">Finalizar Tarefa</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      `;

      // Remover modal existente e adicionar novo
      const existingModal = document.getElementById('taskFormModal');
      if (existingModal) existingModal.remove();
      document.body.insertAdjacentHTML('beforeend', modalHtml);

      const modal = new bootstrap.Modal(document.getElementById('taskFormModal'));
      modal.show();

      // Submissão
      document.getElementById('taskFormAnswers').addEventListener('submit', function (e) {
        e.preventDefault();
        saveTaskFormAnswers(taskId, form, modal);
      });
    
}
function generateFormQuestions(questions) {
    return questions.map(question => {
    let html = `<div class="mb-3">`;
    html += `<label class="form-label">${question.texto} ${question.obrigatoria ? '<span class="text-danger">*</span>' : ''}</label>`;

    const fieldName = `question_${question.id_pergunta}`;

    switch (question.tipo) {
      case 'text':
        html += `<input type="text" class="form-control" name="${fieldName}" ${question.obrigatoria ? 'required' : ''}>`;
        break;
      case 'textarea':
        html += `<textarea class="form-control" name="${fieldName}" rows="3" ${question.obrigatoria ? 'required' : ''}></textarea>`;
        break;
      case 'checkbox':
        question.alternativas.forEach((alt, index) => {
          html += `
            <div class="form-check">
              <input class="form-check-input" type="checkbox" name="${fieldName}" value="${alt.texto_alternative}" id="${fieldName}_${index}">
              <label class="form-check-label" for="${fieldName}_${index}">${alt.texto_alternative}</label>
            </div>
          `;
        });
        break;
      case 'radio':
        question.alternativas.forEach((alt, index) => {
          html += `
            <div class="form-check">
              <input class="form-check-input" type="radio" name="${fieldName}" value="${alt.texto_alternative}" id="${fieldName}_${index}" ${question.obrigatoria ? 'required' : ''}>
              <label class="form-check-label" for="${fieldName}_${index}">${alt.texto_alternative}</label>
            </div>
          `;
        });
        break;
    }

    html += `</div>`;
    return html;
  }).join('');
}
function saveTaskFormAnswers(taskId, form, modal) {
  
  console.log('Saving task form answers for task:', taskId);

  const formData = new FormData(document.getElementById('taskFormAnswers'));
  const answers = [];
  let validationError = false;

  form.perguntas.forEach(question => {
    const fieldName = `question_${question.id_pergunta}`;
    let answer = null;

    switch (question.tipo) {
      case 'text':
      case 'textarea':
      case 'radio':
        answer = formData.get(fieldName);
        break;
      case 'checkbox':
        const checkboxValues = formData.getAll(fieldName);
        answer = checkboxValues.length > 0 ? checkboxValues : null;
        break;
    }

    if (question.obrigatoria === '1') {
      if (!answer || (Array.isArray(answer) && answer.length === 0)) {
        alert(`Por favor, responda a pergunta obrigatória: ${question.texto}`);
        validationError = true;
        return;
      }
    }
    


    answers.push({
      questionId: question.id_pergunta,
      questionText: question.texto,
      questionType: question.tipo,
      answer: answer
    });
  });

  console.log(answers)

  if (validationError) return;
  const response = getLocalISOString();

  const payload = {
    taskId: taskId,
    response: response,
    formResponse: {
      formId: form.id_formulario,
      formName: form.titulo_formulario,
      answers: answers
    }
  };

  fetch("https://localhost/EBEN/api/salvar-respostas-e-atualizar-tarefa.php", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  /*
  .then(response => response.text()) // <- Use .text() temporariamente
  .then(text => {
  console.log('Resposta bruta:', text);
  const form = JSON.parse(text); 
  */
  
  .then(response => response.json())
  .then(result => {
    if (result.success) {
      // ⭐ 1. Verifique se modal existe antes de usar!
      if (modal && typeof modal.hide === 'function') {
        modal.hide();
      }
      
      document.getElementById('taskFormModal')?.remove();
      
      const taskDetailModal = bootstrap.Modal.getInstance(
        document.getElementById('taskDetailModal')
      );
      taskDetailModal?.hide();
      
      showToast('Tarefa concluída com sucesso!', 'success');
    } else {
      // ⭐ 2. Não tente acessar result.message se ele puder conter referências problemáticas
      console.error('Erro no servidor:', result.error || 'Mensagem de erro não disponível');
      showToast('Erro ao salvar respostas.', 'danger');
    }
  })
  .catch(error => {
    console.error('Erro na requisição:', error);
    showToast('Erro ao salvar os dados da tarefa.', 'danger');
  });
  const observations = prompt('Observações sobre o atendimento (opcional):') || '';
  const completedAt = getLocalISOString();

  const updateData = {
    taskId: currentTask.id,
    newStatus: 'aguardando_retorno',
    locationEndTask: currentCoordinates,
    completedAt: completedAt,
    observations: observations,
    completionObservations: observations
  };

  fetch("https://localhost/EBEN/api/updateTaskStatus.php", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData)
  })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        currentTask.status = 'aguardando_retorno';

        const modal = bootstrap.Modal.getInstance(document.getElementById('taskDetailModal'));
        if (modal) modal.hide();

        loadTaskList();
        console.log(currentTask);
      } else {
        alert('Erro ao concluir atendimento: ' + (result.message || 'Erro desconhecido'));
      }
    })
    .catch(error => {
      console.error('Erro ao concluir atendimento:', error);
      alert('Erro ao concluir atendimento. Tente novamente.');
    });
}