const apiBase = window.location.origin + '/api';
let token = localStorage.getItem('token') || null;
const socket = io();

let me = null;
let currentChatUser = null;

const el = id => document.getElementById(id);
const authSection = el('auth');
const chatSection = el('chat');
const authMsg = el('authMsg');
const usersList = el('usersList');
const chatBox = el('chatBox');

el('signupBtn').addEventListener('click', signup);
el('loginBtn').addEventListener('click', login);
el('logoutBtn').addEventListener('click', logout);
el('sendBtn').addEventListener('click', sendMsg);

async function signup(){
  const email = el('email').value.trim();
  const password = el('password').value;
  const name = el('name').value.trim();
  if(!email||!password) { authMsg.textContent='اكتب بريد وكلمة مرور'; return; }
  try {
    const res = await fetch(apiBase + '/signup', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email, password, name })
    });
    const data = await res.json();
    if(data.error) { authMsg.textContent = data.error; return; }
    localStorage.setItem('token', data.token);
    token = data.token;
    me = data.user;
    startChat();
  } catch (err) { authMsg.textContent = 'حصل خطأ'; console.error(err); }
}

async function login(){
  const email = el('email').value.trim();
  const password = el('password').value;
  if(!email||!password) { authMsg.textContent='اكتب بريد وكلمة مرور'; return; }
  try {
    const res = await fetch(apiBase + '/login', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if(data.error) { authMsg.textContent = data.error; return; }
    localStorage.setItem('token', data.token);
    token = data.token;
    me = data.user;
    startChat();
  } catch (err) { authMsg.textContent = 'حصل خطأ'; console.error(err); }
}

function logout(){
  localStorage.removeItem('token');
  token = null;
  me = null;
  socket.emit('identify', null);
  chatSection.style.display = 'none';
  authSection.style.display = 'block';
}

async function startChat(){
  el('meName').textContent = me.name + ' (' + me.email + ')';
  authSection.style.display = 'none';
  chatSection.style.display = 'block';
  // identify to socket
  socket.emit('identify', token);
  loadUsers();
}

async function loadUsers(){
  try {
    const res = await fetch('/api/users', { headers: { 'Authorization': 'Bearer ' + token } });
    const users = await res.json();
    usersList.innerHTML = '';
    users.filter(u=>u.email !== me.email).forEach(u=>{
      const b = document.createElement('button');
      b.textContent = u.name + ' — ' + u.email;
      b.onclick = ()=> openChatWith(u.email, u.name);
      usersList.appendChild(b);
    });
  } catch (err) { console.error(err); }
}

function openChatWith(email, name){
  currentChatUser = email;
  chatBox.innerHTML = '';
  // load past messages via server-side (simple approach: ask server for chat history via /chat)
  fetch('/api/chat_history?user1=' + encodeURIComponent(me.email) + '&user2=' + encodeURIComponent(email), { headers: { 'Authorization': 'Bearer ' + token } })
    .then(r=>r.json())
    .then(list=>{
      list.forEach(m=>{
        appendMessage(m);
      });
    }).catch(()=>{});
}

function appendMessage(m){
  const d = document.createElement('div');
  d.className = 'message';
  const who = (m.from === me.email) ? 'أنت' : m.from;
  d.textContent = '[' + new Date(m.time).toLocaleTimeString() + '] ' + who + ': ' + m.text;
  chatBox.appendChild(d);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function sendMsg(){
  const txt = el('messageInput').value.trim();
  if(!txt || !currentChatUser) return;
  const payload = { from: me.email, to: currentChatUser, text: txt };
  socket.emit('private_message', payload);
  el('messageInput').value = '';
}

// socket events
socket.on('private_message', (msg) => {
  // if the message belongs to current open chat, append
  if((msg.from === currentChatUser && msg.to === me.email) || (msg.to === currentChatUser && msg.from === me.email) || msg.from === me.email) {
    appendMessage(msg);
  }
});

socket.on('online_users', (list) => {
  // mark online users in usersList buttons
  Array.from(usersList.children).forEach(btn=>{
    const email = btn.textContent.split('—').pop().trim();
    if(list.includes(email)) btn.style.background = '#e6f7ff';
    else btn.style.background = '#f4f6ff';
  });
});
