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