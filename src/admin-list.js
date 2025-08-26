document.addEventListener('DOMContentLoaded', function () {
  console.log('DOM loaded, initializing app');
  // Initialize data from the data service
  initApp();
});

// Initialize the application
function initApp() {
  loadTasks();
  document.getElementById('date-filter').addEventListener('change', loadTasks);
  document.getElementById('status-filter').addEventListener('change', loadTasks);
  document.getElementById('reset-filters').addEventListener('click', resetFilters);

  const exportPdfBtn = document.getElementById('exportPdfBtn');
  if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', exportToPDF);
  }
}

// Function to open task details in a modal
function openTaskDetails(taskId) {
  const task = window.dataService.getById(window.dataService.DATA_TYPES.TASKS, taskId);

  if (!task) {
    alert('Tarefa não encontrada.');
    return;
  }

  console.log('Showing task detail for ID:', taskId);
  console.log('Task found:', task);
  console.log('Task status:', task.status);
  console.log('Task tempoSugerido:', task.tempoSugerido);
  console.log('Task report:', task.report);

  const modal = new bootstrap.Modal(document.getElementById('taskDetailModal'));
  const detailContent = document.getElementById('task-detail-content');
  const historyContent = document.getElementById('task-history-list');
  const formResponsesSection = document.getElementById('form-responses-section');
  const formResponsesContent = document.getElementById('form-responses-content');

  // Populate task details
  const formattedDate = task.data.split('-').reverse().join('/');
  detailContent.innerHTML = `
    <h5>${task.empresaNome}</h5>
    <p><strong>Colaborador:</strong> ${task.colaboradorNome || 'Não atribuído'}</p>
    <p><strong>Data:</strong> ${formattedDate} às ${task.hora}</p>
    <p><strong>Status:</strong> <span class="status-badge status-${task.status}">${getStatusText(task.status)}</span></p>
    <p><strong>Descrição:</strong></p>
    <div class="border p-2 bg-light">${task.descricao}</div>
  `;

  // Populate task history
  if (task.history && task.history.length > 0) {
    historyContent.innerHTML = task.history
      .map(entry => `
        <div class="border-bottom py-2">
          <p><strong>Ação:</strong> ${entry.action}</p>
          <p><strong>Data:</strong> ${new Date(entry.timestamp).toLocaleString()}</p>
          <p><strong>Localização:</strong> ${entry.coordinates || 'N/A'}</p>
          <p><strong>Observações:</strong> ${entry.observations || 'Nenhuma'}</p>
        </div>
      `)
      .join('');
  } else {
    historyContent.innerHTML = '<p class="text-muted">Nenhum histórico disponível.</p>';
  }

  // Populate form responses if available
  if (task.formularioResposta) {
    formResponsesSection.style.display = 'block';
    formResponsesContent.innerHTML = task.formularioResposta.answers
      .map(answer => `
        <div class="border-bottom py-2">
          <p><strong>${answer.questionText}:</strong> ${Array.isArray(answer.answer) ? answer.answer.join(', ') : answer.answer}</p>
        </div>
      `)
      .join('');
  } else {
    formResponsesSection.style.display = 'none';
  }

  // Check if the task qualifies for performance analysis
  const qualifiesForAnalysis = task.status === 'concluida' &&
    task.tempoSugerido &&
    task.report &&
    task.report.workTime;

  if (qualifiesForAnalysis) {
    console.log('Task qualifies for performance analysis');
    renderIndividualPerformanceChart(task);
  } else {
    console.warn('Task does not qualify for performance analysis');
    console.log('Status check:', task.status === 'concluida');
    console.log('Tempo sugerido check:', !!task.tempoSugerido);
    console.log('Report check:', !!task.report);
    console.log('Work time check:', !!task.report?.workTime);
  }

  modal.show();
}

// Load tasks from data service
function loadTasks() {
  const tasksTableBody = document.getElementById('tasks-table-body');
  const noTasksMessage = document.getElementById('no-tasks-message');
  
  fetch("https://step.tcbx.com.br/api/tasklist.php")
    .then(response => response.json())
    .then(task_json => {
      const tasks = applyFilters(task_json); // Aplica filtros
      
      if (tasks.length === 0) {
        tasksTableBody.innerHTML = '';
        noTasksMessage.classList.remove('d-none');
        return;
      }
      
      noTasksMessage.classList.add('d-none');
      
      // Renderiza as TAREFAS FILTRADAS (não o task_json original)
      tasksTableBody.innerHTML = tasks.map(task => {
        const [year, month, day] = task.data_tarefa.split('-');
        const formattedDate = `${day}/${month}/${year}`;
        const statusClass = getStatusClass(task.status);
        
        return `
          <tr class="task-row" data-id="${task.id}">
            <td>${task.empresa}</td>
            <td>${task.colaborador}</td>
            <td>${formattedDate}</td>
            <td>${task.hora_tarefa}</td>
            <td><span class="status-badge status-${statusClass}">${getStatusText(task.status)}</span></td>
          </tr>
        `;
      }).join('');

      // Adiciona os event listeners
      document.querySelectorAll('.task-row').forEach(row => {
        row.addEventListener('click', function() {
          const taskId = parseInt(this.getAttribute('data-id'));
          showTaskDetail(taskId);
        });
      });
    })
    .catch(error => {
      console.error('Erro ao carregar tarefas:', error);
    });
}

// Apply filters to tasks
function applyFilters(tasks) {
  const dateFilter = document.getElementById('date-filter').value;
  const statusFilter = document.getElementById('status-filter').value;

  let filteredTasks = tasks;

  if (dateFilter) {
    // Compara diretamente no formato YYYY-MM-DD (sem converter)
    filteredTasks = filteredTasks.filter(task => task.data_tarefa === dateFilter);
  }

  if (statusFilter !== 'all') {
    const statusMap = {
      'pending': 'pendente',
      'in_progress': 'em_andamento',
      'completed': 'concluida',
      'canceled': 'cancelada'
    };
    filteredTasks = filteredTasks.filter(task => task.status === statusMap[statusFilter]);
  }

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
    case 'pendente': return 'pending';
    case 'em_translado': return 'warning';
    case 'em_andamento': return 'progress';
    case 'pausada': return 'paused';
    case 'aguardando_retorno': return 'warning';
    case 'retornando': return 'warning';
    case 'finalizado': return 'warning';
    case 'concluida': return 'completed';
    case 'cancelada': return 'canceled';
    default: return 'pending';
  }
}

// Get status text
function getStatusText(status) {
  switch (status) {
    case 'pendente': return 'Pendente';
    case 'em_translado': return 'Em Translado';
    case 'aguardando_inicio': return 'Aguardando Início';
    case 'em_andamento': return 'Em Andamento';
    case 'pausada': return 'Pausada';
    case 'aguardando_retorno': return 'Aguardando Retorno';
    case 'retornando': return 'Retornando';
    case 'finalizado': return 'Finalizado';
    case 'concluida': return 'Concluída';
    case 'cancelada': return 'Cancelada'; // CORREÇÃO: estava faltando este caso
    default: return 'Desconhecido';
  }
}

let detailMap = null;

// Initialize detail map with Leaflet
function initDetailMap(coordinates) {
  const mapContainer = document.getElementById('detail-map');
  if (mapContainer._leaflet_id) {
    mapContainer._leaflet_id = null;
  }

  let initialLat = -2.9055;
  let initialLng = -41.7734;

  if (coordinates) {
    const coords = coordinates.split(',');
    initialLat = parseFloat(coords[0]);
    initialLng = parseFloat(coords[1]);
  }

  detailMap = L.map('detail-map').setView([initialLat, initialLng], 15);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(detailMap);

  L.marker([initialLat, initialLng]).addTo(detailMap);

  setTimeout(() => {
    detailMap.invalidateSize();
  }, 300);
}

//Funções para conversão de tempo
function HHMMSSToDecimal(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
  return hours + minutes / 60 + seconds / 3600;
}

function decimalToHHMM(decimalHours) {
  const totalMinutes = Math.round(decimalHours * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

}

function formatTimeToHHMM(timeStr) {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  return timeStr;

}

function showTaskDetail(taskId) {
  
  
  const payload = { id: taskId };  
  fetch("https://step.tcbx.com.br/api/showdetailstask.php", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  .then(response => response.json())
  .then(taskData => {
    
    if (!taskData || taskData.status === 'erro') {
    
      return;
    }

    // Transformar os dados da API na estrutura esperada pelo código
    const task = {
      id: taskData.id,
      empresaNome: taskData.empresa,
      colaborador: taskData.colaborador,
      data_tarefa: taskData.data_tarefa,
      hora_tarefa: taskData.hora_tarefa,
      status: taskData.status,
      tempo_sugerido: taskData.tempo_sugerido,
      responsavel: taskData.responsavel,
      descricao: taskData.descricao,
      formulario_id: taskData.formulario_id,
      coordinates: taskData.coordenadas,
      // Campos de tempo (convertendo para o formato de report)
      report: {
        workTime: taskData.workTime,
        pauseTime: taskData.pauseTime,
        returnTransitTime: taskData.returnTransitTime,
        observations: taskData.observations,
        completionObservations: taskData.completionObservations,
        finalObservations: taskData.finalObservations
      },
      // Campos de cancelamento (se existirem)
      cancellation: taskData.cancellation_timestamp ? {
        timestamp: taskData.cancellation_timestamp,
        reason: taskData.cancellation_reason,
        coordinates: taskData.cancellation_coordinates,
        photo: taskData.cancellation_photo
      } : null
    };



    let timeComparison = '';
    let efficiency = null;
    let actualHours = null;
    let showPerformanceAnalysis = false;

    // Conversão tempo sugerido de HH:MM:SS para decimal
    const tempoSugeridoDecimal = HHMMSSToDecimal(task.tempo_sugerido);
    

    // Verifica se há dados para análise de performance
    if ((task.status === 'concluida' || task.status === 'aguardando_retorno') &&
        task.tempo_sugerido &&
        task.report &&
        task.report.workTime) {



      actualHours = HHMMSSToDecimal(task.report.workTime);
     

      if (actualHours > 0) {
        efficiency = Math.round((tempoSugeridoDecimal / actualHours) * 100);
       

        const difference = actualHours - tempoSugeridoDecimal;
        const isOverTime = difference > 0;

        timeComparison = `
          <div class="alert ${isOverTime ? 'alert-warning' : 'alert-success'} mt-2">
            <strong>Análise de Tempo:</strong><br>
            Tempo Sugerido: ${(task.tempo_sugerido)}<br>
            Tempo Executado: ${(task.report.workTime)}<br>
            Eficiência: ${efficiency}%<br>
            ${isOverTime ? `Excedeu em ${decimalToHHMM(Math.abs(difference))}` : `Concluído ${decimalToHHMM(Math.abs(difference))} antes do previsto`}
          </div>
        `;
        showPerformanceAnalysis = true;
      }
    } else {
      console.log('Task does not qualify for performance analysis');
    }

    // Cancelamento, se houver
    let cancellationInfo = '';
    if (task.status === 'cancelada' && task.cancellation) {
      const uploadPath = 'api/uploads/cancellations/';
      const cancelDate = new Date(task.cancellation.timestamp);
      const formattedDate = cancelDate.toLocaleDateString('pt-BR');
      const formattedTime = cancelDate.toLocaleTimeString('pt-BR');
      
      cancellationInfo = `
        <div class="alert alert-danger mt-3">
          <h6>Cancelamento da Tarefa</h6>
          <p><strong>Data/Hora:</strong> ${formattedDate} às ${formattedTime}</p>
          <p><strong>Motivo:</strong> ${task.cancellation.reason}</p>
          <p><strong>Localização:</strong> ${task.cancellation.coordinates || 'N/A'}</p>
          ${task.cancellation.photo ? `
            <div class="mt-2">
              <strong>Foto do Local:</strong>
              <img src="${uploadPath}${task.cancellation.photo}" class="img-fluid rounded mt-2" alt="Foto do local">
            </div>` : ''}
        </div>
      `;
    }

    const content = `
      <div class="mb-3">
        <h6>Informações Básicas</h6>
        <p><strong>Empresa:</strong> ${task.empresaNome}</p>
        <p><strong>Técnico:</strong> ${task.colaborador}</p>
        ${task.responsavel ? `<p><strong>Responsável no Local:</strong> ${task.responsavel}</p>` : ''}
        <p><strong>Data:</strong> ${task.data_tarefa}</p>
        <p><strong>Hora:</strong> ${task.hora_tarefa}</p>
        ${task.tempo_sugerido ? `<p><strong>Tempo Sugerido:</strong> ${decimalToHHMM(tempoSugeridoDecimal)}</p>` : ''}
        <p><strong>Status:</strong> <span class="status-badge status-${getStatusClass(task.status)}">${getStatusText(task.status)}</span></p>
        <p><strong>Descrição:</strong> ${task.descricao}</p>
        ${task.formulario_id ? `<p><strong>Formulário ID:</strong> ${task.formulario_id}</p>` : ''}
        ${timeComparison}
      </div>
      
      ${cancellationInfo}

      ${showPerformanceAnalysis ? `
        <div class="mb-4" id="performance-analysis-section">
          <h6>Análise de Performance</h6>
          <div class="row">
            <div class="col-md-6">
              <div class="chart-container" style="height: 200px;">
                <canvas id="efficiencyChart" width="300" height="150"></canvas>
              </div>
            </div>
            <div class="col-md-6">
              <div class="chart-container" style="height: 200px;">
                <canvas id="timeChart" width="300" height="150"></canvas>
              </div>
            </div>
          </div>
        </div>
      ` : ''}
    `;

    document.getElementById('task-detail-content').innerHTML = content;

    // Carregar componentes adicionais
    loadTaskHistory(task);
    showFormResponses(task);
    initDetailMap(task.coordinates);

    // Mostrar o modal
    const modal = new bootstrap.Modal(document.getElementById('taskDetailModal'));
    modal.show();

    // Configurar handlers de botões
    document.getElementById('btn-delete-task').onclick = () => deleteTask(taskId);
    document.getElementById('btn-export-individual-pdf').onclick = () => exportIndividualTaskToPDF(taskId);

    // Configurar componentes após o modal ser exibido
    modal._element.addEventListener('shown.bs.modal', function () {
    
      setupCollapsibleHistory();

      // Inicializar gráficos de performance se necessário
      if (showPerformanceAnalysis && efficiency !== null && actualHours !== null) {
        console.log('Initializing performance charts with data:', { 
          efficiency, 
          actualHours, 
          tempoSugerido: tempoSugeridoDecimal 
        });

        // Garantir que o DOM esteja pronto
        setTimeout(() => {
          if (typeof Chart !== 'undefined') {
            initPerformanceCharts(task, efficiency, actualHours, tempoSugeridoDecimal);
          } else {
            console.error('Chart.js not loaded');
          }
        }, 100);
      }
    }, { once: true });

  }).catch(error => {
    console.error('Erro na consulta:', error);
  });
}

function initPerformanceCharts(task, efficiency, actualHours, tempoSugeridoDecimal) {
  console.log('Starting chart initialization with data:', { 
    efficiency, 
    actualHours, 
    tempoSugerido: tempoSugeridoDecimal 
  });

  // Gráfico de eficiência
  const efficiencyCtx = document.getElementById('efficiencyChart');
  if (efficiencyCtx) {
    try {
      // Limpar gráfico existente
      if (efficiencyCtx.chartInstance) {
        efficiencyCtx.chartInstance.destroy();
      }

      const efficiencyValue = Math.min(efficiency, 200);
      const wasteValue = Math.max(0, 100 - efficiencyValue);

      efficiencyCtx.chartInstance = new Chart(efficiencyCtx, {
        type: 'doughnut',
        data: {
          labels: ['Eficiência', 'Desperdício'],
          datasets: [{
            data: [efficiencyValue, wasteValue],
            backgroundColor: [
              efficiency >= 100 ? '#198754' : '#ffc107',
              '#dc3545'
            ],
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: `Eficiência: ${efficiency}%`,
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            legend: {
              position: 'bottom',
              labels: {
                padding: 10,
                font: {
                  size: 11
                }
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error creating efficiency chart:', error);
    }
  }

  // Gráfico de comparação de tempo
  const timeCtx = document.getElementById('timeChart');
  if (timeCtx && tempoSugeridoDecimal && actualHours) {
    try {
      // Limpar gráfico existente
      if (timeCtx.chartInstance) {
        timeCtx.chartInstance.destroy();
      }

      timeCtx.chartInstance = new Chart(timeCtx, {
        type: 'bar',
        data: {
          labels: ['Tempo Sugerido', 'Tempo Real'],
          datasets: [{
            label: 'Horas',
            data: [tempoSugeridoDecimal, actualHours],
            backgroundColor: [
              '#0d6efd',
              actualHours <= tempoSugeridoDecimal ? '#198754' : '#dc3545'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Comparação de Tempo',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  return `${context.label}: ${decimalToHHMM(context.parsed.y)}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Tempo',
                font: {
                  weight: 'bold'
                }
              },
              ticks: {
                callback: function (value) {
                  return decimalToHHMM(value);
                }
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error creating time chart:', error);
    }
  }
}

function setupCollapsibleHistory() {
  const historyToggle = document.getElementById('historyToggle');
  const historyContent = document.getElementById('historyContent');
  const historyIcon = document.getElementById('historyIcon');

  if (!historyToggle || !historyContent || !historyIcon) {
    console.error('History elements not found');
    return;
  }

  // Remove any existing event listeners
  const newHistoryToggle = historyToggle.cloneNode(true);
  historyToggle.parentNode.replaceChild(newHistoryToggle, historyToggle);

  // Reset initial state
  historyContent.classList.remove('show');
  historyIcon.classList.remove('bi-chevron-up');
  historyIcon.classList.add('bi-chevron-down');

  // Add new event listener
  newHistoryToggle.addEventListener('click', function (e) {
    console.log('History toggle clicked');
    e.preventDefault();
    e.stopPropagation();

    const isVisible = historyContent.classList.contains('show');
    console.log('Current visibility:', isVisible);

    if (isVisible) {
      historyContent.classList.remove('show');
      historyIcon.classList.remove('bi-chevron-up');
      historyIcon.classList.add('bi-chevron-down');
      console.log('History hidden');
    } else {
      historyContent.classList.add('show');
      historyIcon.classList.remove('bi-chevron-down');
      historyIcon.classList.add('bi-chevron-up');
      console.log('History shown');
    }
  });


}

function loadTaskHistory(task) {
    const historyList = document.getElementById('task-history-list');
    historyList.innerHTML = '<p class="text-muted">Carregando histórico...</p>';

<<<<<<< HEAD
    fetch("https://step.tcbx.com.br/api/get_task_history.php", {
=======
    fetch("https://localhost/EBEN/api/get_task_history.php", {
>>>>>>> 6ae232c7c61eb2224befb8c7dbf536cbeb0794d5
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ id: task.id })
    })
    .then(response => response.json())
    .then(historyData => {
        console.log('Dados do histórico:', historyData);
        const history = historyData.history;

        if (!history || history.length === 0) {
            historyList.innerHTML = '<p class="text-muted">Nenhum histórico disponível</p>';
            return;
        }

        // Usa os dados na ordem original da API
        const historyHtml = history.map(entry => {
            // CORREÇÃO AQUI: Usar formatDateTimeSafe diretamente no timestamp
            const formattedDateTime = formatDateTimeSafe(entry.timestamp);
            
            // Extrai coordenadas (se existirem)
            let locationInfo = 'Localização não disponível';
            let coords = null;
            
            if (entry.coordinates) {
                coords = entry.coordinates.split(',');
                locationInfo = `Lat: ${parseFloat(coords[0]).toFixed(6)}, Lng: ${parseFloat(coords[1]).toFixed(6)}`;
            }

            return `
                <div class="border-start border-primary ps-3 mb-3">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <div class="fw-bold">${getActionText(entry.action)}</div>
                            <small class="text-muted">${formattedDateTime}</small>
                            <br><small class="text-info">${locationInfo}</small>
                            ${entry.observations ? `<br><small class="text-secondary"><strong>Observações:</strong> ${entry.observations}</small>` : ''}
                            ${entry.reason ? `<br><small class="text-warning"><strong>Motivo:</strong> ${entry.reason}</small>` : ''}
                        </div>
                        ${coords ? 
                            `<button class="btn btn-sm btn-outline-primary" 
                                onclick="showLocationOnMap('${coords[0]}', '${coords[1]}', '${getActionText(entry.action)}')">
                                Ver no Mapa
                            </button>` : 
                            ''
                        }
                    </div>
                </div>
            `;
        }).join('');

        historyList.innerHTML = historyHtml;
    })
    .catch(error => {
        console.error('Erro ao carregar histórico:', error);
        historyList.innerHTML = '<p class="text-danger">Erro ao carregar histórico</p>';
    });
}

function showFormResponses(task) {
  fetch("https://step.tcbx.com.br/api/showformdetails.php", {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ id: task.id })
  })
  .then(response => response.json())
  .then(formdata => {
    console.log(formdata); // formdata é um array de formulários

    const formResponsesSection = document.getElementById('form-responses-section');
    const formResponsesContent = document.getElementById('form-responses-content');

    if (!formdata || formdata.length === 0) {
      // Se não tem formulários, oculta a seção e retorna
      formResponsesSection.style.display = 'none';
      formResponsesContent.innerHTML = '';
      return;
    }

    // Mostra a seção de formulários
    formResponsesSection.style.display = 'block';

    // Monta o HTML para todos os formulários
    const responsesHtml = formdata.map(form => {
      // Para cada formulário, monta as respostas
      const answersHtml = form.answers.map(answer => {
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

      return `
        <div class="form-response mb-4 p-3 border rounded">
          <h5>${form.form_titulo}</h5>
          <small>Respondido em: ${form.respondido_em}</small>
          <div class="form-answers mt-2">
            ${answersHtml}
          </div>
        </div>
      `;
    }).join('');

    // Insere o HTML completo no container
    formResponsesContent.innerHTML = responsesHtml;
  })
  .catch(error => {
    console.error('Erro ao carregar formulário:', error);
  });
}


function showLocationOnMap(lat, lng, title) {
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

  const existingModal = document.getElementById('locationModal');
  if (existingModal) {
    existingModal.remove();
  }

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const modal = new bootstrap.Modal(document.getElementById('locationModal'));
  modal.show();

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

// ======================================================
// Função para formatar data/hora de forma segura
// ======================================================
// Função modificada
function formatDateTimeSafe(dateTime) {
  // Se já for um objeto Date válido
  if (dateTime instanceof Date && !isNaN(dateTime.getTime())) {
    return dateTime.toLocaleString('pt-BR', { hour12: false });
  }
  
  // Se for string/number/outro formato
  if (!dateTime || dateTime === 'null' || dateTime === null) {
    return '—';
  }
  
  const date = new Date(dateTime);
  return isNaN(date.getTime()) ? '—' : date.toLocaleString('pt-BR', { hour12: false });
}

async function exportIndividualTaskToPDF(taskId) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const payload = { id: taskId };
  
  fetch("https://step.tcbx.com.br/api/relatoryid.php", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(response => response.json())
  .then(data => {
    console.log(data);
    const task = data.task;
    const company = data.company;
    const employee = data.employee;
    const history = data.history; // Novo histórico
    const formResponses = data.formResponses; // Novos formulários


    // Funções auxiliares (mantidas do código original)
    function parseTimeToSeconds(timeStr) {
      if (!timeStr) return 0;
      const parts = timeStr.split(':').map(Number);
      const hours = parts[0] || 0;
      const minutes = parts[1] || 0;
      const seconds = parts[2] || 0;
      return hours * 3600 + minutes * 60 + seconds;
    }

    function secondsToHHMMSS(totalSeconds) {
      const sign = totalSeconds < 0 ? '-' : '';
      let s = Math.abs(Math.round(totalSeconds));
      const h = Math.floor(s / 3600);
      s = s % 3600;
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return `${sign}${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    }

    // Header
    doc.setFontSize(18);
    doc.text('RELATÓRIO INDIVIDUAL DE TAREFA', 20, 20);
    doc.setFontSize(12);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, 30);

    // Informações Básicas
    let yPos = 45;
    doc.setFontSize(14);
    doc.text('INFORMAÇÕES BÁSICAS', 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.text(`Empresa: ${company.nome}`, 20, yPos);
    yPos += 5;
    doc.text(`Técnico: ${employee.nome}`, 20, yPos);
    yPos += 5;
    
    if (task.responsavel) {
      doc.text(`Responsável no Local: ${task.responsavel}`, 20, yPos);
      yPos += 5;
    }
    
    const taskDate = new Date(task.data_tarefa).toLocaleDateString('pt-BR');
    doc.text(`Data: ${taskDate} - ${task.hora_tarefa.substring(0,5)}`, 20, yPos);
    yPos += 5;
    
    doc.text(`Status: ${getStatusText(task.status)}`, 20, yPos);
    yPos += 5;
    
    if (task.tempo_sugerido) {
      const tempo = task.tempo_sugerido.substring(0, 5);
      doc.text(`Tempo Sugerido: ${tempo}h`, 20, yPos);
      yPos += 5;
    }
    
    doc.text(`Descrição: ${task.descricao || 'Nenhuma'}`, 20, yPos);
    yPos += 15;

    // Performance
    if (task.status === 'concluida' && task.tempo_sugerido && task.workTime) {
      const suggestedSec = parseTimeToSeconds(task.tempo_sugerido);
      const executedSec = parseTimeToSeconds(task.workTime);
      const efficiency = executedSec > 0 ? Math.round((suggestedSec / executedSec) * 100) : 0;
      const diffSec = executedSec - suggestedSec;

      doc.setFontSize(14);
      doc.text('ANÁLISE DE PERFORMANCE', 20, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.text(`Tempo Sugerido: ${secondsToHHMMSS(suggestedSec)}`, 20, yPos);
      yPos += 5;
      doc.text(`Tempo Executado: ${secondsToHHMMSS(executedSec)}`, 20, yPos);
      yPos += 5;
      doc.text(`Eficiência: ${efficiency}%`, 20, yPos);
      yPos += 5;
      doc.text(`Diferença: ${secondsToHHMMSS(diffSec)}`, 20, yPos);
      yPos += 15;
    }

    // Histórico de Movimentos
    if (history && history.length > 0) {
      doc.setFontSize(14);
      doc.text('HISTÓRICO DE MOVIMENTOS', 20, yPos);
      yPos += 10;

      for (let i = 0; i < history.length; i++) {

        // Quebra de página se necessário
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        const entry = history[i];
        const date = new Date(entry.timestamp);
        const formattedDateTime = `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR')}`;
        
      
        doc.setFontSize(10);
        doc.text(`${i + 1}. ${getActionText(entry.action)}`, 20, yPos);
        yPos += 5;
        doc.text(`   Data/Hora: ${formatDateTimeSafe(entry.timestamp)}`, 25, yPos);
        yPos += 5;

        if (entry.coordinates) {
          const coords = entry.coordinates.split(',');
          doc.text(`   Coordenadas: Lat ${parseFloat(coords[1]).toFixed(6)}, Lng ${parseFloat(coords[0]).toFixed(6)}`, 25, yPos);
          yPos += 5;
        }

        if (entry.observations) {
          const obsLines = doc.splitTextToSize(`   Observações: ${entry.observations}`, 160);
          obsLines.forEach(line => {
            doc.text(line, 25, yPos);
            yPos += 5;
          });
        }

        if (entry.reason) {
          const reasonLines = doc.splitTextToSize(`   Motivo: ${entry.reason}`, 160);
          reasonLines.forEach(line => {
            doc.text(line, 25, yPos);
            yPos += 5;
          });
        }

        yPos += 5; // Espaço entre itens
      }
    }
    if (formResponses && formResponses.length > 0) {
      // Quebra de página se necessário
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }

      // Percorre cada formulário respondido
      for (const form of formResponses) {
        doc.setFontSize(14);
        doc.text('FORMULÁRIO RESPONDIDO', 20, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.text(`Formulário: ${form.form_titulo} (${form.respondido_em})`, 20, yPos);
        yPos += 10;

        // Percorre cada pergunta/resposta
        for (const answer of form.answers) {
          // Quebra de página se necessário
          if (yPos > 250) {
            doc.addPage();
            yPos = 20;
          }

          let answerText = answer.answer;
          if (Array.isArray(answerText)) {
            answerText = answerText.join(', ');
          }

          // Quebra texto longo para múltiplas linhas
          const questionLines = doc.splitTextToSize(` ${answer.questionText}`, 170);
          const answerLines = doc.splitTextToSize(` ${answerText || 'Sem resposta'}`, 160);

          // Pergunta
          questionLines.forEach(line => {
            doc.text(line, 20, yPos);
            yPos += 5;
          });

          // Resposta
          answerLines.forEach(line => {
            doc.text(line, 25, yPos);
            yPos += 5;
          });

          yPos += 5; // Espaço entre perguntas
        }
        
        yPos += 10; // Espaço entre formulários
      }
    }

    if (task.status.toLowerCase() === 'cancelada') {
        console.log("entrou")

      // Quebra de página se necessário
        if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }

      const cancelDate = new Date(task.cancellation.timestamp);
      const formattedDate = cancelDate.toLocaleDateString('pt-BR');
      const formattedTime = cancelDate.toLocaleTimeString('pt-BR');

      doc.setFontSize(14);
      doc.text('INFORMAÇÕES DE CANCELAMENTO', 20, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.text(`Data/Hora: ${formattedDate} ${formattedTime}`, 20, yPos);
      yPos += 5;
      doc.text(`Motivo: ${task.cancellation.reason || 'Não informado'}`, 20, yPos);
      yPos += 5;

      if (task.cancellation.coordinates) {
        const coords = task.cancellation.coordinates.split(',');
        doc.text(`Localização: Lat ${parseFloat(coords[1]).toFixed(6)}, Lng ${parseFloat(coords[0]).toFixed(6)}`, 20, yPos);
        yPos += 5;
      } else {
        doc.text('Localização: Não informada', 20, yPos);
        yPos += 5;
      }

      yPos += 5; // Espaço antes da foto

      // Se houver foto, tentar adicionar
      if (task.cancellation.photo) {
        doc.text('Foto do Local:', 20, yPos);
        yPos += 5;

        try {
          // Tenta carregar a imagem via URL
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.src = task.cancellation.photo;
          
          // Adiciona a imagem (dimensionada para 80x60)
          doc.addImage(img, 'JPEG', 20, yPos, 80, 60);
          yPos += 70; // Altura da imagem + margem
        } catch (e) {
          console.error('Erro ao adicionar imagem ao PDF:', e);
          doc.text('(Foto não pôde ser incluída)', 20, yPos);
          yPos += 5;
        }
      } else {
        doc.text('Foto: Não disponível', 20, yPos);
        yPos += 5;
      }
    }

    doc.save(`relatorio-tarefa-${task.id}-${new Date().toISOString().split('T')[0]}.pdf`);


    
  })
  .catch(error => {
    console.error('Erro:', error);
    alert('Erro ao gerar relatório: ' + error.message);
  });

  function getStatusText(status) {
    const statusMap = {
      'agendada': 'Agendada',
      'concluida': 'Concluída',
      'cancelada': 'Cancelada',
      'em_andamento': 'Em Andamento',
      'pausada': 'Pausada'
    };
    return statusMap[status] || status;
  }

  function getActionText(action) {
    const actionMap = {
      'criado': 'Tarefa Criada',
      'inicio_translado': 'Iniciou Translado',
      'fim_translado': 'Encerrou Translado',
      'inicio_tarefa': 'Tarefa Iniciada',
      'conclusao_tarefa': 'Tarefa Concluída',
      'inicio_retorno': 'Iniciou Retorno',
      'fim_retorno': 'Encerrou Retorno',
      'finalizada': 'Tarefa Finalizada',
      'pausa': 'Tarefa Pausada',
      'retomada': 'Tarefa Retomada'
    };
    return actionMap[action] || action;
  }
}

    /*

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

  /* Cancel information if applicable
  if (task.status === 'cancelada' && task.cancellation) {
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    const cancelDate = new Date(task.cancellation.timestamp);
    const formattedDate = cancelDate.toLocaleDateString('pt-BR');
    const formattedTime = cancelDate.toLocaleTimeString('pt-BR');

    doc.setFontSize(14);
    doc.text('INFORMAÇÕES DE CANCELAMENTO', 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.text(`Data/Hora: ${formattedDate} ${formattedTime}`, 20, yPos);
    yPos += 5;
    doc.text(`Motivo: ${task.cancellation.reason}`, 20, yPos);
    yPos += 5;
    doc.text(`Localização: ${task.cancellation.coordinates || 'N/A'}`, 20, yPos);
    yPos += 10;

    if (task.cancellation.photo) {
      doc.text('Foto do Local:', 20, yPos);
      yPos += 5;

      // Adicionar a foto (se suportado)
      try {
        const img = new Image();
        img.src = task.cancellation.photo;
        doc.addImage(img, 'JPEG', 20, yPos, 80, 60);
        yPos += 70;
      } catch (e) {
        console.error('Erro ao adicionar imagem ao PDF:', e);
        doc.text('(Foto não pôde ser incluída)', 20, yPos);
        yPos += 5;
      }
    }
  }
    */

  // Save the PDF
 // doc.save(`relatorio-tarefa-${task.id}-${new Date().toISOString().split('T')[0]}.pdf`);


async function exportToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  fetch("https://step.tcbx.com.br/api/relatory.php", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
    .then(response => response.json())
    .then(response => {
      console.log('Resposta da API:', response);

      const tasks = response.tarefas;
      const formularios = response.formularios;

      if (!Array.isArray(tasks)) {
        console.error("A propriedade 'tarefas' não é um array:", tasks);
        return;
      }

      doc.setFontSize(20);
      doc.text('Relatório de Tarefas', 20, 20);
      doc.setFontSize(12);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 35);

      let yPosition = 50;

      tasks.forEach((task, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.text(`${index + 1}. ${task.empresa}`, 20, yPosition);
        yPosition += 10;

        doc.setFontSize(10);
        doc.text(`Técnico: ${task.tecnico}`, 25, yPosition); yPosition += 5;
        doc.text(`Data: ${task.data_hora}`, 25, yPosition); yPosition += 5;
        doc.text(`Status: ${getStatusText(task.status)}`, 25, yPosition); yPosition += 5;

        if (task.responsavel) {
          doc.text(`Responsável: ${task.responsavel}`, 25, yPosition); yPosition += 5;
        }

        if (task.tempo_sugerido) {
          doc.text(`Tempo Sugerido: ${task.tempo_sugerido}`, 25, yPosition); yPosition += 5;
        }

        if (task.tempo_executado) {
          doc.text(`Tempo Executado: ${task.tempo_executado}`, 25, yPosition); yPosition += 5;
        }

        const description = task.descricao.length > 80
          ? task.descricao.substring(0, 80) + '...'
          : task.descricao;
        doc.text(`Descrição: ${description}`, 25, yPosition); yPosition += 10;

        // Formulários relacionados à tarefa
        formularios.forEach(formulario => {
          formulario.respostas.forEach(resposta => {
            
            if (resposta.task_id == task.id) {
              doc.setFontSize(11);
              doc.text(`Formulário: ${formulario.titulo} (${resposta.respondido_em})`, 25, yPosition);
              yPosition += 6;

              resposta.perguntas.forEach(p => {
                if (yPosition > 250) {
                  doc.addPage();
                  yPosition = 20;
                }

                const pergunta = `• ${p.pergunta}`;
                const respostaTexto = `${p.resposta}`;

                doc.setFontSize(10);
                doc.text(pergunta, 30, yPosition);
                yPosition += 5;

                doc.setFont("helvetica", "italic");
                doc.text(respostaTexto, 35, yPosition);
                doc.setFont("helvetica", "normal");
                yPosition += 6;
              });

              yPosition += 5;
            }
          });
        });
      });

      doc.save(`relatorio-tarefas-${new Date().toISOString().split('T')[0]}.pdf`);
    })
    .catch(error => {
      console.error('Erro na consulta:', error);
    });
}


function getStatusText(status) {
  switch (status) {
    case 'em_andamento': return 'Em andamento';
    case 'concluida': return 'Concluída';
    case 'pendente': return 'Pendente';
    case 'cancelada': return 'Cancelada';
    default: return status;
  }
}

// Delete task
function deleteTask(taskId) {
  const confirmDelete = confirm("Tem certeza que deseja deletar esta tarefa? Esta ação não pode ser desfeita.");
  if (!confirmDelete) return; // Se o usuário cancelar, para aqui

  const idSelect = { id: taskId };
  fetch("https://step.tcbx.com.br/api/delete_task.php", {
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
        
}

function getActionText(action) {
  const actions = {
    'criado': 'Tarefa Criada',
    'inicio_translado': 'Iniciou Translado',
    'fim_translado': 'Encerrou Translado',
    'inicio_tarefa': 'Tarefa Iniciada',
    'pausa': 'Tarefa Pausada',
    'retomada': 'Tarefa Retomada',
    'conclusao_tarefa': 'Tarefa Concluída',
    'inicio_retorno': 'Iniciou Retorno',
    'fim_retorno': 'Encerrou Retorno',
    'finalizada': 'Tarefa Finalizada',
    
    // Aliases para compatibilidade
    'criada': 'Tarefa Criada',
    'iniciou_translado': 'Iniciou Translado',
    'encerrou_translado': 'Encerrou Translado',
    'iniciada': 'Tarefa Iniciada',
    'pausada': 'Tarefa Pausada',
    'concluida': 'Tarefa Concluída',
    'iniciou_retorno': 'Iniciou Retorno',
    'cancelada': 'Tarefa Cancelada'
  };
  
  return actions[action] || action.replace(/_/g, ' ');

  /*
  const actions = {
    'criada': 'Tarefa Criada',
    'iniciou_translado': 'Iniciou Translado',
    'encerrou_translado': 'Encerrou Translado',
    'iniciada': 'Tarefa Iniciada',
    'pausada': 'Tarefa Pausada',
    'retomada': 'Tarefa Retomada',
    'concluida': 'Tarefa Concluída',
    'iniciou_retorno': 'Iniciou Retorno',
    'finalizada': 'Tarefa Finalizada',
    'cancelada': 'Tarefa Cancelada'
  };
  return actions[action] || action;
  */
}

async function generatePerformanceCharts() {
  try {
<<<<<<< HEAD
    const response = await fetch("https://step.tcbx.com.br/api/get_performance_data.php");
=======
    const response = await fetch("https://localhost/EBEN/api/get_performance_data.php");
>>>>>>> 6ae232c7c61eb2224befb8c7dbf536cbeb0794d5
    const data = await response.json();
    console.log(data)

    if (data.error) {
      alert(data.error);
      return;
    }

    // Renderizar gráficos com os dados do backend
    renderChart(
      'taskCompletionChart',
<<<<<<< HEAD
      'Tarefas',
=======
      'Tarefas Concluídas',
>>>>>>> 6ae232c7c61eb2224befb8c7dbf536cbeb0794d5
      ['Concluídas', 'Pendentes'],
      [data.completedTasks, data.totalTasks - data.completedTasks]
    );

    renderChart(
      'timeAnalysisChart',
      'Tempo Médio (Horas)',
      ['Trabalho', 'Translado'],
      [data.avgWorkTime, data.avgTransitTime]
    );

  } catch (error) {
    alert('Erro ao carregar dados: ' + error.message);
  }

}

function calculateAverageTime(tasks, timeField) {
  console.log("chamou")
  const validTimes = tasks
    .map(task => task.report?.[timeField])
    .filter(time => time && time !== 'Informação não disponível');

  if (validTimes.length === 0) return 0;

  const totalMs = validTimes.reduce((sum, time) => {
    return sum + (HHMMSSToDecimal(time) * 3600 * 1000);
  }, 0);

  return (totalMs / validTimes.length) / (1000 * 3600);
}

function renderChart(canvasId, title, labels, data) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: title,
        data,
        backgroundColor: ['#4caf50', '#f44336'],
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: title }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return decimalToHHMM(value);
            }
          }
        }
      }
    }
  });
}

// Initialize charts on page load
document.addEventListener('DOMContentLoaded', generatePerformanceCharts);