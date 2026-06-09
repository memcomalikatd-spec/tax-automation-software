const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = path.join('/tmp', 'noticesData.json');

function loadNotices() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch (e) { console.error('Error loading notices:', e); }
  return [];
}

function saveNotices(notices) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(notices, null, 2));
  } catch (e) { console.error('Error saving notices:', e); }
}

app.get('/api/notices', (req, res) => {
  const notices = loadNotices();
  res.json({ success: true, data: notices });
});

app.get('/api/notices/csrf-token', (req, res) => {
  const token = Date.now().toString(36) + Math.random().toString(36);
  res.json({ success: true, csrf_token: token });
});

app.put('/api/notices/:id', (req, res) => {
  const notices = loadNotices();
  const idx = notices.findIndex(n => n.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Notice not found' });
  notices[idx] = { ...notices[idx], ...req.body };
  saveNotices(notices);
  res.json({ success: true, data: notices[idx] });
});

app.delete('/api/notices/:id', (req, res) => {
  let notices = loadNotices();
  notices = notices.filter(n => n.id !== req.params.id);
  saveNotices(notices);
  res.json({ success: true });
});

app.post('/api/notices/organize', (req, res) => {
  const { noticeId, targetPath } = req.body;
  res.json({ success: true, message: 'Organized successfully (mock)' });
});

module.exports = serverless(app);
