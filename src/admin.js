//admin.js
// Integrate with data service
document.addEventListener('DOMContentLoaded', function () {
  // Initialize data from the data service
  initApp();
});

// Global variables for maps
let map, marker, companyMap, companyMarker;

// Initialize the application
function initApp() {
  // Initialize map
  initMap();
  setTodayAsDefault();

  // Add event listeners
  document.getElementById('taskForm').addEventListener('submit', saveTask);

  // Load companies, employees, and forms
  loadCompanies();
  loadEmployees();
  loadForms();

  // Company change event
  document.getElementById('empresa').addEventListener('change', loadSubsidiaries);
}

// Initialize the map with Leaflet
function initMap() {
  // Coordenadas de Parnaíba, PI
  const initialLat = -2.9055;
  const initialLng = -41.7734;

  // Criar o mapa
  map = L.map('map').setView([initialLat, initialLng], 13);

  // Adicionar camada de mapa do OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // Adicionar marcador arrastável com ícone maior
  const largeIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  marker = L.marker([initialLat, initialLng], {
    draggable: true,
    icon: largeIcon
  }).addTo(map);

  // Atualizar coordenadas quando marcador for movido
  marker.on('dragend', updateCoordinates);

  // Permitir clique no mapa para mover o marcador
  map.on('click', function (e) {
    marker.setLatLng(e.latlng);
    updateCoordinates();
  });

  // Definir coordenadas iniciais
  updateCoordinates();
}

// Initialize company location map
function initCompanyMap() {
  // Coordenadas de Parnaíba, PI
  const initialLat = -2.9055;
  const initialLng = -41.7734;

  // Clear existing map if any
  if (companyMap) {
    companyMap.remove();
  }

  // Criar o mapa
  companyMap = L.map('company-map').setView([initialLat, initialLng], 13);

  // Adicionar camada de mapa do OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(companyMap);

  // Adicionar marcador arrastável com ícone maior
  const largeIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  companyMarker = L.marker([initialLat, initialLng], {
    draggable: true,
    icon: largeIcon
  }).addTo(companyMap);

  // Atualizar coordenadas quando marcador for movido
  companyMarker.on('dragend', updateCompanyCoordinates);

  // Permitir clique no mapa para mover o marcador
  companyMap.on('click', function (e) {
    companyMarker.setLatLng(e.latlng);
    updateCompanyCoordinates();
  });

  // Definir coordenadas iniciais
  updateCompanyCoordinates();

  // Force map resize after modal is shown
  setTimeout(() => {
    companyMap.invalidateSize();
  }, 300);
}

// Update company coordinates function
function updateCompanyCoordinates() {
  const latLng = companyMarker.getLatLng();
  document.getElementById('companyCoordinates').value = `${latLng.lng},${latLng.lat}`;
}

// Update coordinates function
function updateCoordinates() {
  const latLng = marker.getLatLng();
  document.getElementById('coordinates').value = `${latLng.lng},${latLng.lat}`;
}

// Set today as default date
function setTodayAsDefault() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;
  document.getElementById('data').value = formattedDate;
}

// Load companies from data service
function loadCompanies() {

   //const empresaSelect = document.getElementById('empresa');
  const empresaSelect = document.getElementById('empresa');

 
  fetch("https://localhost/EBEN/api/listcompanies.php")
    .then(response => response.json())
    .then(empresas => {
      const select = document.getElementById('empresa');

      empresas.forEach(empresa => {
        const option = document.createElement('option');
        option.value = empresa.id;
      
        // Exibir: nome - cnpj - endereço - telefone
        option.textContent = `${empresa.nome} - ${empresa.cnpj} - ${empresa.endereco} - ${empresa.telefone}`;
        // console.log(option.textContent = `${empresa.nome} - ${empresa.cnpj} - ${empresa.endereco} - ${empresa.telefone}`);

        select.innerHTML = '<option value="">Selecione uma empresa</option>';
        
    empresas.filter(empresa => !empresa.parentId).forEach(empresa => {
    const option = document.createElement('option');
    option.value = empresa.id;
    
    // Create detailed display text
    let displayText = empresa.nome;
    if (empresa.cnpj) {
      displayText += ` (CNPJ: ${empresa.cnpj})`;
    }
    if (empresa.endereco) {
      displayText += ` - ${empresa.endereco}`;
    }
    
    option.textContent = displayText;
    option.title = `${empresa.nome}\nCNPJ: ${empresa.cnpj || 'Não informado'}\nEndereço: ${empresa.endereco || 'Não informado'}\nTelefone: ${empresa.telefone || 'Não informado'}`;
    select.appendChild(option);
  });

        
      });
    })
    .catch(error => {
      console.error('Erro ao carregar empresas:', error);
    });

    toggleSubsidiaryField(false);
  
}

// Load subsidiaries
function loadSubsidiaries() {
  const empresaId = document.getElementById('empresa').value;

  if (!empresaId) {
    toggleSubsidiaryField(false);
    return;
  }

  // Get companies from data service
  const companies = window.dataService.getAll(window.dataService.DATA_TYPES.COMPANIES);

  // Find subsidiaries of selected company
  const subsidiaries = companies.filter(company => company.parentId === parseInt(empresaId));

  if (subsidiaries.length === 0) {
    toggleSubsidiaryField(false);
    return;
  }

  // Show the field and populate with subsidiaries
  toggleSubsidiaryField(true);

  const subsidiarySelect = document.getElementById('subsidiary');

  // Clear current options
  subsidiarySelect.innerHTML = '<option value="">Selecione uma filial (opcional)</option>';

  // Add subsidiaries with detailed information
  subsidiaries.forEach(subsidiary => {
    const option = document.createElement('option');
    option.value = subsidiary.id;

    let displayText = subsidiary.nome;
    if (subsidiary.cnpj) {
      displayText += ` (CNPJ: ${subsidiary.cnpj})`;
    }
    if (subsidiary.endereco) {
      displayText += ` - ${subsidiary.endereco}`;
    }

    option.textContent = displayText;
    option.title = `${subsidiary.nome}\nCNPJ: ${subsidiary.cnpj || 'Não informado'}\nEndereço: ${subsidiary.endereco || 'Não informado'}\nTelefone: ${subsidiary.telefone || 'Não informado'}`;
    subsidiarySelect.appendChild(option);
  });
}

// Toggle subsidiary field visibility
function toggleSubsidiaryField(show) {
  const subsidiaryContainer = document.getElementById('subsidiary-container');
  if (show) {
    subsidiaryContainer.classList.remove('d-none');
  } else {
    subsidiaryContainer.classList.add('d-none');
    if (document.getElementById('subsidiary')) {
      document.getElementById('subsidiary').value = '';
    }
  }
}

// Load employees from data service
function loadEmployees() {
    fetch("https://localhost/EBEN/api/listemploye.php")
    .then(response => response.json())
    .then(funcionarios => {
    const select = document.getElementById('colaborador');
     funcionarios.forEach(func => {
        const option = document.createElement('option');
        option.value = func.id;
        option.textContent = `${func.nome}`;
        select.innerHTML = '<option value="">Selecione um técnico</option>';

        funcionarios.filter(func => !func.parentId).forEach(func => {
        const option = document.createElement('option');
        option.value = func.id;
        option.textContent = func.nome;
        select.appendChild(option);
        })

      });
    })
    .catch(error => {
      console.error('Erro ao carregar funcionários:', error)
    });
}

// Load forms from data service
function loadForms() {
  fetch("https://localhost/EBEN/api/showallforms.php")
  .then(response => response.json())
  .then(data => {
    const formularioSelect = document.getElementById('formulario');
    if (!formularioSelect) return;

    // Limpa opções anteriores
    formularioSelect.innerHTML = '<option value="">Nenhum formulário</option>';

    // Adiciona os formulários recebidos
    data.formularios.forEach(form => {
      const option = document.createElement('option');
      option.value = form.id;
      option.textContent = form.titulo;
      formularioSelect.appendChild(option);
    });
  })
  .catch(error => {
    console.error('Erro ao carregar formulários:', error);
  });

}

function decimalHoursToHHMMSS(decimal) {
  const totalSeconds = Math.round(decimal * 3600);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Save task using data service
function saveTask(e) {
  e.preventDefault();

  // Get form values
  const empresa = document.getElementById('empresa').value;
  const subsidiary = document.getElementById('subsidiary')?.value || null;
  const colaborador = document.getElementById('colaborador').value;
  const responsavel = document.getElementById('responsavel').value || '';
  const data = document.getElementById('data').value;
  const hora = document.getElementById('hora').value;
  const tempoSugerido = document.getElementById('tempoSugerido').value || null;
  const descricao = document.getElementById('descricao').value;
  const coordinates = document.getElementById('coordinates').value;
  const formulario = document.getElementById('formulario').value || null;
  if (!empresa || !colaborador) {
    alert('Por favor, selecione uma empresa e um técnico válidos');
    return;
  }
   const task = {
    id: Date.now(),
    empresaid: empresa,
    subsidiaria: subsidiary,
    colaboradorid: colaborador,
    responsavel: responsavel,
    tempoSugerido: tempoSugerido ? decimalHoursToHHMMSS(parseFloat(tempoSugerido)) : null,
    data: data,
    hora: hora,
    descricao: descricao,
    coordinates: coordinates,
    formularioNome: formulario,
    formularioResposta: null, // Will be filled when technician completes the form
    status: 'pendente', // initial status
    history: [
      {
        timestamp: new Date().toISOString(),
        action: 'criada',
        coordinates: coordinates
      }
    ],
    createdAt: new Date().toISOString()
  };

  fetch('https://localhost/EBEN/api/savetask.php', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(task)
})
.then(response => response.json())
.then(data => {
  console.log('resposta do servidor:', data);
  if(data){
    alert(`tarefa salva com sucesso!`);
  }
  
})
.catch(error => {
  console.error('Erro:', error);
});
 
  this.reset();
  setTodayAsDefault();
  
  // Reload dropdowns to ensure they are populated
  loadCompanies();
  loadEmployees();
  loadForms();
  
  // Hide subsidiary field
  toggleSubsidiaryField(false);
  
  // Recenter map marker
  const center = map.getCenter();
  marker.setLatLng(center);
  updateCoordinates();
}

// Save company using data service
function saveCompany(e) {
  e.preventDefault();
  const companyName = document.getElementById('companyName').value;
  const companyCnpj = document.getElementById('companyCnpj').value;
  const companyAddress = document.getElementById('companyAddress').value;
  const companyPhone = document.getElementById('companyPhone').value;
  const parentCompanyId = document.getElementById('parentCompany').value || null;
  const companyCoordinates = document.getElementById('companyCoordinates')?.value || null;
  // Create company object
  const company = {
    id: Date.now(),
    nome: companyName,
    cnpj: companyCnpj,
    endereco: companyAddress,
    telefone: companyPhone,
    coordinates: companyCoordinates,
    parentId: parentCompanyId ? parseInt(parentCompanyId) : null,
    createdAt: new Date().toISOString()
  };
    fetch("https://localhost/EBEN/api/config.php", {
         method: 'POST',
         headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify(company)
})
       .then(response => response.json())
       .then(data => {
        console.log('Resposta do servidor:', data);
        
      })
.catch(error => {
  console.error('Erro ao enviar:', error);
});

  // Show success message
  if (parentCompanyId) {
    const companies = window.dataService.getAll(window.dataService.DATA_TYPES.COMPANIES);
    const parentCompany = companies.find(c => c.id === parseInt(parentCompanyId));
    alert(`Filial ${companyName} cadastrada com sucesso para ${parentCompany.nome}!`);
  } else {
    alert(`Empresa ${companyName} cadastrada com sucesso!`);
  }
  
  // Reset form
  document.getElementById('companyForm').reset();
  
  // Close modal
  const modal = bootstrap.Modal.getInstance(document.getElementById('companyModal'));
  if (modal) modal.hide();
  
  // Reload companies
  loadCompanies();
  loadParentCompanies();
}

// Load parent companies
function loadParentCompanies() {
  const parentCompanySelect = document.getElementById('parentCompany');
  if (!parentCompanySelect) return;
  // Limpar opções atuais
  parentCompanySelect.innerHTML = '<option value="">Nenhuma (Empresa Principal)</option>';
     fetch("https://localhost/EBEN/api/showparentcompanies.php")
    .then(response => response.json())
    .then(companies => {
      // Filtrar apenas empresas principais (sem parentId ou com parentId nulo/vazio)
      companies
        .filter(company => !company.parentId)
        .forEach(company => {
          const option = document.createElement('option');
          option.value = company.id;
          let displayText = company.nome;
          if (company.cnpj) {
            displayText += ` (CNPJ: ${company.cnpj})`;
          }
          option.textContent = displayText;
          parentCompanySelect.appendChild(option);
        });
    })
    .catch(error => {
      console.error('Erro ao carregar empresas principais:', error);
    });
}

// Save employee using data service
function saveEmployee(e) {
  e.preventDefault();

  const employeeName = document.getElementById('employeeName').value;
  const employeePosition = document.getElementById('employeePosition').value;
  const employeePhone = document.getElementById('employeePhone').value;
  
  // Create employee object
  const employee = {
    id: Date.now(),
    nome: employeeName,
    cargo: employeePosition,
    telefone: employeePhone,
    createdAt: new Date().toISOString()
  };

  fetch("https://localhost/EBEN/api/employe.php", {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(employee)
  })
  .then(response => response.json())
  .then(data => {
   console.log('Resposta do servidor:', data);
   alert(`Técnico ${employee.nome} cadastrado com sucesso!`);
   loadEmployees();
  })
  .catch(error => {
   console.error('Erro ao enviar:', error);
  });
  
  // Save employee using data service
  //window.dataService.create(window.dataService.DATA_TYPES.EMPLOYEES, employee);
  
  // Show success message
  //alert(`Técnico ${employeeName} cadastrado com sucesso!`);
  
  // Reset form
  document.getElementById('employeeForm').reset();
  
  // Close modal
  const modal = bootstrap.Modal.getInstance(document.getElementById('employeeModal'));
  if (modal) modal.hide();
  
  // Reload employees
  
}

// Add employee management functions
function loadEmployeesTable() {
  fetch("https://localhost/EBEN/api/showtableemployes.php", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
  })
  .then(response => response.json())
  .then(data => {
    console.log('Resposta do servidor:', data);

    const tbody = document.getElementById('employeesTableBody');
    const noEmployeesMessage = document.getElementById('no-employees-message');

    if (!data || data.length === 0) {
      tbody.innerHTML = '';
      noEmployeesMessage.classList.remove('d-none');
      return;
    }

    noEmployeesMessage.classList.add('d-none');

    tbody.innerHTML = data.map(employee => `
      <tr>
        <td>${employee.nome}</td>
        <td>${employee.cargo}</td>
        <td>${employee.telefone}</td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="deleteEmployee('${employee.id}')">
            <i class="bi bi-trash"></i> Excluir
          </button>
        </td>
      </tr>
    `).join('');
  })
  .catch(error => {
    console.error('Erro ao enviar:', error);
  });
}

function deleteEmployee(employeeId) {
  const confirmDelete = confirm("Tem certeza que deseja deletar este usuário? Esta ação não pode ser desfeita.");
  if (!confirmDelete) return; // Se o usuário cancelar, para aqui

  const idSelect = { id: employeeId };
  fetch("https://localhost/EBEN/api/delete_employee.php", {
         method: 'POST',
         headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify(idSelect)
        })
       .then(response => response.json())
       .then(data => {
        console.log('Resposta do servidor:', data);
        loadEmployeesTable();
        loadEmployees(); // Reload dropdown
        })
        .catch(error => {
        console.error('Erro ao enviar:', error);
});
}

// Show task history in a modal
function showTaskHistory(taskId) {
  const task = window.dataService.getById(window.dataService.DATA_TYPES.TASKS, taskId);
  if (!task || !task.history) {
    alert('Histórico não encontrado para esta tarefa.');
    return;
  }

  const modalContent = document.getElementById('taskHistoryContent');
  modalContent.innerHTML = task.history
    .map(entry => `
      <div class="border-bottom py-2">
        <p><strong>Ação:</strong> ${entry.action}</p>
        <p><strong>Data:</strong> ${new Date(entry.timestamp).toLocaleString()}</p>
        <p><strong>Localização:</strong> ${entry.coordinates || 'N/A'}</p>
        <p><strong>Observações:</strong> ${entry.observations || 'Nenhuma'}</p>
      </div>
    `)
    .join('');

  const modal = new bootstrap.Modal(document.getElementById('taskHistoryModal'));
  modal.show();
}

// Analyze performance and render charts
function analyzePerformance() {
  const tasks = window.dataService.getAll(window.dataService.DATA_TYPES.TASKS);

  if (!tasks || tasks.length === 0) {
    alert('Nenhuma tarefa encontrada para análise.');
    return;
  }

  // Aggregate data for analysis
  const completedTasks = tasks.filter(task => task.status === 'concluida');
  const totalTasks = tasks.length;
  const avgWorkTime = calculateAverageTime(completedTasks, 'workTime');
  const avgTransitTime = calculateAverageTime(completedTasks, 'transitTime');

  // Render charts
  renderChart('taskCompletionChart', 'Tarefas Concluídas', ['Concluídas', 'Pendentes'], [completedTasks.length, totalTasks - completedTasks.length]);
  renderChart('timeAnalysisChart', 'Tempo Médio (Horas)', ['Trabalho', 'Translado'], [avgWorkTime, avgTransitTime]);
}

// Calculate average time in hours
function calculateAverageTime(tasks, timeField) {
  const totalMs = tasks.reduce((sum, task) => {
    const time = task.report?.[timeField];
    if (time) {
      const [hours, minutes, seconds] = time.split(':').map(Number);
      return sum + (hours * 3600 + minutes * 60 + seconds) * 1000;
    }
    return sum;
  }, 0);

  return (totalMs / tasks.length) / (1000 * 3600); // Convert ms to hours
}

// Render a chart using Chart.js
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
      }
    }
  });
}

// Add event listeners for company and employee forms
document.addEventListener('DOMContentLoaded', function () {
  // Company form
  const companyForm = document.getElementById('companyForm');
  if (companyForm) {
    companyForm.addEventListener('submit', saveCompany);
  }

  // Employee form
  const employeeForm = document.getElementById('employeeForm');
  if (employeeForm) {
    employeeForm.addEventListener('submit', saveEmployee);
  }

  // Add company button
  const addCompanyBtn = document.getElementById('addCompanyBtn');
  if (addCompanyBtn) {
    addCompanyBtn.addEventListener('click', function () {
      loadParentCompanies();
      const companyModal = new bootstrap.Modal(document.getElementById('companyModal'));
      companyModal.show();

      // Initialize company map after modal is shown
      companyModal._element.addEventListener('shown.bs.modal', function () {
        setTimeout(initCompanyMap, 300);
      });
    });
  }

  // Add employee button
  const addEmployeeBtn = document.getElementById('addEmployeeBtn');
  if (addEmployeeBtn) {
    addEmployeeBtn.addEventListener('click', function () {
      const employeeModal = new bootstrap.Modal(document.getElementById('employeeModal'));
      employeeModal.show();
    });
  }

  // Manage employees button
  const manageEmployeesBtn = document.getElementById('manageEmployeesBtn');
  if (manageEmployeesBtn) {
    manageEmployeesBtn.addEventListener('click', function () {
      loadEmployeesTable();
      const manageEmployeesModal = new bootstrap.Modal(document.getElementById('manageEmployeesModal'));
      manageEmployeesModal.show();
    });
  }

  // Company modal event to fix map
  const companyModalElement = document.getElementById('companyModal');
  if (companyModalElement) {
    companyModalElement.addEventListener('shown.bs.modal', function () {
      setTimeout(initCompanyMap, 300);
    });
  }
});

// Make deleteEmployee available globally
window.deleteEmployee = deleteEmployee;