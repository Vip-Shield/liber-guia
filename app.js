let livros = JSON.parse(localStorage.getItem('livros')) || [];
let livroAtualIndex = null;

// Inicialização da interface
document.addEventListener('DOMContentLoaded', () => {
    const inputType = document.getElementById('inputType');
    if (inputType) {
        inputType.addEventListener('change', function() {
            const inputVal = document.getElementById('inputValue');
            if (this.value === 'pages') {
                inputVal.placeholder = "Ex: 350 páginas";
            } else {
                inputVal.placeholder = "Ex: 10 dias";
            }
        });
    }

    // Listener para o input de edição
    const editInputType = document.getElementById('editInputType');
    if (editInputType) {
        editInputType.addEventListener('change', function() {
            const inputVal = document.getElementById('editInputValue');
            if (this.value === 'pages') {
                inputVal.placeholder = "Ex: 350 páginas";
            } else {
                inputVal.placeholder = "Ex: 10 dias";
            }
        });
    }

    renderLista();
});

// Sistema de navegação entre as telas
function navegarPara(tela) {
    document.getElementById('lista-screen').classList.add('hidden');
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('tracker-screen').classList.add('hidden');
    document.getElementById('edit-screen').classList.add('hidden');

    if (tela === 'lista') {
        document.getElementById('lista-screen').classList.remove('hidden');
        renderLista();
    } else if (tela === 'setup') {
        document.getElementById('setup-screen').classList.remove('hidden');
        document.getElementById('bookName').value = '';
        document.getElementById('inputValue').value = '';
    } else if (tela === 'tracker') {
        document.getElementById('tracker-screen').classList.remove('hidden');
        renderTracker();
    } else if (tela === 'edit') {
        document.getElementById('edit-screen').classList.remove('hidden');
    }
}

// Salva a nova jornada
function salvarNovoLivro() {
    const nome = document.getElementById('bookName').value;
    const ritmo = parseInt(document.querySelector('input[name="ritmo"]:checked').value);
    const tipo = document.getElementById('inputType').value;
    const valor = parseInt(document.getElementById('inputValue').value);

    if (!nome || !valor) {
        alert('Preencha todos os campos!');
        return;
    }

    let totalDias = 0;
    if (tipo === 'pages') {
        totalDias = Math.ceil(valor / ritmo);
    } else {
        totalDias = valor;
    }

    const novoLivro = {
        id: Date.now(),
        nome: nome,
        totalDias: totalDias,
        ritmo: ritmo,   
        tipo: tipo,     
        valor: valor,   
        diasConcluidos: new Array(totalDias).fill(false),
        dataInicio: new Date().toISOString()
    };

    livros.push(novoLivro);
    salvarDados();
    navegarPara('lista');
}

// Prepara e abre a tela de edição
function abrirEdicaoLivro() {
    if (livroAtualIndex === null) return;
    const livro = livros[livroAtualIndex];

    // Preenche os campos com os dados atuais do livro
    document.getElementById('editBookName').value = livro.nome;
    document.getElementById('editInputType').value = livro.tipo || 'pages';
    document.getElementById('editInputValue').value = livro.valor || (livro.totalDias * livro.ritmo);
    
    // Atualiza o placeholder
    const inputVal = document.getElementById('editInputValue');
    if (document.getElementById('editInputType').value === 'pages') {
        inputVal.placeholder = "Ex: 350 páginas";
    } else {
        inputVal.placeholder = "Ex: 10 dias";
    }

    // Marca o radio button correto do ritmo
    const ritmoRadios = document.getElementsByName('editRitmo');
    for (let i = 0; i < ritmoRadios.length; i++) {
        if (parseInt(ritmoRadios[i].value) === livro.ritmo) {
            ritmoRadios[i].checked = true;
            break;
        }
    }

    navegarPara('edit');
}

// Salva as alterações feitas no livro
function salvarEdicaoLivro() {
    if (livroAtualIndex === null) return;

    const nome = document.getElementById('editBookName').value;
    const ritmo = parseInt(document.querySelector('input[name="editRitmo"]:checked').value);
    const tipo = document.getElementById('editInputType').value;
    const valor = parseInt(document.getElementById('editInputValue').value);

    if (!nome || !valor) {
        alert('Preencha todos os campos!');
        return;
    }

    let novoTotalDias = 0;
    if (tipo === 'pages') {
        novoTotalDias = Math.ceil(valor / ritmo);
    } else {
        novoTotalDias = valor;
    }

    const livro = livros[livroAtualIndex];
    livro.nome = nome;
    livro.ritmo = ritmo;
    livro.tipo = tipo;
    livro.valor = valor;

    // Ajusta o array de dias sem perder o progresso já feito
    if (novoTotalDias > livro.totalDias) {
        const diasFaltantes = novoTotalDias - livro.totalDias;
        livro.diasConcluidos.push(...new Array(diasFaltantes).fill(false));
    } else if (novoTotalDias < livro.totalDias) {
        // Se diminuiu os dias, corta o array
        livro.diasConcluidos = livro.diasConcluidos.slice(0, novoTotalDias);
    }
    
    livro.totalDias = novoTotalDias;

    salvarDados();
    navegarPara('tracker');
}

// Lógica dinâmica para calcular a previsão de término
function calcularPrevisaoTermino(livro) {
    const concluidos = livro.diasConcluidos.filter(d => d).length;
    const restantes = livro.totalDias - concluidos;
    
    if (restantes === 0) return "Concluído";

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const previsao = new Date(hoje);
    previsao.setDate(previsao.getDate() + restantes);

    return previsao.toLocaleDateString('pt-BR');
}

// Renderiza a lista de livros no Dashboard (Tela Inicial)
function renderLista() {
    const container = document.getElementById('lista-containers');
    container.innerHTML = '';

    if (livros.length === 0) {
        container.innerHTML = '<div class="no-books">Nenhum livro na biblioteca. Adicione um para começar!</div>';
        return;
    }

    livros.forEach((livro, index) => {
        const concluidos = livro.diasConcluidos.filter(d => d).length;
        const porcentagem = (concluidos / livro.totalDias) * 100;
        const dataInicioStr = new Date(livro.dataInicio).toLocaleDateString('pt-BR');
        const previsaoTerminoStr = calcularPrevisaoTermino(livro);
        
        const div = document.createElement('div');
        div.className = 'book-item';
        div.innerHTML = `
            <div class="book-info" style="display: flex; flex-direction: column; align-items: flex-start; gap: 5px;">
                <div style="width: 100%;">
                    <div class="book-title" style="margin-bottom: 6px;">${livro.nome}</div>
                    <div class="book-meta">Progresso: ${concluidos} / ${livro.totalDias} dias (${Math.round(porcentagem)}%)</div>
                    
                    <div class="progress-bar" style="margin: 8px 0 12px 0; height: 6px; background: rgba(255, 255, 255, 0.1);">
                        <div class="progress-fill" style="width: ${porcentagem}%;"></div>
                    </div>

                    <div class="book-meta" style="color: var(--primary); line-height: 1.4;">
                        📅 Início: ${dataInicioStr}<br>
                        🎯 Término Previsto: ${previsaoTerminoStr}
                    </div>
                </div>
                <div class="book-actions" style="display: flex; gap: 10px; width: 100%; margin-top: 10px;">
                    <button onclick="abrirTracker(${index})" style="flex: 1;">Abrir</button>
                    <button onclick="excluirLivro(${index})" class="danger" style="flex: 1;">Excluir</button>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

// Abre a tela individual de checklist
function abrirTracker(index) {
    livroAtualIndex = index;
    navegarPara('tracker');
}

// Renderiza a interface de progresso interna do livro
function renderTracker() {
    if (livroAtualIndex === null) return;
    const livro = livros[livroAtualIndex];
    
    document.getElementById('tracker-title').textContent = livro.nome;
    
    const concluidos = livro.diasConcluidos.filter(d => d).length;
    const porcentagem = (concluidos / livro.totalDias) * 100;
    const dataInicioStr = new Date(livro.dataInicio).toLocaleDateString('pt-BR');
    const previsaoTerminoStr = calcularPrevisaoTermino(livro);

    document.getElementById('progress-text').innerHTML = `
        Concluído: ${concluidos} / ${livro.totalDias} dias (${Math.round(porcentagem)}%)
        <div style="font-size: 0.85rem; opacity: 0.7; margin-top: 6px; color: var(--primary);">
            📅 Início: ${dataInicioStr} | 🎯 Término: ${previsaoTerminoStr}
        </div>
    `;
    
    document.getElementById('progress-fill').style.width = `${porcentagem}%`;

    const checklist = document.getElementById('checklist');
    checklist.innerHTML = '';

    const ritmo = livro.ritmo || 50; 
    const tipo = livro.tipo || 'pages';
    const valor = livro.valor || (livro.totalDias * ritmo);

    livro.diasConcluidos.forEach((status, i) => {
        const dayDiv = document.createElement('div');
        dayDiv.className = `day-item ${status ? 'done' : ''}`;
        dayDiv.onclick = () => toggleDia(i);
        
        let inicioPagina = (i * ritmo) + 1;
        let fimPagina = (i + 1) * ritmo;

        if (tipo === 'pages') {
            fimPagina = Math.min(fimPagina, valor);
        }
        
        dayDiv.innerHTML = `
            <div style="display: flex; flex-direction: column;">
                <span style="font-weight: bold; font-size: 1.05rem;">Dia ${i + 1}</span>
                <span style="font-size: 0.85rem; opacity: 0.8; margin-top: 3px;">Págs ${inicioPagina} - ${fimPagina}</span>
            </div>
            <div class="checkbox"></div>
        `;
        checklist.appendChild(dayDiv);
    });
}

// Marca ou desmarca um dia no checklist
function toggleDia(diaIndex) {
    if (livroAtualIndex === null) return;
    
    const livro = livros[livroAtualIndex];
    livro.diasConcluidos[diaIndex] = !livro.diasConcluidos[diaIndex];
    
    salvarDados();
    renderTracker();
}

// Função para excluir o livro diretamente pela lista
function excluirLivro(index) {
    if (confirm('Tem certeza que deseja remover este livro?')) {
        livros.splice(index, 1);
        salvarDados();
        
        if (livroAtualIndex === index) {
            livroAtualIndex = null;
        }
        
        renderLista();
    }
}

// Remove o livro quando você está dentro da tela do Tracker
function excluirLivroAtual() {
    excluirLivro(livroAtualIndex);
    navegarPara('lista');
}

// Salva as alterações no navegador
function salvarDados() {
    localStorage.setItem('livros', JSON.stringify(livros));
}