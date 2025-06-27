//user-form-HandPlatter.js
// Form handling for user tasks
function showTaskFormModal(taskId, formularioId) {
    console.log('Opening form modal for task:', taskId);

  // Se a tarefa não tem formulário, redireciona para observações
  if (!formularioId) {
    console.log('No form found for task:', taskId);
    showObservationsModal((observations) => {
      if (observations !== null) {
        getCurrentLocation((coords) => {
          completeTaskDirectly(taskId, coords, observations);
        });
      }
    });
    return;
  }

  // Buscar os dados do formulário no backend
  fetch("https://localhost/EBEN/api/showformdescription.php", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: formularioId })
  })
    .then(response => response.json())
    .then(form => {
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
    })
    .catch(error => {
      console.error('Erro ao carregar o formulário:', error);
      alert('Erro ao carregar o formulário. Tente novamente.');
    });
}

// Main function to handle task completion - this should be called from user.js
function completeTaskWithForm(taskId) {
    console.log('Starting task completion with form check for task:', taskId);

  // Buscar dados da tarefa via backend
  fetch("https://localhost/EBEN/api/buscar-tarefa.php", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: taskId })
  })
    .then(response => response.json())
    .then(task => {
      if (!task) {
        console.log('Task not found:', taskId);
        showToast('Tarefa não encontrada!', 'danger');
        return;
      }

      /*
      if (task.status !== 'em_andamento') {
        showToast('O formulário já foi respondido ou esta etapa já foi concluída.', 'warning');
        return;
      }
      */

      if (task.formularioId) {
        console.log('Form found, showing form modal:', task.formularioId);
        showTaskFormModal(taskId, task.formularioId);
      } else {
        // Se não tiver formulário, mostrar observações direto
        showObservationsModal((observations) => {
          if (observations !== null) {
            getCurrentLocation((coords) => {
              completeTaskDirectly(taskId, coords, observations);
            });
          }
        });
      }
    })
    .catch(error => {
      console.error('Erro ao buscar a tarefa:', error);
      showToast('Erro ao buscar os dados da tarefa.', 'danger');
    });
}

function loadUserTasks() {
  if (!currentUserId) return;

  const allTasks = window.dataService.getAll(window.dataService.DATA_TYPES.TASKS);
  const userTasks = allTasks.filter(task =>
    task.colaboradorId === currentUserId &&
    task.status !== 'concluida'
  );

  const taskList = document.getElementById('task-list');
  taskList.innerHTML = '';

  if (userTasks.length === 0) {
    taskList.innerHTML = `
      <div class="text-center py-4 text-muted">
        <p>Nenhuma tarefa ativa no momento</p>
      </div>
    `;
    return;
  }

  // Código de renderização das tarefas...
  userTasks.forEach(task => {
    const taskElement = document.createElement('div');
    taskElement.className = 'list-group-item task-item';
    taskElement.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h6 class="mb-1">${task.empresaNome}</h6>
          <small class="text-muted">${task.data} às ${task.hora}</small>
        </div>
        <span class="badge ${getStatusBadgeClass(task.status)}">${getStatusText(task.status)}</span>
      </div>
    `;
    taskList.appendChild(taskElement);
  });

  // Atualizar marcadores do mapa
  updateMapMarkers();
}

function completeTaskDirectly(taskId, coordinates, observations = 'Tarefa finalizada sem observações adicionais') {
  console.log('Completing task directly:', taskId, 'with observations:', observations);
  // Complete the task without form
  const updatedTask = window.dataService.updateTaskStatus(
    taskId,
    'aguardando_retorno',
    coordinates,
    observations
  );
  if (updatedTask) {
    showToast('Tarefa finalizada com sucesso!', 'success');
    loadUserTasks();
    updateMapMarkers();
  }
}

function getCurrentLocation(callback) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        const coords = `${position.coords.longitude},${position.coords.latitude}`;
        callback(coords);
      },
      function (error) {
        console.error('Error getting location:', error);
        // Use default coordinates (Parnaíba, PI)
        callback('-41.7734,-2.9055');
      }
    );
  } else {
    console.log('Geolocation is not supported by this browser.');
    // Use default coordinates
    callback('-41.7734,-2.9055');
  }
}

function showObservationsModal(callback, title = 'Observações Finais', placeholder = 'Descreva como foi a execução da tarefa, problemas encontrados, etc.') {
  const modalHtml = `
    <div class="modal fade" id="observationsModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title">${title}</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="observations" class="form-label">Observações:</label>
              <textarea class="form-control" id="observations" rows="4" placeholder="${placeholder}"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-success" id="saveObservations">Salvar</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove existing modal if any
  const existingModal = document.getElementById('observationsModal');
  if (existingModal) {
    existingModal.remove();
  }

  // Add modal to page
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Show modal
  const modal = new bootstrap.Modal(document.getElementById('observationsModal'));
  modal.show();

  // Handle save button
  document.getElementById('saveObservations').addEventListener('click', function () {
    const observations = document.getElementById('observations').value;
    modal.hide();
    callback(observations);
  });

  // Handle modal close
  document.getElementById('observationsModal').addEventListener('hidden.bs.modal', function () {
    callback(null);
  });
}

function showPauseReasonModal(callback) {
  showObservationsModal(callback, 'Motivo da Pausa', 'Descreva o motivo da pausa na execução da tarefa...');
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

  form.questions.forEach(question => {
    const fieldName = `question_${question.id}`;
    let answer = null;

    switch (question.type) {
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

    // Validação de campos obrigatórios
    if (question.required) {
      if (!answer || (Array.isArray(answer) && answer.length === 0)) {
        alert(`Por favor, responda a pergunta obrigatória: ${question.text}`);
        validationError = true;
        return;
      }
    }

    answers.push({
      questionId: question.id,
      questionText: question.text,
      questionType: question.type,
      answer: answer
    });
  });

  if (validationError) return;

  // Atualizar a tarefa com as respostas e mudar status
  const task = window.dataService.getById(window.dataService.DATA_TYPES.TASKS, taskId);
  if (task) {
    const updates = {
      status: 'aguardando_retorno', // Alterado de 'concluida'
      formularioResposta: {
        formId: form.id,
        formName: form.name,
        answers: answers,
        completedAt: new Date().toISOString()
      },
      coordinates: task.coordinates
    };

    window.dataService.update(window.dataService.DATA_TYPES.TASKS, taskId, updates);

    // Fechar e remover modal completamente
    modal.hide();
    document.getElementById('taskFormModal').remove();

    // Fechar modal de detalhes da tarefa e atualizar interface
    const taskDetailModal = bootstrap.Modal.getInstance(document.getElementById('taskDetailModal'));
    if (taskDetailModal) taskDetailModal.hide();

    // Atualizar interface
    showToast('Tarefa concluída com sucesso!', 'success');
    if (typeof loadTaskList === 'function') {
      loadTaskList();
    } else if (typeof loadUserTasks === 'function') {
      loadUserTasks();
    }
    if (typeof updateMapMarkers === 'function') updateMapMarkers();
  }
}

function showToast(message, type) {
  // Simple toast implementation
  const toast = document.createElement('div');
  toast.className = `alert alert-${type === 'success' ? 'success' : 'danger'} position-fixed`;
  toast.style.top = '20px';
  toast.style.right = '20px';
  toast.style.zIndex = '9999';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Export functions to global scope for use in user.js
window.taskFormHandler = {
  showTaskFormModal,
  completeTaskWithForm,
  showPauseReasonModal
};

function cleanupAfterSubmission() {
  // Remover modais residuais
  const modals = ['taskFormModal', 'observationsModal'];
  modals.forEach(modalId => {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      if (modalInstance) {
        modalInstance.hide();
        modalInstance.dispose();
      }
      modalElement.remove();
    }
  });

  // Forçar atualização da interface
  loadUserTasks();
  const taskDetailModal = bootstrap.Modal.getInstance(document.getElementById('taskDetailModal'));
  if (taskDetailModal) taskDetailModal.hide();
}