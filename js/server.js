// server.js — servidor Node que serve o site (ficheiros estáticos) e trata do multijogador online
// via Socket.io. Corre com "npm start" (ver package.json na raiz do projeto).
//
// Índice rápido deste ficheiro:
//   - Funções auxiliares das salas (gerarCodigoSala, listaSalasPublicas, difundirListaSalas, limparSocketDasSalas)
//   - io.on('connection', ...) -> onde ficam todos os eventos que o browser pode enviar/receber
//   - Arranque do servidor no fundo do ficheiro (http.listen)
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// Servir ficheiros da raiz do projeto (um nível acima desta pasta js/) — é assim que
// index.html, css/, js/, Imagem/, etc. ficam acessíveis diretamente pelo browser.
app.use(express.static(path.join(__dirname, '..')));

// Estado de todas as salas de jogo online, guardado em memória (perde-se ao reiniciar o servidor).
// roomId -> { players: [socketId, ...], gameType: 'xadrez' | 'damas', criadoEm: number }
const salas = {};

// Gera um código de sala único de 5 letras/números (evita caracteres ambíguos como 0/O e 1/I)
function gerarCodigoSala() {
    const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let codigo;
    do {
        codigo = Array.from({ length: 5 }, () => letras[Math.floor(Math.random() * letras.length)]).join('');
    } while (salas[codigo]);
    return codigo;
}

// Só mostra na lista pública as salas à espera de um segundo jogador
function listaSalasPublicas() {
    return Object.entries(salas)
        .filter(([, sala]) => sala.players.length === 1)
        .sort((a, b) => a[1].criadoEm - b[1].criadoEm)
        .map(([roomId, sala]) => ({ roomId, gameType: sala.gameType, criadoEm: sala.criadoEm }));
}

// Envia a lista de salas atualizada a TODOS os clientes ligados (não só ao que fez a alteração)
function difundirListaSalas() {
    io.emit('rooms-updated', listaSalasPublicas());
}

// Remove este socket da sala onde estava (se estiver nalguma) e avisa o adversário que ficou sozinho.
// Chamado tanto ao desligar como ao criar/entrar noutra sala (para nunca ficar em duas salas ao mesmo tempo).
function limparSocketDasSalas(socket) {
    const roomId = socket.data.roomId;
    if (!roomId || !salas[roomId]) return;

    salas[roomId].players = salas[roomId].players.filter((id) => id !== socket.id);
    socket.to(roomId).emit('opponent-left');

    if (salas[roomId].players.length === 0) {
        delete salas[roomId];
    }
    socket.data.roomId = null;
    difundirListaSalas();
}

io.on('connection', (socket) => {
    console.log('Utilizador ligado: ' + socket.id);
    socket.emit('rooms-updated', listaSalasPublicas()); // manda logo a lista atual ao ligar-se

    socket.on('list-rooms', () => {
        socket.emit('rooms-updated', listaSalasPublicas());
    });

    // Jogador cria uma sala nova e fica à espera de um adversário
    socket.on('create-room', ({ gameType }) => {
        limparSocketDasSalas(socket);

        const roomId = gerarCodigoSala();
        salas[roomId] = { players: [socket.id], gameType: gameType || 'xadrez', criadoEm: Date.now() };
        socket.join(roomId);
        socket.data.roomId = roomId;

        socket.emit('room-waiting', { roomId, gameType: salas[roomId].gameType });
        console.log(socket.id + ' criou a sala "' + roomId + '"');
        difundirListaSalas();
    });

    // Jogador entra numa sala existente (por código ou a partir da lista). Quando fica com 2 jogadores,
    // faz-se logo o sorteio de cores e avisam-se os dois lados.
    socket.on('join-room', ({ roomId }) => {
        if (!roomId || !salas[roomId]) {
            socket.emit('room-not-found');
            return;
        }

        const sala = salas[roomId];
        if (sala.players.length >= 2) {
            socket.emit('room-full');
            return;
        }

        limparSocketDasSalas(socket);
        sala.players.push(socket.id);
        socket.join(roomId);
        socket.data.roomId = roomId;

        if (sala.players.length === 2) {
            // Coinflip: sorteia aleatoriamente quem fica com as Brancas
            const primeiroFicaBrancas = Math.random() < 0.5;
            const corJogador1 = primeiroFicaBrancas ? 'brancas' : 'pretas';
            const corJogador2 = primeiroFicaBrancas ? 'pretas' : 'brancas';

            io.to(sala.players[0]).emit('game-start', { roomId, cor: corJogador1, gameType: sala.gameType });
            io.to(sala.players[1]).emit('game-start', { roomId, cor: corJogador2, gameType: sala.gameType });
            console.log('Sala "' + roomId + '" completa — sorteio de cores feito.');
        } else {
            socket.emit('room-waiting', { roomId, gameType: sala.gameType });
        }

        difundirListaSalas();
    });

    // Reencaminha uma jogada para o adversário na mesma sala — o servidor não valida a jogada,
    // só a repassa (a validação das regras do jogo é feita no browser, em jogar.html)
    socket.on('movimento', (dados) => {
        if (socket.data.roomId) {
            socket.to(socket.data.roomId).emit('movimento-remoto', dados);
        }
    });

    socket.on('reiniciar-jogo', () => {
        if (socket.data.roomId) {
            socket.to(socket.data.roomId).emit('jogo-reiniciado');
        }
    });

    // Se o jogador fechar a aba ou perder ligação, sai automaticamente da sala em que estava
    socket.on('disconnect', () => {
        limparSocketDasSalas(socket);
        console.log('Utilizador desligado: ' + socket.id);
    });
});

// O Render (e serviços semelhantes) atribuem a porta dinamicamente via process.env.PORT;
// em localhost, sem essa variável definida, usa-se a 3000 por omissão.
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log('Sucesso! Abre http://localhost:' + PORT + '/jogar.html');
});
