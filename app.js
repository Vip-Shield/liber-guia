let biblioteca = [];
let idLivroAtivo = null;

document.addEventListener('DOMContentLoaded', () => {
    carregarBiblioteca();
    
    // Altera o placeholder dinamicamente conforme a seleção do tipo de meta
    document.getElementById('inputType').addEventListener('change', function(e) {
        const input = document.getElementById('inputValue');
        if(e.target.value === 'pages') {
            input.placeholder = "Ex: 350 páginas";
        } else {
            input.placeholder = "Ex: 15 dias";
        }
    });
});

// Carrega os dados do armazenamento local
function carregarBiblioteca() {
    const dadosSalvos = localStorage.getItem('minhaBiblioteca');
    if (dadosSalvos) {
        biblioteca = JSON.parse(dadosSalvos);
    } else {
        biblioteca = [];
    }
    renderizarListaLivros();
}

// Grava o estado atualizado da biblioteca no localStorage
function salvarBiblioteca() {
    localStorage.setItem('minhaBiblioteca', JSON.stringify(biblioteca));
}

// Gerenciador de navegação de ecrãs/telas
function navegarPara(tela) {
    document.getElementById('lista-screen').classList.add('hidden');
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('tracker-screen').classList.add('hidden');

    if (tela === 'lista') {
        renderizarListaLivros();
        document.getElementById('lista-screen').classList.remove('hidden');
    } else if (tela === 'setup') {
        limparFormulario();
        document.getElementById('setup-screen').classList.remove('hidden');
    } else if (tela === 'tracker') {
        document.getElementById('tracker-screen').classList.remove('hidden');
    }
}

// Limpa os inputs do formulário para o próximo preenchimento
function limparFormulario() {
    document.getElementById('bookName').value = '';
    document.getElementById('inputValue').value = '';
    document.getElementById('inputType').value = 'pages';
    document.getElementById('inputValue').placeholder = "Ex: 350 páginas";
    document.getElementById('ritmo50').checked = true;
}

// Cria um novo registo de livro e adiciona à coleção
function salvarNovoLivro() {
    const nome = document.getElementById('bookName').value.trim() || "Livro Sem Título";
    const ritmo = parseInt(document.querySelector('input[name="ritmo"]:checked').value);
    const inputType = document.getElementById('inputType').value;
    const inputValue = parseInt(document.getElementById('inputValue').value);

    if (!inputValue || inputValue <= 0) {
        alert("Por favor, insira um valor válido.");
        return;
    }

    let totalDias;
    let totalPaginas;

    if (inputType === 'pages') {
        totalPaginas = inputValue;
        totalDias = Math.ceil(totalPaginas / ritmo);
    } else {
        totalDias = inputValue;
        totalPaginas = totalDias * ritmo;
    }

    const novoLivro = {
        id: Date.now(), // ID único baseado no timestamp absoluto
        nome: nome,
        ritmo: ritmo,
        totalDias: totalDias,
        totalPaginas: totalPaginas,
        diasConcluidos: [],
        dataInicio: new Date().toISOString()
    };

    biblioteca.push(novoLivro);
    salvarBiblioteca();
    navegarPara('lista');
}

// Renderiza a lista de todos os livros cadastrados na tela principal
function renderizarListaLivros() {
    const container = document.getElementById('lista-containers');
    container.innerHTML = '';

    if (biblioteca.length === 0) {
        container.innerHTML = `<div class="no-books">Nenhum plano ativo.<br>Clique no botão abaixo para adicionar.</div>`;
        return;
    }

    biblioteca.forEach(livro => {
        const concluidos = livro.diasConcluidos.length;
        const total = livro.totalDias;
        const porcentagem = total > 0 ? (concluidos / total) * 100 : 0;

        const div = document.createElement('div');
        div.className = 'book-item';
        
        div.innerHTML = `
            <div class="book-info">
                <span class="book-title">${livro.nome}</span>
                <span class="book-meta">${concluidos} / ${total} dias</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${porcentagem}%"></div>
            </div>
            <div class="book-actions">
                <button onclick="abrirTrackerLivro(${livro.id})">Acompanhar</button>
                <button class="danger" onclick="deletarLivroDireto(${livro.id}, event)">Excluir</button>
            </div>
        `;
        container.appendChild(div);
    });
}

// Seleciona um livro específico e monta a tela de acompanhamento diário
function abrirTrackerLivro(id) {
    idLivroAtivo = id;
    const livro = biblioteca.find(l => l.id === id);
    if (!livro) return;

    document.getElementById('tracker-title').innerText = livro.nome;
    renderizarTrackerLivro();
    navegarPara('tracker');
}

// Constrói a checklist de dias do livro selecionado no momento
function renderizarTrackerLivro() {
    const livro = biblioteca.find(l => l.id === idLivroAtivo);
    if (!livro) return;

    const checklistContainer = document.getElementById('checklist');
    checklistContainer.innerHTML = '';

    const concluidos = livro.diasConcluidos.length;
    const total = livro.totalDias;

    // Atualização em formato crescente (Ex: 0/8, 1/8...)
    document.getElementById('progress-text').innerText = `Concluído: ${concluidos} / ${total} dias`;
    
    // Atualiza preenchimento da barra
    const porcentagem = total > 0 ? (concluidos / total) * 100 : 0;
    document.getElementById('progress-fill').style.width = `${porcentagem}%`;

    // Gera cada item da lista de dias correspondente ao livro
    for (let i = 1; i <= total; i++) {
        const isDone = livro.diasConcluidos.includes(i);
        
        const div = document.createElement('div');
        div.className = `day-item ${isDone ? 'done' : ''}`;
        div.onclick = () => toggleDiaLivro(i);

        // Intervalo exato de páginas lidas em cada dia específico
        const pagInicial = ((i - 1) * livro.ritmo) + 1;
        let pagFinal = i * livro.ritmo;
        if (pagFinal > livro.totalPaginas) pagFinal = livro.totalPaginas;

        div.innerHTML = `
            <span>Dia ${i} <small style="opacity:0.7; margin-left:10px;">(Págs: ${pagInicial} a ${pagFinal})</small></span>
            <div class="checkbox"></div>
        `;
        checklistContainer.appendChild(div);
    }
}

// Inverte o estado de conclusão (marcado/desmarcado) do dia de leitura
function toggleDiaLivro(dia) {
    const livro = biblioteca.find(l => l.id === idLivroAtivo);
    if (!livro) return;

    const index = livro.diasConcluidos.indexOf(dia);
    if (index > -1) {
        livro.diasConcluidos.splice(index, 1);
    } else {
        livro.diasConcluidos.push(dia);
    }
    
    salvarBiblioteca();
    renderizarTrackerLivro();
}

// Remove o plano ativo por completo a partir da tela interna do tracker
function excluirLivroAtual() {
    if (confirm("Tem certeza de que deseja apagar o progresso e excluir este guia por completo?")) {
        biblioteca = biblioteca.filter(l => l.id !== idLivroAtivo);
        salvarBiblioteca();
        idLivroAtivo = null;
        navegarPara('lista');
    }
}

// Remove um livro diretamente do painel da biblioteca principal sem abrir
function deletarLivroDireto(id, event) {
    event.stopPropagation(); // Impede que o clique acione o botão "Acompanhar" acidentalmente
    if (confirm("Tem certeza de que deseja remover este livro da sua biblioteca?")) {
        biblioteca = biblioteca.filter(l => l.id !== id);
        salvarBiblioteca();
        renderizarListaLivros();
    }
}




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
    renderLista();
});

// Sistema de navegação entre as telas
function navegarPara(tela) {
    document.getElementById('lista-screen').classList.add('hidden');
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('tracker-screen').classList.add('hidden');

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
        
        // Se excluiu da tela principal, apenas renderiza a lista novamente.
        // Se estava com ele aberto (improvável por essa função, mas como precaução)
        if (livroAtualIndex === index) {
            livroAtualIndex = null;
        }
        
        renderLista();
    }
}

// Remove o livro quando você está dentro da tela do Tracker (mantive o funcionamento original)
function excluirLivroAtual() {
    excluirLivro(livroAtualIndex);
    navegarPara('lista');
}

// Salva as alterações no navegador
function salvarDados() {
    localStorage.setItem('livros', JSON.stringify(livros));
}