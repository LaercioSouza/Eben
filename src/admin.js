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
  document.getElementById('companyCoordinates').value = `${latLng.lat},${latLng.lng}`;

}

// Update coordinates function
function updateCoordinates() {
  const latLng = marker.getLatLng();
  document.getElementById('coordinates').value = `${latLng.lat},${latLng.lng}`;

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
let todasEmpresas = [];

function loadCompanies() {
  const empresaSelect = document.getElementById('empresa');

  fetch("https://localhost/EBEN/api/listcompanies.php")
    .then(response => response.json())
    .then(empresas => {
      todasEmpresas = empresas; // Armazena todas as empresas
      const select = document.getElementById('empresa');
      
      // Limpa o select mantendo apenas a primeira opção
      select.innerHTML = '<option value="">Selecione uma empresa:</option>';
      
      // Filtra apenas empresas que não são filiais
      empresas.filter(empresa => !empresa.parentId).forEach(empresa => {
        const option = document.createElement('option');
        option.value = empresa.id;

        // Nome sempre em destaque
        let displayText = empresa.nome;

        // Monta informações extras
        let extraInfo = [];
        if (empresa.cnpj) {
          extraInfo.push(`CNPJ: ${empresa.cnpj}`);
        }
        if (empresa.endereco) {
          extraInfo.push(empresa.endereco);
        }

        // Junta nome + extras (quebra automática via CSS)
        if (extraInfo.length > 0) {
          displayText += " — " + extraInfo.join(" • ");
        }

        option.textContent = displayText;

        // Tooltip detalhado
        option.title = `${empresa.nome}
CNPJ: ${empresa.cnpj || 'Não informado'}
Endereço: ${empresa.endereco || 'Não informado'}
Telefone: ${empresa.telefone || 'Não informado'}`;

        select.appendChild(option);
      });
    })
    .catch(error => {
      console.error('Erro ao carregar empresas:', error);
    });

  toggleSubsidiaryField(false);
}

// Função para filtrar empresas
function filterCompanies() {
  const filterText = document.getElementById('empresaFilter').value.toLowerCase();
  const select = document.getElementById('empresa');
  
  // Limpa o select mantendo apenas a primeira opção
  select.innerHTML = '<option value="">Selecione uma empresa</option>';
  
  // Mostra o botão de limpar filtro se houver texto
  document.getElementById('clearFilter').style.display = filterText ? 'block' : 'none';
  
  // Filtra empresas baseado no texto
  todasEmpresas.filter(empresa => !empresa.parentId).forEach(empresa => {
    const nome = empresa.nome?.toLowerCase() || '';
    const cnpj = empresa.cnpj?.toLowerCase() || '';
    const endereco = empresa.endereco?.toLowerCase() || '';
    const telefone = empresa.telefone?.toLowerCase() || '';
    
    if (filterText === '' || 
        nome.includes(filterText) || 
        cnpj.includes(filterText) || 
        endereco.includes(filterText) || 
        telefone.includes(filterText)) {
      
      const option = document.createElement('option');
      option.value = empresa.id;

      // Nome sempre em destaque
      let displayText = empresa.nome;

      // Monta informações extras
      let extraInfo = [];
      if (empresa.cnpj) {
        extraInfo.push(`CNPJ: ${empresa.cnpj}`);
      }
      if (empresa.endereco) {
        extraInfo.push(empresa.endereco);
      }

      // Junta nome + extras (quebra automática via CSS)
      if (extraInfo.length > 0) {
        displayText += " — " + extraInfo.join(" • ");
      }

      option.textContent = displayText;

      // Tooltip detalhado
      option.title = `${empresa.nome}
CNPJ: ${empresa.cnpj || 'Não informado'}
Endereço: ${empresa.endereco || 'Não informado'}
Telefone: ${empresa.telefone || 'Não informado'}`;

      select.appendChild(option);
    }
  });
}

// Adiciona event listeners quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
  // Listener para o campo de filtro
  document.getElementById('empresaFilter').addEventListener('input', filterCompanies);
  
  // Listener para o botão de limpar filtro
  document.getElementById('clearFilter').addEventListener('click', function() {
    document.getElementById('empresaFilter').value = '';
    filterCompanies();
  });
  
  // Carrega as empresas
  
});



// Load subsidiaries
async function loadSubsidiaries() {
  const empresaId = document.getElementById('empresa').value;

  if (!empresaId) {
    toggleSubsidiaryField(false);
    return;
  }

  try {
    const response = await fetch(`https://localhost/EBEN/api/get_subsidiaries.php?empresaId=${empresaId}`);
    
    if (!response.ok) {
      throw new Error('Erro ao carregar filiais');
    }

    const subsidiaries = await response.json();

    if (subsidiaries.length === 0) {
      toggleSubsidiaryField(false);
      return;
    }

    toggleSubsidiaryField(true);
    const subsidiarySelect = document.getElementById('subsidiary');
    
    subsidiarySelect.innerHTML = '<option value="">Selecione uma filial (opcional)</option>';

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

  } catch (error) {
    console.error('Erro:', error);
    toggleSubsidiaryField(false);
  }
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
        select.innerHTML = '<option value="">Selecione um Analista</option>';

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

function hoursMinutesToHHMMSS(hours, minutes) {
   const totalSeconds = (hours * 3600) + (minutes * 60);
   const h = Math.floor(totalSeconds / 3600);
   const m = Math.floor((totalSeconds % 3600) / 60);
   const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

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
    // Função para validar o tempo sugerido
    function validateTempoSugerido() {
      const tempoSugerido = document.getElementById('tempoSugerido').value;
      
      if (!tempoSugerido) {
        document.getElementById('tempoSugerido').classList.add('is-invalid');
        document.getElementById('tempoSugeridoError').style.display = 'block';
        return false;
      }
      
      // Verificar se o tempo é válido (não pode ser 00:00)
      const [hours, minutes] = tempoSugerido.split(':').map(Number);
      if (hours === 0 && minutes === 0) {
        document.getElementById('tempoSugerido').classList.add('is-invalid');
        document.getElementById('tempoSugeridoError').style.display = 'block';
        return false;
      }
      
      document.getElementById('tempoSugerido').classList.remove('is-invalid');
      document.getElementById('tempoSugeridoError').style.display = 'none';
      return true;
    }

// Função para converter HH:MM para HH:MM:SS (adicionando segundos como 00)
function convertTimeToMySQLFormat(timeString) {
  if (!timeString) return null;

  // Se já estiver no formato HH:MM:SS, retorna direto
  if (timeString.split(':').length === 3) {
    return timeString;
  }

  // Se estiver no formato HH:MM, adiciona os segundos
  return timeString + ':00';
}    

// Save task using data service
function saveTask(e) {
      e.preventDefault();
      
      if (!validateTempoSugerido()) {
        return;
      }

      // Get form values
      const empresa = document.getElementById('empresa').value;
      const subsidiary = document.getElementById('subsidiary')?.value || null;
      const colaborador = document.getElementById('colaborador').value;
      const responsavel = document.getElementById('responsavel').value || '';
      const data = document.getElementById('data').value;
      const hora = document.getElementById('hora').value;
      
      // Obter o tempo sugerido no formato HH:MM e converter para HH:MM:SS
      const tempoSugerido = document.getElementById('tempoSugerido').value;
      const tempoSugeridoMySQL = convertTimeToMySQLFormat(tempoSugerido);
      
      const descricao = document.getElementById('descricao').value;
      const coordinates = document.getElementById('coordinates').value;
      const formulario = document.getElementById('formulario').value || null;
      
      if (!empresa || !colaborador) {
        alert('Por favor, selecione uma empresa e um analista válidos');
        return;
      }
      
      const startTime = getLocalISOString();
      
      const task = {
        id: Date.now(),
        empresaid: empresa,
        subsidiaria: subsidiary,
        colaboradorid: colaborador,
        responsavel: responsavel,
        tempoSugerido: tempoSugeridoMySQL, // Já está no formato HH:MM:SS
        data: data,
        hora: hora,
        descricao: descricao,
        coordinates: coordinates,
        formularioNome: formulario,
        formularioResposta: null,
        status: 'pendente',
        history: [
          {
            timestamp: new Date().toISOString(),
            action: 'criada',
            coordinates: coordinates
          }
        ],
        createdAt: startTime
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

    // Adicionar event listener ao formulário quando o DOM estiver carregado
    document.addEventListener('DOMContentLoaded', function() {
      const taskForm = document.getElementById('taskForm');
      if (taskForm) {
        taskForm.addEventListener('submit', saveTask);
      }
      
      // Adicionar validação em tempo real para o campo tempoSugerido
      const tempoSugeridoInput = document.getElementById('tempoSugerido');
      if (tempoSugeridoInput) {
        tempoSugeridoInput.addEventListener('change', validateTempoSugerido);
        tempoSugeridoInput.addEventListener('input', function() {
          this.classList.remove('is-invalid');
          document.getElementById('tempoSugeridoError').style.display = 'none';
        });
      }
    });

// Save company using data service
function saveCompany(e) {
  e.preventDefault();
  const companyName = document.getElementById('companyName').value;
  const companyCnpj = document.getElementById('companyCnpj').value || null;
  const companyAddress = document.getElementById('companyAddress').value;
  const companyPhone = document.getElementById('companyPhone').value;
  const parentCompanyId = document.getElementById('parentCompany').value || null;
  const companyCoordinates = document.getElementById('companyCoordinates')?.value || null;
  const createdAt = getLocalISOString();

  // Create company object
  const company = {
    id: Date.now(),
    nome: companyName,
    cnpj: companyCnpj,
    endereco: companyAddress,
    telefone: companyPhone,
    coordinates: companyCoordinates,
    parentId: parentCompanyId ? parseInt(parentCompanyId) : null,
    createdAt: createdAt
  };
    fetch("https://localhost/EBEN/api/config.php", {
         method: 'POST',
         headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify(company)
})      
.then(response => response.text()) // <- Use .text() temporariamente
  .then(text => {
    console.log('Resposta bruta:', text);
    alert(`Empresa ${companyName} cadastrada com sucesso!`);
    const form = JSON.parse(text);
    // Reset form
  document.getElementById('companyForm').reset();
  
  // Close modal
  const modal = bootstrap.Modal.getInstance(document.getElementById('companyModal'));
  if (modal) modal.hide();
  
  // Reload companies
  loadCompanies();
  loadParentCompanies();
  })

      /*
       .then(response => response.json())
       .then(data => {
        console.log('Resposta do servidor:', data);
        alert(`Empresa ${companyName} cadastrada com sucesso!`);
      * 
      })*/
.catch(error => {
  console.error('Erro ao enviar:', error);
});

  
  
}

// Load parent companies
let todasParentCompanies = [];

function loadParentCompanies() {
  const parentCompanySelect = document.getElementById('parentCompany');
  if (!parentCompanySelect) return;

  fetch("https://localhost/EBEN/api/showparentcompanies.php")
    .then(response => response.json())
    .then(companies => {
      todasParentCompanies = companies; // salva todas
      renderParentCompanies(); // desenha a lista inicial
    })
    .catch(error => {
      console.error('Erro ao carregar empresas principais:', error);
    });
}

function renderParentCompanies(filterText = '') {
  const parentCompanySelect = document.getElementById('parentCompany');
  if (!parentCompanySelect) return;

  // Limpar opções
  parentCompanySelect.innerHTML = '<option value="">Selecione Uma Empresa Principal</option>';

  // Normalizar texto do filtro
  const filter = filterText.toLowerCase();

  todasParentCompanies
    .filter(company => !company.parentId)
    .forEach(company => {
      const nome = company.nome?.toLowerCase() || '';
      const cnpj = company.cnpj?.toLowerCase() || '';
      const endereco = company.endereco?.toLowerCase() || '';
      const telefone = company.telefone?.toLowerCase() || '';

      // Verifica filtro
      if (filter === '' || nome.includes(filter) || cnpj.includes(filter) || endereco.includes(filter) || telefone.includes(filter)) {
        const option = document.createElement('option');
        option.value = company.id;

        // Exibição com padrão fixo
        let displayText = company.nome;
        displayText += company.cnpj ? ` — CNPJ: ${company.cnpj}` : " • CNPJ:";
       
        option.textContent = displayText;

        // Tooltip detalhado
        option.title = `${company.nome}
        CNPJ: ${company.cnpj || 'Não informado'}`;

        parentCompanySelect.appendChild(option);
      }
    });
}



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

// Save employee using data service
function saveEmployee(e) {
  e.preventDefault();

  const employeeName = document.getElementById('employeeName').value;
  const employeeEmail = document.getElementById('employeeEmail').value;
  const employeePosition = document.getElementById('employeePosition').value;
  const employeePhone = document.getElementById('employeePhone').value;
  const createdAt = getLocalISOString();

  
  const employee = {
    id: Date.now(),
    nome: employeeName,
    email: employeeEmail,
    cargo: employeePosition,
    telefone: employeePhone,
    createdAt: createdAt
  };

  fetch("https://localhost/EBEN/api/employe.php", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employee)
  })
  .then(response => response.json())
  .then(data => {
    if (data.status === 'sucesso') {
      alert(`Analista ${employee.nome} cadastrado com sucesso!\nSenha: ${data.password}`);
      loadEmployees();
    } else {
      throw new Error(data.mensagem || 'Erro desconhecido');
    }
  })
  .catch(error => {
    console.error('Erro ao enviar:', error);
    alert(`Erro no cadastro: ${error.message}`);
  });
  
  document.getElementById('employeeForm').reset();
  const modal = bootstrap.Modal.getInstance(document.getElementById('employeeModal'));
  if (modal) modal.hide();
}
// Add employee management functions
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
        <td>${employee.email}</td>
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

    if (data.status === 'sucesso') {
      loadEmployeesTable();
      loadEmployees(); // Atualiza dropdown
      alert(data.mensagem);
    } else {
      alert("Erro: " + data.mensagem);
    }
  })
  .catch(error => {
    console.error('Erro ao enviar:', error);
    alert("Ocorreu um erro inesperado ao tentar deletar o usuário.");
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
      loadParentCompanies(); // carrega empresas principais

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

  // =========================
  // 🔎 LISTENERS PARA FILTROS
  // =========================

  // Filtro empresas normais
  const empresaFilterInput = document.getElementById('empresaFilter');
  const clearEmpresaBtn = document.getElementById('clearFilter');
  if (empresaFilterInput) {
    empresaFilterInput.addEventListener('input', filterCompanies);
  }
  if (clearEmpresaBtn) {
    clearEmpresaBtn.addEventListener('click', function () {
      empresaFilterInput.value = '';
      filterCompanies();
      clearEmpresaBtn.style.display = 'none';
    });
  }

  // Filtro empresas principais (modal)
  const parentFilterInput = document.getElementById('parentCompanyFilter');
  const clearParentBtn = document.getElementById('clearParentFilter');
  if (parentFilterInput) {
    parentFilterInput.addEventListener('input', function () {
      const text = parentFilterInput.value;
      renderParentCompanies(text);
      if (clearParentBtn) clearParentBtn.style.display = text ? 'block' : 'none';
    });
  }
  if (clearParentBtn) {
    clearParentBtn.addEventListener('click', function () {
      parentFilterInput.value = '';
      renderParentCompanies();
      clearParentBtn.style.display = 'none';
    });
  }

  // Carregar listas iniciais
  loadCompanies();
  loadParentCompanies();
});

// Make deleteEmployee available globally
window.deleteEmployee = deleteEmployee;
