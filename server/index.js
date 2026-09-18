const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});

const DEFAULT_DURATION = 20 * 60; // 20 minutos por padrão

// Armazena o estado de cada sala na memória
// roomName -> { totalSeconds, remainingSeconds, status, startedAt, endAt, message, updatedAt }
const rooms = new Map();

function getRoomState(roomName) {
  if (!rooms.has(roomName)) {
    rooms.set(roomName, {
      room: roomName,
      totalSeconds: DEFAULT_DURATION,
      remainingSeconds: DEFAULT_DURATION,
      status: 'idle', // 'idle' | 'running' | 'paused' | 'ended'
      endAt: null,
      message: '',
      updatedAt: Date.now()
    });
  }
  return rooms.get(roomName);
}

function updateRoomState(roomName, updates) {
  const current = getRoomState(roomName);
  const next = {
    ...current,
    ...updates,
    updatedAt: Date.now()
  };
  rooms.set(roomName, next);
  io.to(roomName).emit('room-state', next);
  return next;
}

// Loop de sincronização (executado a cada segundo)
setInterval(() => {
  const now = Date.now();
  rooms.forEach((state, roomName) => {
    if (state.status === 'running' && state.endAt) {
      const remainingMs = state.endAt - now;
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));

      if (remainingSec <= 0) {
        updateRoomState(roomName, {
          remainingSeconds: 0,
          status: 'ended',
          endAt: null
        });
      } else {
        // Atualiza os segundos restantes e notifica os clientes
        state.remainingSeconds = remainingSec;
        state.updatedAt = now;
        io.to(roomName).emit('room-state', state);
      }
    }
  });
}, 1000);

io.on('connection', (socket) => {
  let currentRoom = null;

  socket.on('join-room', (roomName) => {
    const cleanRoom = (roomName || 'palestra-01').trim().toLowerCase();
    
    if (currentRoom) {
      socket.leave(currentRoom);
    }

    currentRoom = cleanRoom;
    socket.join(cleanRoom);

    // Envia o estado atual imediatamente para o cliente que acabou de se conectar
    const state = getRoomState(cleanRoom);
    socket.emit('room-state', state);
    console.log(`[Socket] Cliente ${socket.id} entrou na sala: ${cleanRoom}`);
  });

  socket.on('start', ({ room }) => {
    const targetRoom = room || currentRoom || 'palestra-01';
    const state = getRoomState(targetRoom);

    if (state.status === 'running') return;

    let remaining = state.remainingSeconds;
    if (remaining <= 0) {
      remaining = state.totalSeconds;
    }

    const endAt = Date.now() + (remaining * 1000);
    updateRoomState(targetRoom, {
      status: 'running',
      remainingSeconds: remaining,
      endAt
    });
    console.log(`[Timer] Iniciado na sala ${targetRoom} com ${remaining}s restantes`);
  });

  socket.on('pause', ({ room }) => {
    const targetRoom = room || currentRoom || 'palestra-01';
    const state = getRoomState(targetRoom);

    if (state.status !== 'running') return;

    let remaining = state.remainingSeconds;
    if (state.endAt) {
      remaining = Math.max(0, Math.ceil((state.endAt - Date.now()) / 1000));
    }

    updateRoomState(targetRoom, {
      status: 'paused',
      remainingSeconds: remaining,
      endAt: null
    });
    console.log(`[Timer] Pausado na sala ${targetRoom} com ${remaining}s`);
  });

  socket.on('reset', ({ room, totalSeconds }) => {
    const targetRoom = room || currentRoom || 'palestra-01';
    const state = getRoomState(targetRoom);
    const duration = totalSeconds ? Number(totalSeconds) : state.totalSeconds;

    updateRoomState(targetRoom, {
      status: 'idle',
      totalSeconds: duration,
      remainingSeconds: duration,
      endAt: null,
      message: ''
    });
    console.log(`[Timer] Resetado na sala ${targetRoom} para ${duration}s`);
  });

  socket.on('set-time', ({ room, seconds }) => {
    const targetRoom = room || currentRoom || 'palestra-01';
    const state = getRoomState(targetRoom);
    const duration = Math.max(1, Number(seconds));

    let endAt = null;
    if (state.status === 'running') {
      endAt = Date.now() + (duration * 1000);
    }

    updateRoomState(targetRoom, {
      totalSeconds: duration,
      remainingSeconds: duration,
      endAt
    });
    console.log(`[Timer] Definido tempo na sala ${targetRoom} para ${duration}s`);
  });

  socket.on('adjust-time', ({ room, deltaSeconds }) => {
    const targetRoom = room || currentRoom || 'palestra-01';
    const state = getRoomState(targetRoom);
    const delta = Number(deltaSeconds) || 0;

    let remaining = state.remainingSeconds;
    if (state.status === 'running' && state.endAt) {
      remaining = Math.max(0, Math.ceil((state.endAt - Date.now()) / 1000));
    }

    remaining = Math.max(0, remaining + delta);

    let endAt = null;
    if (state.status === 'running') {
      endAt = Date.now() + (remaining * 1000);
    }

    updateRoomState(targetRoom, {
      remainingSeconds: remaining,
      endAt,
      status: remaining === 0 ? 'ended' : state.status
    });
    console.log(`[Timer] Ajustado tempo na sala ${targetRoom} por ${delta}s -> novo restante: ${remaining}s`);
  });

  socket.on('flash', ({ room }) => {
    const targetRoom = room || currentRoom || 'palestra-01';
    io.to(targetRoom).emit('flash');
    console.log(`[Alert] Flash disparado na sala ${targetRoom}`);
  });

  socket.on('set-message', ({ room, message }) => {
    const targetRoom = room || currentRoom || 'palestra-01';
    updateRoomState(targetRoom, {
      message: message ? String(message).trim() : ''
    });
    console.log(`[Message] Mensagem definida na sala ${targetRoom}: "${message}"`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Desconectado: ${socket.id}`);
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'stage-timer-backend',
    uptime: process.uptime(),
    activeRooms: rooms.size,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/rooms', (req, res) => {
  const result = [];
  rooms.forEach((state, name) => {
    result.push(state);
  });
  res.json(result);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Stage Timer Backend rodando na porta ${PORT}`);
});
