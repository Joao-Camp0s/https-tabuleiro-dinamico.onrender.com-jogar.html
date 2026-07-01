const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// Servir ficheiros da raiz do projeto (um nível acima desta pasta js/)
app.use(express.static(path.join(__dirname, '..')));

// roomId -> { players: [socketId, ...], gameType: 'xadrez' | 'damas', criadoEm: number }
const salas = {};

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

function difundirListaSalas() {
    io.emit('rooms-updated', listaSalasPublicas());
}

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
    socket.emit('rooms-updated', listaSalasPublicas());

    socket.on('list-rooms', () => {
        socket.emit('rooms-updated', listaSalasPublicas());
    });

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

    socket.on('disconnect', () => {
        limparSocketDasSalas(socket);
        console.log('Utilizador desligado: ' + socket.id);
    });
});

http.listen(3000, () => {
    console.log('Sucesso! Abre http://localhost:3000/jogar.html');
});
