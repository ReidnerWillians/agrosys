document.addEventListener('DOMContentLoaded', function() {
    // Dados iniciais (simulando um banco de dados)
    let animais = JSON.parse(localStorage.getItem('animais')) || [];
    let producao = JSON.parse(localStorage.getItem('producao')) || [];
    let estoque = JSON.parse(localStorage.getItem('estoque')) || [];

    // Elementos do DOM
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('nav a');
    const totalAnimaisElement = document.getElementById('total-animais');
    const producaoMensalElement = document.getElementById('producao-mensal');
    const estoqueAtualElement = document.getElementById('estoque-atual');
    const modal = document.getElementById('confirm-modal');
    const modalMessage = document.getElementById('modal-message');
    const modalCancel = document.getElementById('modal-cancel');
    const modalConfirm = document.getElementById('modal-confirm');

    // Variáveis para controle
    let currentAction = null;
    let itemToDelete = null;
    let producaoChart = null;

    // Inicialização
    initNavigation();
    updateDashboard();
    renderAnimaisTable();
    renderProducaoTable();
    renderEstoqueTable();
    initForms();
    initModal();

    // Funções de navegação
    function initNavigation() {
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const sectionId = this.getAttribute('data-section');
                
                // Atualiza a navegação ativa
                navLinks.forEach(navLink => navLink.classList.remove('active'));
                this.classList.add('active');
                
                // Mostra a seção correspondente
                sections.forEach(section => {
                    section.classList.remove('active');
                    if (section.id === sectionId) {
                        section.classList.add('active');
                        
                        // Atualiza gráficos quando a seção de dashboard é aberta
                        if (sectionId === 'dashboard') {
                            updateDashboard();
                        }
                    }
                });
            });
        });
    }

    // Atualiza o dashboard
    function updateDashboard() {
        // Atualiza totais
        totalAnimaisElement.textContent = animais.length;
        
        // Calcula produção mensal (soma do mês atual)
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const producaoMensal = producao
            .filter(item => {
                const itemDate = new Date(item.data);
                return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
            })
            .reduce((total, item) => total + parseFloat(item.quantidade), 0);
        
        producaoMensalElement.textContent = `${producaoMensal.toFixed(2)} L`;
        
        // Calcula estoque total (soma de todos os itens)
        const estoqueTotal = estoque.reduce((total, item) => total + parseFloat(item.quantidade), 0);
        estoqueAtualElement.textContent = `${estoqueTotal.toFixed(2)} kg`;
        
        // Atualiza gráfico de produção
        updateProducaoChart();
    }

    // Atualiza o gráfico de produção
    function updateProducaoChart() {
        const ctx = document.getElementById('producaoChart').getContext('2d');
        
        // Agrupa produção por mês
        const monthlyProduction = Array(12).fill(0);
        producao.forEach(item => {
            const date = new Date(item.data);
            const month = date.getMonth();
            monthlyProduction[month] += parseFloat(item.quantidade);
        });
        
        if (producaoChart) {
            producaoChart.destroy();
        }
        
        producaoChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
                datasets: [{
                    label: 'Produção Mensal (L)',
                    data: monthlyProduction,
                    backgroundColor: '#2c8a4a',
                    borderColor: '#1f6b38',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Renderiza a tabela de animais
    function renderAnimaisTable() {
        const tbody = document.querySelector('#tabela-animais tbody');
        tbody.innerHTML = '';
        
        animais.forEach(animal => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${animal.id}</td>
                <td>${formatTipoAnimal(animal.tipo)}</td>
                <td>${animal.raca}</td>
                <td>${formatDate(animal.nascimento)}</td>
                <td class="acoes">
                    <button class="editar" data-id="${animal.id}"><i class="fas fa-edit"></i></button>
                    <button class="excluir" data-id="${animal.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        // Adiciona eventos aos botões
        document.querySelectorAll('.editar').forEach(btn => {
            btn.addEventListener('click', function() {
                const animalId = this.getAttribute('data-id');
                editAnimal(animalId);
            });
        });
        
        document.querySelectorAll('.excluir').forEach(btn => {
            btn.addEventListener('click', function() {
                const animalId = this.getAttribute('data-id');
                confirmDelete('animal', animalId);
            });
        });
    }

    // Renderiza a tabela de produção
    function renderProducaoTable() {
        const tbody = document.querySelector('#tabela-producao tbody');
        tbody.innerHTML = '';
        
        producao.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${formatTipoProducao(item.tipo)}</td>
                <td>${item.quantidade} ${getUnidadeProducao(item.tipo)}</td>
                <td>${formatDate(item.data)}</td>
                <td class="acoes">
                    <button class="editar" data-id="${item.id}"><i class="fas fa-edit"></i></button>
                    <button class="excluir" data-id="${item.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        // Adiciona eventos aos botões
        document.querySelectorAll('.editar').forEach(btn => {
            btn.addEventListener('click', function() {
                const itemId = this.getAttribute('data-id');
                editProducao(itemId);
            });
        });
        
        document.querySelectorAll('.excluir').forEach(btn => {
            btn.addEventListener('click', function() {
                const itemId = this.getAttribute('data-id');
                confirmDelete('producao', itemId);
            });
        });
    }

    // Renderiza a tabela de estoque
    function renderEstoqueTable() {
        const tbody = document.querySelector('#tabela-estoque tbody');
        tbody.innerHTML = '';
        
        estoque.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.item}</td>
                <td>${item.quantidade} ${item.unidade}</td>
                <td>${item.unidade}</td>
                <td class="acoes">
                    <button class="editar" data-id="${item.id}"><i class="fas fa-edit"></i></button>
                    <button class="excluir" data-id="${item.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        // Adiciona eventos aos botões
        document.querySelectorAll('.editar').forEach(btn => {
            btn.addEventListener('click', function() {
                const itemId = this.getAttribute('data-id');
                editEstoque(itemId);
            });
        });
        
        document.querySelectorAll('.excluir').forEach(btn => {
            btn.addEventListener('click', function() {
                const itemId = this.getAttribute('data-id');
                confirmDelete('estoque', itemId);
            });
        });
    }

    // Inicializa os formulários
    function initForms() {
        // Formulário de animais
        const formAnimal = document.getElementById('form-animal');
        formAnimal.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const animal = {
                id: document.getElementById('animal-id').value,
                tipo: document.getElementById('animal-tipo').value,
                raca: document.getElementById('animal-raca').value,
                nascimento: document.getElementById('animal-nascimento').value,
                id: Date.now().toString() // ID único
            };
            
            animais.push(animal);
            saveData();
            renderAnimaisTable();
            updateDashboard();
            formAnimal.reset();
            
            alert('Animal cadastrado com sucesso!');
        });
        
        // Formulário de produção
        const formProducao = document.getElementById('form-producao');
        formProducao.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const producaoItem = {
                tipo: document.getElementById('producao-tipo').value,
                quantidade: document.getElementById('producao-quantidade').value,
                data: document.getElementById('producao-data').value,
                id: Date.now().toString() // ID único
            };
            
            producao.push(producaoItem);
            saveData();
            renderProducaoTable();
            updateDashboard();
            formProducao.reset();
            
            alert('Produção registrada com sucesso!');
        });
        
        // Formulário de estoque
        const formEstoque = document.getElementById('form-estoque');
        formEstoque.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const estoqueItem = {
                item: document.getElementById('estoque-item').value,
                quantidade: document.getElementById('estoque-quantidade').value,
                unidade: document.getElementById('estoque-unidade').value,
                id: Date.now().toString() // ID único
            };
            
            estoque.push(estoqueItem);
            saveData();
            renderEstoqueTable();
            updateDashboard();
            formEstoque.reset();
            
            alert('Item adicionado ao estoque com sucesso!');
        });
        
        // Formulário de relatórios
        const formRelatorio = document.getElementById('form-relatorio');
        const relatorioPeriodo = document.getElementById('relatorio-periodo');
        
        relatorioPeriodo.addEventListener('change', function() {
            const customDates = document.getElementById('custom-dates');
            customDates.style.display = this.value === 'personalizado' ? 'block' : 'none';
        });
        
        formRelatorio.addEventListener('submit', function(e) {
            e.preventDefault();
            generateRelatorio();
        });
    }

    // Gera relatório
    function generateRelatorio() {
        const tipo = document.getElementById('relatorio-tipo').value;
        const periodo = document.getElementById('relatorio-periodo').value;
        const resultado = document.getElementById('relatorio-resultado');
        
        let html = '<h4>Relatório de ' + tipo.charAt(0).toUpperCase() + tipo.slice(1) + ' - ' + periodo.charAt(0).toUpperCase() + periodo.slice(1) + '</h4>';
        
        if (tipo === 'animais') {
            html += '<p>Total de animais: ' + animais.length + '</p>';
            html += '<table><thead><tr><th>Tipo</th><th>Quantidade</th></tr></thead><tbody>';
            
            const animaisPorTipo = {};
            animais.forEach(animal => {
                if (!animaisPorTipo[animal.tipo]) {
                    animaisPorTipo[animal.tipo] = 0;
                }
                animaisPorTipo[animal.tipo]++;
            });
            
            for (const tipo in animaisPorTipo) {
                html += `<tr><td>${formatTipoAnimal(tipo)}</td><td>${animaisPorTipo[tipo]}</td></tr>`;
            }
            
            html += '</tbody></table>';
        } else if (tipo === 'producao') {
            html += '<p>Total de registros: ' + producao.length + '</p>';
            html += '<table><thead><tr><th>Tipo</th><th>Quantidade Total</th></tr></thead><tbody>';
            
            const producaoPorTipo = {};
            producao.forEach(item => {
                if (!producaoPorTipo[item.tipo]) {
                    producaoPorTipo[item.tipo] = 0;
                }
                producaoPorTipo[item.tipo] += parseFloat(item.quantidade);
            });
            
            for (const tipo in producaoPorTipo) {
                html += `<tr><td>${formatTipoProducao(tipo)}</td><td>${producaoPorTipo[tipo].toFixed(2)} ${getUnidadeProducao(tipo)}</td></tr>`;
            }
            
            html += '</tbody></table>';
        } else if (tipo === 'estoque') {
            html += '<p>Total de itens: ' + estoque.length + '</p>';
            html += '<table><thead><tr><th>Item</th><th>Quantidade</th><th>Unidade</th></tr></thead><tbody>';
            
            estoque.forEach(item => {
                html += `<tr><td>${item.item}</td><td>${item.quantidade}</td><td>${item.unidade}</td></tr>`;
            });
            
            html += '</tbody></table>';
        }
        
        resultado.innerHTML = html;
    }

    // Funções auxiliares
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    function formatTipoAnimal(tipo) {
        const tipos = {
            'bovino': 'Bovino',
            'suino': 'Suíno',
            'ave': 'Ave',
            'caprino': 'Caprino',
            'ovino': 'Ovino'
        };
        return tipos[tipo] || tipo;
    }

    function formatTipoProducao(tipo) {
        const tipos = {
            'leite': 'Leite',
            'ovos': 'Ovos',
            'carne': 'Carne',
            'lã': 'Lã'
        };
        return tipos[tipo] || tipo;
    }

    function getUnidadeProducao(tipo) {
        const unidades = {
            'leite': 'L',
            'ovos': 'un',
            'carne': 'kg',
            'lã': 'kg'
        };
        return unidades[tipo] || '';
    }

    function saveData() {
        localStorage.setItem('animais', JSON.stringify(animais));
        localStorage.setItem('producao', JSON.stringify(producao));
        localStorage.setItem('estoque', JSON.stringify(estoque));
    }

    // Funções de edição
    function editAnimal(id) {
        const animal = animais.find(a => a.id === id);
        if (!animal) return;
        
        document.getElementById('animal-id').value = animal.id;
        document.getElementById('animal-tipo').value = animal.tipo;
        document.getElementById('animal-raca').value = animal.raca;
        document.getElementById('animal-nascimento').value = animal.nascimento;
        
        // Remove o animal da lista para evitar duplicação
        animais = animais.filter(a => a.id !== id);
        saveData();
        
        // Rola até o formulário
        document.querySelector('#animais').scrollIntoView({ behavior: 'smooth' });
    }

    function editProducao(id) {
        const item = producao.find(p => p.id === id);
        if (!item) return;
        
        document.getElementById('producao-tipo').value = item.tipo;
        document.getElementById('producao-quantidade').value = item.quantidade;
        document.getElementById('producao-data').value = item.data;
        
        // Remove o item da lista para evitar duplicação
        producao = producao.filter(p => p.id !== id);
        saveData();
        
        // Rola até o formulário
        document.querySelector('#producao').scrollIntoView({ behavior: 'smooth' });
    }

    function editEstoque(id) {
        const item = estoque.find(e => e.id === id);
        if (!item) return;
        
        document.getElementById('estoque-item').value = item.item;
        document.getElementById('estoque-quantidade').value = item.quantidade;
        document.getElementById('estoque-unidade').value = item.unidade;
        
        // Remove o item da lista para evitar duplicação
        estoque = estoque.filter(e => e.id !== id);
        saveData();
        
        // Rola até o formulário
        document.querySelector('#estoque').scrollIntoView({ behavior: 'smooth' });
    }

    // Funções de exclusão
    function confirmDelete(type, id) {
        currentAction = type;
        itemToDelete = id;
        
        let message = '';
        if (type === 'animal') {
            const animal = animais.find(a => a.id === id);
            message = `Tem certeza que deseja excluir o animal ${animal.id} (${formatTipoAnimal(animal.tipo)})?`;
        } else if (type === 'producao') {
            const item = producao.find(p => p.id === id);
            message = `Tem certeza que deseja excluir o registro de produção de ${item.quantidade} ${getUnidadeProducao(item.tipo)} de ${formatTipoProducao(item.tipo)}?`;
        } else if (type === 'estoque') {
            const item = estoque.find(e => e.id === id);
            message = `Tem certeza que deseja excluir o item ${item.item} (${item.quantidade} ${item.unidade}) do estoque?`;
        }
        
        modalMessage.textContent = message;
        modal.style.display = 'flex';
    }

    function initModal() {
        modalCancel.addEventListener('click', function() {
            modal.style.display = 'none';
            currentAction = null;
            itemToDelete = null;
        });
        
        modalConfirm.addEventListener('click', function() {
            if (currentAction && itemToDelete) {
                if (currentAction === 'animal') {
                    animais = animais.filter(a => a.id !== itemToDelete);
                } else if (currentAction === 'producao') {
                    producao = producao.filter(p => p.id !== itemToDelete);
                } else if (currentAction === 'estoque') {
                    estoque = estoque.filter(e => e.id !== itemToDelete);
                }
                
                saveData();
                
                if (currentAction === 'animal') {
                    renderAnimaisTable();
                } else if (currentAction === 'producao') {
                    renderProducaoTable();
                } else if (currentAction === 'estoque') {
                    renderEstoqueTable();
                }
                
                updateDashboard();
            }
            
            modal.style.display = 'none';
            currentAction = null;
            itemToDelete = null;
        });
        
        // Fecha o modal ao clicar fora
        window.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
                currentAction = null;
                itemToDelete = null;
            }
        });
    }
});