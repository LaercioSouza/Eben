//admin-forms.js
// Initialize application
document.addEventListener('DOMContentLoaded', function () {
  loadForms();
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  document.getElementById('btn-new-form').addEventListener('click', openNewFormModal);
  document.getElementById('createFormForm').addEventListener('submit', handleFormSubmit);
  document.getElementById('btn-add-question').addEventListener('click', addQuestion);

  // Event delegation for dynamic elements - CORRIGIDO
  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('remove-question')) {
      removeQuestion(e.target);
    } else if (e.target.classList.contains('add-option')) {
      addOption(e.target);
    } else if (e.target.classList.contains('remove-option')) {
      removeOption(e.target);
    }

    // Verifica se o clique foi em qualquer parte do item do formulário - CORREÇÃO
    const formItem = e.target.closest('.form-item');
    if (formItem) {
      previewForm(formItem.dataset.formId);
    }

    // Verifica se o clique foi no botão de editar (ou em seus filhos) - CORREÇÃO
    const editBtn = e.target.closest('.btn-edit-form');
    if (editBtn) {
      editForm(editBtn.dataset.formId);
    }

    // Verifica se o clique foi no botão de deletar (ou em seus filhos) - CORREÇÃO
    const deleteBtn = e.target.closest('.btn-delete-form');
    if (deleteBtn) {
      deleteForm(deleteBtn.dataset.formId);
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
// Função para abrir o modal em modo de criação
function openNewFormModal() {
  // Limpa o formulário
  document.getElementById('createFormForm').reset();
  document.getElementById('questions-container').innerHTML = '';
  delete document.getElementById('createFormForm').dataset.editingId;
  
  // Configura como modo criação
  document.getElementById('formModalTitle').textContent = 'Criar Novo Formulário';
  const submitButton = document.getElementById('submitFormButton');
  submitButton.textContent = 'Salvar Formulário';
   
  const modal = new bootstrap.Modal(document.getElementById('formModal'));
  modal.show();
}
/*
function openNewFormModal() {
  document.getElementById('formModalTitle').textContent = 'Criar Novo Formulário';
  document.getElementById('createFormForm').reset();
  document.getElementById('questions-container').innerHTML = '';
  delete document.getElementById('createFormForm').dataset.editingId;

  const modal = new bootstrap.Modal(document.getElementById('formModal'));
  modal.show();
  openCreateModal();
}
*/

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
function openCreateModal() {
  // ... (código existente para limpar o formulário)
  
  // Restaura o botão para "Salvar"
  const submitButton = document.getElementById('submitFormButton');
  submitButton.textContent = 'Salvar';
  submitButton.classList.remove('btn-warning');
  submitButton.classList.add('btn-primary');
}


// Save form
function saveForm() {
  console.log("ta vindo pra salvar")

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
   const questionId = item.dataset.questionId; // Captura o ID da pergunta
    
    if (!text.trim()) return;
    
    const question = {
      id: questionId, // Inclui o ID se existir
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

async function fetchFormData(formId) {
  try {
    const response = await fetch("https://localhost/EBEN/api/showformdescription.php", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: formId })
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar formulário');
    }
    return await response.json();
  } catch (error) {
    console.error('Erro:', error);
    alert('Falha ao carregar formulário');
    return null;
  }
}

// Edit form
async function editForm(formId) {
  // Busca os dados do formulário no banco de dados
  const formData = await fetchFormData(formId);
  console.log("Editando formulário ID:", formId);
  
  if (!formData) return;

  // Mapeia os dados
  const form = {
    name: formData.titulo_formulario,
    description: formData.descricao_formulario,
    questions: formData.perguntas.map(pergunta => ({
      id: pergunta.id_pergunta,
      text: pergunta.texto,
      type: pergunta.tipo,
      required: pergunta.obrigatoria === 1,
      options: pergunta.alternativas?.map(alt => alt.texto_alternative) || []
    }))
  };

  // Preenche os dados do formulário
  document.getElementById('formName').value = form.name;
  document.getElementById('formDescription').value = form.description || '';
  document.getElementById('createFormForm').dataset.editingId = formId;

  // Limpa e adiciona perguntas
  const container = document.getElementById('questions-container');
  container.innerHTML = '';

  form.questions.forEach(question => {
    addQuestion();
    const questionItem = container.lastElementChild;

    // Preenche dados básicos da pergunta
    questionItem.querySelector('.question-text').value = question.text;
    questionItem.querySelector('.question-type').value = question.type;
    questionItem.querySelector('.question-required').checked = question.required;
    
    // Armazena ID para atualização (convertendo para string)
    questionItem.dataset.questionId = question.id.toString();

    // Manipula opções
    if (question.options.length > 0 && (question.type === 'checkbox' || question.type === 'radio')) {
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

  // Configura como modo edição
  document.getElementById('formModalTitle').textContent = 'Editar Formulário';
  const submitButton = document.getElementById('submitFormButton');
  submitButton.textContent = 'Atualizar Formulário';
  submitButton.classList.replace('btn-primary', 'btn-success');
  
  // Abre o modal
  const modal = new bootstrap.Modal(document.getElementById('formModal'));
  modal.show();
}

async function updateForm(formId) {
  const formName = document.getElementById('formName').value;
  const formDescription = document.getElementById('formDescription').value;
  const questions = collectQuestions();

  if (questions.length === 0) {
    alert('Adicione pelo menos uma pergunta ao formulário.');
    return false;
  }

  // Estrutura os dados no formato esperado pelo back-end
  const formData = {
    id_formulario: parseInt(formId),
    titulo_formulario: formName,
    descricao_formulario: formDescription || '',
    perguntas: questions.map(question => ({
      id_pergunta: question.id ? parseInt(question.id) : null,
      texto: question.text,
      tipo: question.type,
      obrigatoria: question.required,
      alternativas: (question.options || []).map(option => ({
        texto_alternative: option
      }))
    }))
  };

  try {
    const response = await fetch("https://localhost/EBEN/api/updateform.php", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await response.json();
    
    if (data.status === 'sucesso') {
      loadForms();
      hidePreview();
      alert('Formulário atualizado com sucesso!');
      return true;
    } else {
      alert('Erro ao atualizar formulário: ' + (data.mensagem || 'Erro desconhecido'));
      return false;
    }
  } catch (error) {
    console.error('Erro ao atualizar:', error);
    alert('Falha na conexão ao atualizar formulário');
    return false;
  }
}

// Função de submit unificada
async function handleFormSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const isEditMode = !!form.dataset.editingId;
  
  if (isEditMode) {
    await updateForm(form.dataset.editingId);
  } else {
    await saveForm();
  }
  
  // Fecha o modal após a operação
  const modal = bootstrap.Modal.getInstance(document.getElementById('formModal'));
  modal.hide();
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