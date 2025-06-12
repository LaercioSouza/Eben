// Integrate with data service
document.addEventListener('DOMContentLoaded', function() {
  // Initialize data from the data service
  initApp();
});

// Initialize the application
function initApp() {
  // Load tasks
  loadTasks();
  
  // Add event listeners
  document.getElementById('date-filter').addEventListener('change', loadTasks);
  document.getElementById('status-filter').addEventListener('change', loadTasks);
  document.getElementById('reset-filters').addEventListener('click', resetFilters);
}

// Load tasks from data service
function loadTasks() {
  const tasksTableBody = document.getElementById('tasks-table-body');
  const noTasksMessage = document.getElementById('no-tasks-message');
   fetch("https://localhost/EBEN/api/tasklist.php")
  .then(response => response.json())
  .then(task_json => {
    // Aqui você pode trabalhar com os dados retornados
    //console.log(task_json);
    tasks = applyFilters(task_json);
    if (tasks.length === 0) {
    tasksTableBody.innerHTML = '';
    noTasksMessage.classList.remove('d-none');
    return;
    }
    noTasksMessage.classList.add('d-none');

    task_json.forEach(task => {
    tasksTableBody.innerHTML = task_json.map(task => {
    const [year, month, day] = task.data_tarefa.split('-');
    const formattedDate = `${day}/${month}/${year}`;
    
    const statusClass = getStatusClass(task.status);
    
    
    return `
      <tr class="task-row" onclick="showTaskDetail(${task.id})">
        <td>${task.empresa}</td>
        <td>${task.colaborador}</td>
        <td>${formattedDate}</td>
        <td>${task.hora_tarefa}</td>
        <td><span class="status-badge status-${statusClass}">${getStatusText(task.status)}</span></td>
      </tr>
    `;
  }).join('');


    }) 

    
    


  })
  .catch(error => {
    console.error('Erro ao carregar empresas:', error);
  });


  /*
  
  // Get tasks from data service
  let tasks = window.dataService.getAll(window.dataService.DATA_TYPES.TASKS);
  
  // Apply filters
  tasks = applyFilters(tasks);
  
  if (tasks.length === 0) {
    tasksTableBody.innerHTML = '';
    noTasksMessage.classList.remove('d-none');
    return;
  }
  
  noTasksMessage.classList.add('d-none');
  
  // Populate table
  tasksTableBody.innerHTML = tasks.map(task => {
    const taskDate = new Date(task.data);
    const formattedDate = taskDate.toLocaleDateString('pt-BR');
    const statusClass = getStatusClass(task.status);
    
    return `
      <tr class="task-row" onclick="showTaskDetail(${task.id})">
        <td>${task.empresaNome}</td>
        <td>${task.colaboradorNome}</td>
        <td>${formattedDate}</td>
        <td>${task.hora}</td>
        <td><span class="status-badge status-${statusClass}">${getStatusText(task.status)}</span></td>
      </tr>
    `;
  }).join('');
  */
}


// Apply filters to tasks
function applyFilters(tasks) {
  
 const dateFilter = document.getElementById('date-filter').value;
  const statusFilter = document.getElementById('status-filter').value;
  


  let filteredTasks = tasks;
  

  // Filtrar por data da tarefa (campo data_tarefa)
  if (dateFilter) {
    filteredTasks = filteredTasks.filter(task => task.data_tarefa === dateFilter);
    
    
  }

  // Filtrar por status (campo status)
  if (statusFilter !== 'all') {
    filteredTasks = filteredTasks.filter(task => task.status === statusFilter);
  }
  //console.log(filteredTasks);
  return filteredTasks;
}

// Reset filters
function resetFilters() {
  document.getElementById('date-filter').value = '';
  document.getElementById('status-filter').value = 'all';
  loadTasks();
}

// Get status class
function getStatusClass(status) {
  switch (status) {
    case 'pendente':
      return 'pending';
    case 'em_translado':
      return 'warning';
    case 'em_andamento':
      return 'progress';
    case 'pausada':
      return 'paused';
    case 'aguardando_retorno':
      return 'warning';
    case 'retornando':
      return 'warning';
    case 'finalizado':
      return 'warning';
    case 'concluida':
      return 'completed';
    default:
      return 'pending';
  }
}

// Get status text
function getStatusText(status) {
  switch (status) {
    case 'pendente':
      return 'Pendente';
    case 'em_translado':
      return 'Em Translado';
    case 'em_andamento':
      return 'Em Andamento';
    case 'pausada':
      return 'Pausada';
    case 'aguardando_retorno':
      return 'Aguardando Retorno';
    case 'retornando':
      return 'Retornando';
     case 'finalizado':
      return 'Finalizado';
    case 'concluida':
      return 'Concluída';
    default:
      return 'Pendente';
  }
}

// Initialize detail map with Leaflet
function initDetailMap(coordinates) {
  // Remove existing map if any
  const mapContainer = document.getElementById('detail-map');
  if (mapContainer._leaflet_id) {
    mapContainer._leaflet_id = null;
  }
  
  // Coordenadas de Parnaíba, PI
  let initialLat = -2.9055;
  let initialLng = -41.7734;
  
  // Check if coordinates are valid
  if (coordinates) {
    const coords = coordinates.split(',');
    initialLng = parseFloat(coords[0]);
    initialLat = parseFloat(coords[1]);
  }
  
  // Create the map
  detailMap = L.map('detail-map').setView([initialLat, initialLng], 15);
  
  // Add tile layer from OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(detailMap);
  
  // Add a marker to the map
  L.marker([initialLat, initialLng]).addTo(detailMap);
  
  // Force map resize after modal is shown
  setTimeout(() => {
    detailMap.invalidateSize();
  }, 300);
}

function showTaskDetail(taskId) {
  const payload = { id: taskId };  
 
  fetch("https://localhost/EBEN/api/showdetailstask.php", {
         method: 'POST',
         headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
})
       .then(response => response.json())
       .then(data => {
        
        
  const task = data;
  let timeComparison = '';
 
  /*
  const task = window.dataService.getById(window.dataService.DATA_TYPES.TASKS, taskId);
  if (!task) return;
  
  const companies = window.dataService.getAll(window.dataService.DATA_TYPES.COMPANIES);
  const employees = window.dataService.getAll(window.dataService.DATA_TYPES.EMPLOYEES);
  
  const company = companies.find(c => c.id === task.empresaId);
  const employee = employees.find(e => e.id === task.colaboradorId);
  
  // Calculate time comparison if task is completed and has suggested time
  let timeComparison = '';
  let efficiency = null;
  if (task.status === 'concluida' && task.tempoSugerido && task.report?.workTime) {
    const suggestedHours = task.tempoSugerido;
    const workTimeParts = task.report.workTime.split(':');
    const actualHours = parseInt(workTimeParts[0]) + parseInt(workTimeParts[1])/60 + parseInt(workTimeParts[2])/3600;
    
    const difference = actualHours - suggestedHours;
    const isOverTime = difference > 0;
    const diffText = Math.abs(difference).toFixed(1);
    
    efficiency = Math.round((suggestedHours / actualHours) * 100);
    
    timeComparison = `
      <div class="alert ${isOverTime ? 'alert-warning' : 'alert-success'} mt-2">
        <strong>Análise de Tempo:</strong><br>
        Tempo Sugerido: ${suggestedHours}h<br>
        Tempo Executado: ${actualHours.toFixed(1)}h<br>
        Eficiência: ${efficiency}%<br>
        ${isOverTime ? `Excedeu em ${diffText}h` : `Concluído ${diffText}h antes do previsto`}
      </div>
    `;
  }
    */
  
  const content = `
    <div class="mb-3">
      <h6>Informações Básicas</h6>
      <p><strong>Empresa:</strong> ${task.empresa}</p>
      <p><strong>Técnico:</strong> ${task ? task.colaborador : 'N/A'}</p>
      ${task.responsavel ? `<p><strong>Responsável no Local:</strong> ${task.responsavel}</p>` : ''}
      <p><strong>Data:</strong> ${task.data_tarefa}</p>
      <p><strong>Hora:</strong> ${task.hora_tarefa}</p>
      ${task.tempo_sugerido ? `<p><strong>Tempo Sugerido:</strong> ${task.tempo_sugerido}h</p>` : ''}
      <p><strong>Status:</strong> <span class="status-badge status-${getStatusClass(task.status)}">${getStatusText(task.status)}</span></p>
      <p><strong>Descrição:</strong> ${task.descricao}</p>
      ${task.formulario_id ? `<p><strong>Formulário:</strong> ${task.formulario_id}</p>` : ''}
      ${timeComparison}
    </div>
    
    ${task.status === 'concluida' ? `
    <div class="mb-4">
      <h6>Análise de Performance</h6>
      <div class="row">
        <div class="col-md-6">
          <canvas id="efficiencyChart" width="200" height="200"></canvas>
        </div>
        <div class="col-md-6">
          <canvas id="timeChart" width="200" height="150"></canvas>
        </div>
      </div>
    </div>
    ` : ''}
  `;
  
  document.getElementById('task-detail-content').innerHTML = content;
  
  // Load task history
  loadTaskHistory(task);
  
  // Show form responses if available
  showFormResponses(task);
  
  // Initialize detail map
  initDetailMap(task.coordinates);
  
  // Show modal
  const modal = new bootstrap.Modal(document.getElementById('taskDetailModal'));
  modal.show();
  
  // Initialize charts if task is completed
  if (task.status === 'concluida' && efficiency !== null) {
    setTimeout(() => {
      initPerformanceCharts(task, efficiency);
    }, 300);
  }
  
  // Set up delete button
  document.getElementById('btn-delete-task').onclick = () => deleteTask(taskId);
  
  // Set up individual PDF export button
  document.getElementById('btn-export-individual-pdf').onclick = () => exportIndividualTaskToPDF(taskId);
  
  // Set up collapsible history
  setupCollapsibleHistory();
  
  }).catch(error => {
    console.error('Erro na consulta:', error);
});
}

function initPerformanceCharts(task, efficiency) {
  // Efficiency Chart (Donut)
  const efficiencyCtx = document.getElementById('efficiencyChart');
  if (efficiencyCtx) {
    new Chart(efficiencyCtx, {
      type: 'doughnut',
      data: {
        labels: ['Eficiência', 'Desperdício'],
        datasets: [{
          data: [efficiency, Math.max(0, 100 - efficiency)],
          backgroundColor: ['#198754', '#dc3545'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Eficiência da Tarefa'
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }
  
  // Time Chart (Bar)
  const timeCtx = document.getElementById('timeChart');
  if (timeCtx && task.tempoSugerido && task.report?.workTime) {
    const workTimeParts = task.report.workTime.split(':');
    const actualHours = parseInt(workTimeParts[0]) + parseInt(workTimeParts[1])/60;
    
    new Chart(timeCtx, {
      type: 'bar',
      data: {
        labels: ['Tempo Sugerido', 'Tempo Real'],
        datasets: [{
          label: 'Horas',
          data: [task.tempoSugerido, actualHours],
          backgroundColor: ['#0d6efd', '#198754']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Comparação de Tempo'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Horas'
            }
          }
        }
      }
    });
  }
}

function setupCollapsibleHistory() {
  const historyToggle = document.getElementById('historyToggle');
  const historyContent = document.getElementById('historyContent');
  const historyIcon = document.getElementById('historyIcon');
  
  historyToggle.addEventListener('click', function() {
    const isVisible = historyContent.classList.contains('show');
    
    if (isVisible) {
      historyContent.classList.remove('show');
      historyIcon.classList.remove('bi-chevron-up');
      historyIcon.classList.add('bi-chevron-down');
    } else {
      historyContent.classList.add('show');
      historyIcon.classList.remove('bi-chevron-down');
      historyIcon.classList.add('bi-chevron-up');
    }
  });
}

function loadTaskHistory(task) {
  const historyList = document.getElementById('task-history-list');
  
  if (!task.history || task.history.length === 0) {
    historyList.innerHTML = '<p class="text-muted">Nenhum histórico disponível</p>';
    return;
  }
  
  const historyHtml = task.history.map((entry, index) => {
    const date = new Date(entry.timestamp);
    const formattedDate = date.toLocaleDateString('pt-BR');
    const formattedTime = date.toLocaleTimeString('pt-BR');
    
    const coords = entry.coordinates ? entry.coordinates.split(',') : null;
    const locationInfo = coords ? `Lat: ${parseFloat(coords[1]).toFixed(6)}, Lng: ${parseFloat(coords[0]).toFixed(6)}` : 'Localização não disponível';
    
    return `
      <div class="border-start border-primary ps-3 mb-3">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <div class="fw-bold">${getActionText(entry.action)}</div>
            <small class="text-muted">${formattedDate} às ${formattedTime}</small>
            <br><small class="text-info">${locationInfo}</small>
            ${entry.observations ? `<br><small class="text-secondary"><strong>Observações:</strong> ${entry.observations}</small>` : ''}
            ${entry.reason ? `<br><small class="text-warning"><strong>Motivo:</strong> ${entry.reason}</small>` : ''}
          </div>
          ${coords ? `<button class="btn btn-sm btn-outline-primary" onclick="showLocationOnMap('${coords[1]}', '${coords[0]}', '${getActionText(entry.action)}')">Ver no Mapa</button>` : ''}
        </div>
      </div>
    `;
  }).join('');
  
  historyList.innerHTML = historyHtml;
}

function showFormResponses(task) {
  const formResponsesSection = document.getElementById('form-responses-section');
  const formResponsesContent = document.getElementById('form-responses-content');
  
  if (!task.formularioResposta || !task.formularioResposta.answers) {
    formResponsesSection.style.display = 'none';
    return;
  }
  
  formResponsesSection.style.display = 'block';
  
  const responsesHtml = task.formularioResposta.answers.map(answer => {
    let answerText = answer.answer;
    if (Array.isArray(answerText)) {
      answerText = answerText.join(', ');
    }
    
    return `
      <div class="mb-2">
        <strong>${answer.questionText}:</strong><br>
        <span class="text-muted">${answerText || 'Não respondido'}</span>
      </div>
    `;
  }).join('');
  
  formResponsesContent.innerHTML = responsesHtml;
}

function showLocationOnMap(lat, lng, title) {
  // Create a new modal with map for location
  const modalHtml = `
    <div class="modal fade" id="locationModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">${title} - Localização</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div id="location-map" style="height: 400px;"></div>
            <div class="mt-2">
              <small class="text-muted">Coordenadas: ${lat}, ${lng}</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Remove existing modal if any
  const existingModal = document.getElementById('locationModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Add modal to page
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // Show modal
  const modal = new bootstrap.Modal(document.getElementById('locationModal'));
  modal.show();
  
  // Initialize map
  setTimeout(() => {
    const locationMap = L.map('location-map').setView([parseFloat(lat), parseFloat(lng)], 16);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(locationMap);
    
    L.marker([parseFloat(lat), parseFloat(lng)]).addTo(locationMap)
      .bindPopup(title)
      .openPopup();
  }, 300);
}

async function exportIndividualTaskToPDF(taskId) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  const task = window.dataService.getById(window.dataService.DATA_TYPES.TASKS, taskId);
  if (!task) return;
  
  const companies = window.dataService.getAll(window.dataService.DATA_TYPES.COMPANIES);
  const employees = window.dataService.getAll(window.dataService.DATA_TYPES.EMPLOYEES);
  
  const company = companies.find(c => c.id === task.empresaId);
  const employee = employees.find(e => e.id === task.colaboradorId);
  
  // Header
  doc.setFontSize(18);
  doc.text('RELATÓRIO INDIVIDUAL DE TAREFA', 20, 20);
  
  doc.setFontSize(12);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, 30);
  
  // Basic Information
  let yPos = 45;
  doc.setFontSize(14);
  doc.text('INFORMAÇÕES BÁSICAS', 20, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.text(`Empresa: ${task.empresaNome}`, 20, yPos);
  yPos += 5;
  doc.text(`Técnico: ${employee ? employee.nome : 'N/A'}`, 20, yPos);
  yPos += 5;
  if (task.responsavel) {
    doc.text(`Responsável no Local: ${task.responsavel}`, 20, yPos);
    yPos += 5;
  }
  doc.text(`Data: ${task.data} - ${task.hora}`, 20, yPos);
  yPos += 5;
  doc.text(`Status: ${getStatusText(task.status)}`, 20, yPos);
  yPos += 5;
  if (task.tempoSugerido) {
    doc.text(`Tempo Sugerido: ${task.tempoSugerido}h`, 20, yPos);
    yPos += 5;
  }
  doc.text(`Descrição: ${task.descricao}`, 20, yPos);
  yPos += 15;
  
  // Performance Analysis (if completed)
  if (task.status === 'concluida' && task.tempoSugerido && task.report?.workTime) {
    const workTimeParts = task.report.workTime.split(':');
    const actualHours = parseInt(workTimeParts[0]) + parseInt(workTimeParts[1])/60 + parseInt(workTimeParts[2])/3600;
    const efficiency = Math.round((task.tempoSugerido / actualHours) * 100);
    
    doc.setFontSize(14);
    doc.text('ANÁLISE DE PERFORMANCE', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.text(`Tempo Sugerido: ${task.tempoSugerido}h`, 20, yPos);
    yPos += 5;
    doc.text(`Tempo Executado: ${actualHours.toFixed(2)}h`, 20, yPos);
    yPos += 5;
    doc.text(`Eficiência: ${efficiency}%`, 20, yPos);
    yPos += 5;
    
    const difference = actualHours - task.tempoSugerido;
    const isOverTime = difference > 0;
    doc.text(`Diferença: ${isOverTime ? '+' : ''}${difference.toFixed(2)}h`, 20, yPos);
    yPos += 15;
  }
  
  // History with observations and pause reasons
  if (task.history && task.history.length > 0) {
    doc.setFontSize(14);
    doc.text('HISTÓRICO DE MOVIMENTOS', 20, yPos);
    yPos += 10;
    
    for (let i = 0; i < task.history.length; i++) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      const entry = task.history[i];
      const date = new Date(entry.timestamp);
      const formattedDateTime = `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR')}`;
      
      doc.setFontSize(10);
      doc.text(`${i + 1}. ${getActionText(entry.action)}`, 20, yPos);
      yPos += 5;
      doc.text(`   Data/Hora: ${formattedDateTime}`, 25, yPos);
      yPos += 5;
      
      if (entry.coordinates) {
        const coords = entry.coordinates.split(',');
        doc.text(`   Coordenadas: Lat ${parseFloat(coords[1]).toFixed(6)}, Lng ${parseFloat(coords[0]).toFixed(6)}`, 25, yPos);
        yPos += 5;
      }
      
      if (entry.observations) {
        const obsText = entry.observations.length > 80 ? 
          entry.observations.substring(0, 80) + '...' : entry.observations;
        doc.text(`   Observações: ${obsText}`, 25, yPos);
        yPos += 5;
      }
      
      if (entry.reason) {
        const reasonText = entry.reason.length > 80 ? 
          entry.reason.substring(0, 80) + '...' : entry.reason;
        doc.text(`   Motivo: ${reasonText}`, 25, yPos);
        yPos += 5;
      }
      
      yPos += 5;
    }
  }
  
  // Form Responses
  if (task.formularioResposta?.answers) {
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.text('RESPOSTAS DO FORMULÁRIO', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.text(`Formulário: ${task.formularioResposta.formName}`, 20, yPos);
    yPos += 10;
    
    task.formularioResposta.answers.forEach(answer => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      let answerText = answer.answer;
      if (Array.isArray(answerText)) {
        answerText = answerText.join(', ');
      }
      
      const questionText = answer.questionText.length > 60 ? 
        answer.questionText.substring(0, 60) + '...' : answer.questionText;
      const responseText = answerText && answerText.length > 60 ? 
        answerText.substring(0, 60) + '...' : answerText;
      
      doc.text(`P: ${questionText}`, 20, yPos);
      yPos += 5;
      doc.text(`R: ${responseText || 'Não respondido'}`, 20, yPos);
      yPos += 10;
    });
  }
  
  // Save the PDF
  doc.save(`relatorio-tarefa-${task.id}-${new Date().toISOString().split('T')[0]}.pdf`);
}

function exportToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Get all tasks
  const tasks = window.dataService.getAll(window.dataService.DATA_TYPES.TASKS);
  const companies = window.dataService.getAll(window.dataService.DATA_TYPES.COMPANIES);
  const employees = window.dataService.getAll(window.dataService.DATA_TYPES.EMPLOYEES);
  
  // Title
  doc.setFontSize(20);
  doc.text('Relatório de Tarefas', 20, 20);
  
  // Date
  doc.setFontSize(12);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 35);
  
  let yPosition = 50;
  
  tasks.forEach((task, index) => {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    const company = companies.find(c => c.id === task.empresaId);
    const employee = employees.find(e => e.id === task.colaboradorId);
    
    // Task header
    doc.setFontSize(14);
    doc.text(`${index + 1}. ${task.empresaNome}`, 20, yPosition);
    yPosition += 10;
    
    // Task details
    doc.setFontSize(10);
    doc.text(`Técnico: ${employee ? employee.nome : 'N/A'}`, 25, yPosition);
    yPosition += 5;
    doc.text(`Data: ${task.data} - ${task.hora}`, 25, yPosition);
    yPosition += 5;
    doc.text(`Status: ${getStatusText(task.status)}`, 25, yPosition);
    yPosition += 5;
    
    if (task.responsavel) {
      doc.text(`Responsável: ${task.responsavel}`, 25, yPosition);
      yPosition += 5;
    }
    
    if (task.tempoSugerido) {
      doc.text(`Tempo Sugerido: ${task.tempoSugerido}h`, 25, yPosition);
      yPosition += 5;
    }
    
    // Work time if completed
    if (task.report?.workTime) {
      doc.text(`Tempo Executado: ${task.report.workTime}`, 25, yPosition);
      yPosition += 5;
    }
    
    // Description (truncated if too long)
    const description = task.descricao.length > 80 ? 
      task.descricao.substring(0, 80) + '...' : task.descricao;
    doc.text(`Descrição: ${description}`, 25, yPosition);
    yPosition += 10;
    
    // Form responses if available
    if (task.formularioResposta?.answers) {
      doc.text('Respostas do Formulário:', 25, yPosition);
      yPosition += 5;
      
      task.formularioResposta.answers.forEach(answer => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        let answerText = answer.answer;
        if (Array.isArray(answerText)) {
          answerText = answerText.join(', ');
        }
        
        const questionText = answer.questionText.length > 40 ? 
          answer.questionText.substring(0, 40) + '...' : answer.questionText;
        const responseText = answerText && answerText.length > 40 ? 
          answerText.substring(0, 40) + '...' : answerText;
        
        doc.text(`  • ${questionText}: ${responseText || 'Não respondido'}`, 30, yPosition);
        yPosition += 5;
      });
    }
    
    yPosition += 5; // Space between tasks
  });
  
  // Save the PDF
  doc.save(`relatorio-tarefas-${new Date().toISOString().split('T')[0]}.pdf`);
}

// Delete task
function deleteTask(taskId) {
  
  const confirmDelete = confirm("Tem certeza que deseja deletar esta tarefa? Esta ação não pode ser desfeita.");
  if (!confirmDelete) return; // Se o usuário cancelar, para aqui

  const idSelect = { id: taskId };
  fetch("https://localhost/EBEN/api/delete_task.php", {
         method: 'POST',
         headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify(idSelect)
        })
       .then(response => response.json())
       .then(data => {
        console.log('Resposta do servidor:', data);
        const modal = bootstrap.Modal.getInstance(document.getElementById('taskDetailModal'));
        if (modal) modal.hide();
    
        // Reload tasks
        loadTasks();
        
        })
        .catch(error => {
        console.error('Erro ao enviar:', error);})
        
  /*if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
    window.dataService.delete(window.dataService.DATA_TYPES.TASKS, taskId);
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('taskDetailModal'));
    if (modal) modal.hide();
    
    // Reload tasks
    loadTasks();
    
    alert('Tarefa excluída com sucesso!');
    
  }
    */
}

// Add event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Initialize data from the data service
  initApp();
  
  // Export PDF button
  const exportPdfBtn = document.getElementById('exportPdfBtn');
  if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', exportToPDF);
  }
});

function getActionText(action) {
  const actions = {
    'criada': 'Tarefa Criada',
    'iniciou_translado': 'Iniciou Translado',
    'encerrou_translado': 'Encerrou Translado',
    'iniciada': 'Tarefa Iniciada',
    'pausada': 'Tarefa Pausada',
    'retomada': 'Tarefa Retomada',
    'concluida': 'Tarefa Concluída',
    'iniciou_retorno': 'Iniciou Retorno',
    'finalizada': 'Tarefa Finalizada'
  };
  return actions[action] || action;
}
