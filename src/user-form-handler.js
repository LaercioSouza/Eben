
// Form handling for user tasks
function showTaskFormModal(taskId) {
  console.log('Opening form modal for task:', taskId);
  const task = window.dataService.getById(window.dataService.DATA_TYPES.TASKS, taskId);
  if (!task || !task.formularioId) {
    console.log('No task or form found for task:', taskId);
    // If no form, show observations modal instead
    showObservationsModal((observations) => {
      if (observations !== null) {
        getCurrentLocation((coords) => {
          completeTaskDirectly(taskId, coords, observations);
        });
      }
    });
    return;
  }
  
  const form = window.dataService.getById(window.dataService.DATA_TYPES.FORMS, task.formularioId);
  if (!form) {
    console.log('Form not found:', task.formularioId);
    // If form not found, show observations modal instead
    showObservationsModal((observations) => {
      if (observations !== null) {
        getCurrentLocation((coords) => {
          completeTaskDirectly(taskId, coords, observations);
        });
      }
    });
    return;
  }
  
  // Create modal HTML
  const modalHtml = `
    <div class="modal fade" id="taskFormModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title">Formulário: ${form.name}</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info">
              <strong>Atenção:</strong> Este formulário deve ser preenchido antes de finalizar a tarefa.
            </div>
            ${form.description ? `<p class="text-muted">${form.description}</p>` : ''}
            <form id="taskFormAnswers">
              ${generateFormQuestions(form.questions, taskId)}
              <div class="d-grid mt-4">
                <button type="submit" class="btn btn-success">Finalizar Tarefa</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Remove existing modal if any
  const existingModal = document.getElementById('taskFormModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Add modal to page
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // Show modal
  const modal = new bootstrap.Modal(document.getElementById('taskFormModal'));
  modal.show();
  
  // Handle form submission
  document.getElementById('taskFormAnswers').addEventListener('submit', function(e) {
    e.preventDefault();
    saveTaskFormAnswers(taskId, form, modal);
  });
}

// Main function to handle task completion - this should be called from user.js
function completeTaskWithForm(taskId) {
  console.log('Starting task completion with form check for task:', taskId);
  const task = window.dataService.getById(window.dataService.DATA_TYPES.TASKS, taskId);
  if (!task) {
    console.log('Task not found:', taskId);
    return;
  }
  
  // Check if task has a form that needs to be filled
  if (task.formularioId) {
    const form = window.dataService.getById(window.dataService.DATA_TYPES.FORMS, task.formularioId);
    if (form) {
      console.log('Form found, showing form modal:', form.name);
      showTaskFormModal(taskId);
      return;
    }
  }
  
  // If no form, show observations modal
  console.log('No form found, showing observations modal');
  showObservationsModal((observations) => {
    if (observations !== null) {
      getCurrentLocation((coords) => {
        completeTaskDirectly(taskId, coords, observations);
      });
    }
  });
}

function completeTaskDirectly(taskId, coordinates, observations = 'Tarefa finalizada sem observações adicionais') {
  console.log('Completing task directly:', taskId, 'with observations:', observations);
  // Complete the task without form
  const updatedTask = window.dataService.completeTask(taskId, coordinates, observations);
  if (updatedTask) {
    showToast('Tarefa finalizada com sucesso!', 'success');
    loadUserTasks();
    updateMapMarkers();
  }
}

function getCurrentLocation(callback) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function(position) {
        const coords = `${position.coords.longitude},${position.coords.latitude}`;
        callback(coords);
      },
      function(error) {
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
  document.getElementById('saveObservations').addEventListener('click', function() {
    const observations = document.getElementById('observations').value;
    modal.hide();
    callback(observations);
  });
  
  // Handle modal close
  document.getElementById('observationsModal').addEventListener('hidden.bs.modal', function() {
    callback(null);
  });
}

function showPauseReasonModal(callback) {
  showObservationsModal(callback, 'Motivo da Pausa', 'Descreva o motivo da pausa na execução da tarefa...');
}

function generateFormQuestions(questions, taskId) {
  return questions.map(question => {
    let html = `<div class="mb-3">`;
    html += `<label class="form-label">${question.text} ${question.required ? '<span class="text-danger">*</span>' : ''}</label>`;
    
    const fieldName = `question_${question.id}`;
    
    switch (question.type) {
      case 'text':
        html += `<input type="text" class="form-control" name="${fieldName}" ${question.required ? 'required' : ''}>`;
        break;
      case 'textarea':
        html += `<textarea class="form-control" name="${fieldName}" rows="3" ${question.required ? 'required' : ''}></textarea>`;
        break;
      case 'checkbox':
        question.options.forEach((option, index) => {
          html += `
            <div class="form-check">
              <input class="form-check-input" type="checkbox" name="${fieldName}" value="${option}" id="${fieldName}_${index}">
              <label class="form-check-label" for="${fieldName}_${index}">${option}</label>
            </div>
          `;
        });
        break;
      case 'radio':
        question.options.forEach((option, index) => {
          html += `
            <div class="form-check">
              <input class="form-check-input" type="radio" name="${fieldName}" value="${option}" id="${fieldName}_${index}" ${question.required ? 'required' : ''}>
              <label class="form-check-label" for="${fieldName}_${index}">${option}</label>
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
    
    // Validate required fields
    if (question.required && (!answer || (Array.isArray(answer) && answer.length === 0))) {
      alert(`Por favor, responda a pergunta obrigatória: ${question.text}`);
      return false;
    }
    
    answers.push({
      questionId: question.id,
      questionText: question.text,
      questionType: question.type,
      answer: answer
    });
  });
  
  // Save answers to task
  const task = window.dataService.getById(window.dataService.DATA_TYPES.TASKS, taskId);
  if (task) {
    const updates = {
      formularioResposta: {
        formId: form.id,
        formName: form.name,
        answers: answers,
        completedAt: new Date().toISOString()
      }
    };
    
    window.dataService.update(window.dataService.DATA_TYPES.TASKS, taskId, updates);
    
    // Close modal
    modal.hide();
    
    showToast('Formulário respondido com sucesso!', 'success');
    
    // Now complete the task
    getCurrentLocation((coords) => {
      const updatedTask = window.dataService.completeTask(taskId, coords, 'Tarefa finalizada com formulário respondido');
      if (updatedTask) {
        showToast('Tarefa finalizada com sucesso!', 'success');
        loadUserTasks();
        updateMapMarkers();
      }
    });
  }
  
  return true;
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
