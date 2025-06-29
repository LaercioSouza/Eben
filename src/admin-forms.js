//admin-forms.js
// Initialize application
document.addEventListener('DOMContentLoaded', function () {
  loadForms();
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  document.getElementById('btn-new-form').addEventListener('click', openNewFormModal);
  document.getElementById('createFormForm').addEventListener('submit', saveForm);
  document.getElementById('btn-add-question').addEventListener('click', addQuestion);

  // Event delegation for dynamic elements
  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('remove-question')) {
      removeQuestion(e.target);
    } else if (e.target.classList.contains('add-option')) {
      addOption(e.target);
    } else if (e.target.classList.contains('remove-option')) {
      removeOption(e.target);
    } else if (e.target.classList.contains('form-item')) {
      previewForm(e.target.dataset.formId);
    } else if (e.target.classList.contains('btn-edit-form')) {
      editForm(e.target.dataset.formId);
    } else if (e.target.classList.contains('btn-delete-form')) {
      deleteForm(e.target.dataset.formId);
    }
  });

  // Change event for question types
  document.addEventListener('change', function (e) {
    if (e.target.classList.contains('question-type')) {
      toggleOptionsContainer(e.target);
    }
  });
}

// Load and display forms
function loadForms() {
     fetch("https://localhost/EBEN/api/showallforms.php")
     .then(response => response.json())
     .then(forms => {
      
      const formsList = document.getElementById('forms-list');
        if (!forms.formularios || forms.formularios.length === 0) {
      formsList.innerHTML = `
        <div class="text-center py-4 text-muted">
          <p>Nenhum formulário criado</p>
        </div>
      `;
      return;
    }
    formsList.innerHTML = forms.formularios.map(form => `
      <div class="list-group-item form-item" data-form-id="${form.id}" style="cursor: pointer;">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-1">${form.titulo}</h6>
            <small class="text-muted">${form.descricao || 'Sem descrição'}</small>
            <br>
            <small class="text-muted">${form.criado_em}</small>
          </div>
          <div>
            <button class="btn btn-outline-primary btn-sm me-1 btn-edit-form" data-form-id="${form.id}">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-outline-danger btn-sm btn-delete-form" data-form-id="${form.id}">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');
  })
  .catch(error => {
    console.error('Erro ao carregar formularios:', error);
  });
}

// Open modal for new form
function openNewFormModal() {
  document.getElementById('formModalTitle').textContent = 'Criar Novo Formulário';
  document.getElementById('createFormForm').reset();
  document.getElementById('questions-container').innerHTML = '';
  delete document.getElementById('createFormForm').dataset.editingId;

  const modal = new bootstrap.Modal(document.getElementById('formModal'));
  modal.show();
}

// Add new question
function addQuestion() {
  const container = document.getElementById('questions-container');
  const template = document.getElementById('question-template');
  const questionElement = template.cloneNode(true);

  questionElement.id = '';
  questionElement.classList.remove('d-none');

  // Update question number
  const questionNumber = container.children.length + 1;
  questionElement.querySelector('.question-number').textContent = `Pergunta ${questionNumber}`;

  container.appendChild(questionElement);

  // Setup remove button
  questionElement.querySelector('.remove-question').addEventListener('click', function () {
    removeQuestion(this);
  });
}

// Remove question
function removeQuestion(button) {
  const questionItem = button.closest('.question-item');
  questionItem.remove();
  updateQuestionNumbers();
}

// Update question numbers after removal
function updateQuestionNumbers() {
  const questions = document.querySelectorAll('#questions-container .question-item');
  questions.forEach((question, index) => {
    question.querySelector('.question-number').textContent = `Pergunta ${index + 1}`;
  });
}

// Toggle options container based on question type
function toggleOptionsContainer(select) {
  const questionItem = select.closest('.question-item');
  const optionsContainer = questionItem.querySelector('.options-container');

  if (select.value === 'checkbox' || select.value === 'radio') {
    optionsContainer.classList.remove('d-none');
    // Add default options if none exist
    if (optionsContainer.querySelector('.options-list').children.length === 0) {
      addOption(optionsContainer.querySelector('.add-option'));
      addOption(optionsContainer.querySelector('.add-option'));
    }
  } else {
    optionsContainer.classList.add('d-none');
  }
}

// Add option to question
function addOption(button) {
  const optionsList = button.previousElementSibling;
  const optionDiv = document.createElement('div');
  optionDiv.className = 'input-group mb-2';
  optionDiv.innerHTML = `
    <input type="text" class="form-control option-text" placeholder="Digite a opção">
    <button class="btn btn-outline-danger remove-option" type="button">
      <i class="bi bi-trash"></i>
    </button>
  `;

  optionsList.appendChild(optionDiv);
}

// Remove option
function removeOption(button) {
  button.closest('.input-group').remove();
}

// Save form
function saveForm(e) {
  e.preventDefault();
  
  const formName = document.getElementById('formName').value;
  const formDescription = document.getElementById('formDescription').value;
  
  const questions = collectQuestions();
  const questoes = questions;
  
  
  if (questions.length === 0) {
    alert('Adicione pelo menos uma pergunta ao formulário.');
    return;
  }
  const id_form = document.getElementById('createFormForm').dataset.editingId || Date.now();
  questoes.forEach(question => {
  question.id_formulario = id_form;
});
  
  const formjson = {
    id: id_form,
    name: formName,
    description: formDescription,
    createdAt: new Date().toISOString()
  };
  fetch("https://localhost/EBEN/api/saveform.php", {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formjson)
})
.then(response => response.json())
.then(data => {
  console.log('Formulário salvo:', data);
  // Só agora, depois que o formulário foi salvo com sucesso, enviamos as questões:
  return fetch("https://localhost/EBEN/api/savequestions.php", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(questoes)
  });
})
.then(response => response.json())
.then(data => {
  console.log('Perguntas salvas:', data);
  if(data){
    loadForms();
    hidePreview();
    alert(`Formulário salvo com sucesso!`);
  }
})
.catch(error => {
  console.error('Erro ao enviar:', error);
});
  const modal = bootstrap.Modal.getInstance(document.getElementById('formModal'));
  modal.hide();
  
}

// Collect questions from form
function collectQuestions() {
  const questions = [];
  const questionItems = document.querySelectorAll('#questions-container .question-item');
  
  questionItems.forEach((item, index) => {
    const text = item.querySelector('.question-text').value;
    const type = item.querySelector('.question-type').value;
    const required = item.querySelector('.question-required').checked;
    
    if (!text.trim()) return;
    
    const question = {
      id: index + 1,
      text: text,
      type: type,
      required: required
    };
    
    // Collect options if applicable
    if (type === 'checkbox' || type === 'radio') {
      const options = [];
      const optionInputs = item.querySelectorAll('.option-text');
      optionInputs.forEach(input => {
        if (input.value.trim()) {
          options.push(input.value.trim());
        }
      });
      question.options = options;
    }
    
    questions.push(question);
  });

  

  
  return questions;
}

// Preview form
function previewForm(formId) {
  const idSelect = { id: formId };
fetch("https://localhost/EBEN/api/showformdescription.php", {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(idSelect)
})
.then(response => response.json())
.then(data => {
  console.log('Resposta do servidor:', data);

  if (!data) return;

  const previewContainer = document.getElementById('form-preview');
  const previewContent = document.getElementById('preview-content');

  let html = `<h5>${data.titulo_formulario}</h5>`;
  if (data.descricao_formulario) {
    html += `<p class="text-muted">${data.descricao_formulario}</p>`;
  }

  data.perguntas.forEach(question => {
    html += `<div class="mb-3">`;
    html += `<label class="form-label">${question.texto} ${question.obrigatoria === "1" ? '<span class="text-danger">*</span>' : ''}</label>`;

    switch (question.tipo) {
      case 'text':
        html += `<input type="text" class="form-control" disabled>`;
        break;
      case 'textarea':
        html += `<textarea class="form-control" rows="3" disabled></textarea>`;
        break;
      case 'checkbox':
        question.alternativas.forEach(option => {
          html += `
            <div class="form-check">
              <input class="form-check-input" type="checkbox" disabled>
              <label class="form-check-label">${option.texto_alternative}</label>
            </div>
          `;
        });
        break;
      case 'radio':
        question.alternativas.forEach(option => {
          html += `
            <div class="form-check">
              <input class="form-check-input" type="radio" name="preview_q${question.id_pergunta}" disabled>
              <label class="form-check-label">${option.texto_alternative}</label>
            </div>
          `;
        });
        break;
    }

    html += `</div>`;
  });

  previewContent.innerHTML = html;
  previewContainer.classList.remove('d-none');
})
.catch(error => {
  console.error('Erro na consulta:', error);
});
  
}

// Hide preview
function hidePreview() {
  document.getElementById('form-preview').classList.add('d-none');
}

// Edit form
function editForm(formId) {
  const form = window.dataService.getById(window.dataService.DATA_TYPES.FORMS, parseInt(formId));
  if (!form) return;

  // Fill form data
  document.getElementById('formName').value = form.name;
  document.getElementById('formDescription').value = form.description || '';
  document.getElementById('createFormForm').dataset.editingId = formId;

  // Clear and add questions
  const container = document.getElementById('questions-container');
  container.innerHTML = '';

  form.questions.forEach(question => {
    addQuestion();
    const questionItem = container.lastElementChild;

    questionItem.querySelector('.question-text').value = question.text;
    questionItem.querySelector('.question-type').value = question.type;
    questionItem.querySelector('.question-required').checked = question.required;

    // Handle options
    if (question.options && (question.type === 'checkbox' || question.type === 'radio')) {
      toggleOptionsContainer(questionItem.querySelector('.question-type'));
      const optionsList = questionItem.querySelector('.options-list');
      optionsList.innerHTML = '';

      question.options.forEach(option => {
        addOption(questionItem.querySelector('.add-option'));
        const lastOption = optionsList.lastElementChild;
        lastOption.querySelector('.option-text').value = option;
      });
    }
  });

  document.getElementById('formModalTitle').textContent = 'Editar Formulário';

  const modal = new bootstrap.Modal(document.getElementById('formModal'));
  modal.show();
}

// Delete form
function deleteForm(formId) {
  const confirmDelete = confirm("Tem certeza que deseja deletar este formulário? Esta ação não pode ser desfeita.");
  if (!confirmDelete) return; // Se o usuário cancelar, para aqui

  const idSelect = { id: formId };
  fetch("https://localhost/EBEN/api/delete_form.php", {
         method: 'POST',
         headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify(idSelect)
        })
       .then(response => response.json())
       .then(data => {
        console.log('Resposta do servidor:', data);
        loadForms();
        hidePreview();
        })
        .catch(error => {
        console.error('Erro ao enviar:', error);
});


}
