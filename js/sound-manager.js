// Efeitos sonoros do jogo, gerados via Web Audio API (sem ficheiros externos)
window.SoundManager = (function () {
    let ctx = null;
    let muted = localStorage.getItem('soundMuted') === 'true';

    function getCtx() {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return null;
        if (!ctx) ctx = new AudioContextClass();
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    }

    // Toca uma única nota. freq = frequência (Hz), startTime = quando começa (segundos desde o início do contexto),
    // duration = quanto dura, type = forma de onda ('sine', 'square', 'triangle'...), gain = volume (0-1).
    function tone(audioCtx, freq, startTime, duration, type, gain) {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.03);
    }

    // Toca uma sequência de notas (array de [freq, atraso, duração, tipo, volume]) — é assim que se compõem
    // os "efeitos" abaixo (ex: captura = duas notas em sequência para soar diferente de uma jogada normal)
    function play(sequence) {
        if (muted) return;
        const audioCtx = getCtx();
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        sequence.forEach(function (step) {
            tone(audioCtx, step[0], now + step[1], step[2], step[3] || 'sine', step[4] || 0.16);
        });
    }

    // API pública usada em jogar.html: SoundManager.move(), SoundManager.capture(), etc.
    return {
        move: function () { play([[520, 0, 0.09, 'sine', 0.14]]); },
        capture: function () { play([[420, 0, 0.08, 'triangle', 0.2], [280, 0.06, 0.12, 'triangle', 0.16]]); },
        check: function () { play([[880, 0, 0.09, 'square', 0.1], [1046, 0.09, 0.12, 'square', 0.1]]); },
        gameOver: function () { play([[523, 0, 0.12, 'sine', 0.18], [659, 0.12, 0.12, 'sine', 0.18], [784, 0.24, 0.24, 'sine', 0.2]]); },
        isMuted: function () { return muted; },
        toggleMute: function () {
            muted = !muted;
            localStorage.setItem('soundMuted', String(muted));
            return muted;
        }
    };
})();
