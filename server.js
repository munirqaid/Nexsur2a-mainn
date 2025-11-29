require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3000;
const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nexora';
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))));

// --- JWT middleware
function authMiddleware(req, res, next){
  const authHeader = req.headers['authorization'];
  if(!authHeader) return res.status(401).json({ error: 'No token' });
  const token = authHeader.split(' ')[1];
  try{
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data;
    next();
  }catch(e){
    return res.status(401).json({ error: 'Invalid token' });
  }
}


// --- Mongoose models
mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  passwordHash: String,
  name: String,
  lastSeen: Number
});
const User = mongoose.model('User', userSchema);

const msgSchema = new mongoose.Schema({
  from: String,
  to: String,
  text: String,
  time: Number
});
const Message = mongoose.model('Message', msgSchema);

// --- Auth routes
app.post('/api/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already used' });
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const user = new User({ email, passwordHash, name: name || email.split('@')[0], lastSeen: Date.now() });
    await user.save();
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET);
    res.json({ token, user: { email: user.email, name: user.name }});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
    user.lastSeen = Date.now();
    await user.save();
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET);
    res.json({ token, user: { email: user.email, name: user.name }});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Protected example: get users
app.get('/api/users', authMiddleware, async (req, res) => {
  try {
    const users = await User.find({}, { passwordHash: 0, __v: 0 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Chat history endpoint
app.get('/api/chat_history', authMiddleware, async (req, res) => {
  try{
    const { user1, user2 } = req.query;
    if(!user1 || !user2) return res.status(400).json({ error: 'missing parameters' });
    const msgs = await Message.find({
      $or:[
        { from: user1, to: user2 },
        { from: user2, to: user1 }
      ]
    }).sort({ time: 1 });
    res.json(msgs);
  }catch(err){ res.status(500).json({ error: 'server error' }); }
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Socket.IO real-time private messaging
const online = {}; // email -> socket.id

io.on('connection', (socket) => {
  // when a client authenticates over socket (send token)
  socket.on('identify', (token) => {
    try{
      const data = jwt.verify(token, JWT_SECRET);
      const email = data.email;
      if(!email) return;
      online[email] = socket.id;
      socket.email = email;
      io.emit('online_users', Object.keys(online)); // broadcast online users
    }catch(e){ /* invalid token - ignore */ }
  });

  socket.on('private_message', async (data) => {
    // data: { from, to, text }
    if (!data || !data.to || !data.from) return;
    const msg = new Message({ from: data.from, to: data.to, text: data.text, time: Date.now() });
    await msg.save();
    // send to recipient if online
    const toSocket = online[data.to];
    if (toSocket) {
      io.to(toSocket).emit('private_message', msg);
    }
    // also echo back to sender
    socket.emit('private_message', msg);
  });

  socket.on('disconnect', () => {
    if (socket.email) {
      delete online[socket.email];
      io.emit('online_users', Object.keys(online));
    }
  });
});

server.listen(PORT, () => console.log('Server listening on', PORT));
