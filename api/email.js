const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const serverless = require('serverless-http');

const app = express();
app.use(cors());
app.use(express.json());

let transporter = null;

function initializeTransporter(config) {
  transporter = nodemailer.createTransport({
    host: config.host || 'smtp.gmail.com',
    port: parseInt(config.port) || 587,
    secure: config.secure === 'true',
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

app.post('/api/email/configure', (req, res) => {
  try {
    initializeTransporter(req.body);
    res.json({ success: true, message: 'Email configured successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/email/test', async (req, res) => {
  if (!transporter) return res.status(400).json({ success: false, error: 'Email not configured' });
  try {
    await transporter.verify();
    res.json({ success: true, message: 'Email connection successful' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/email/send', async (req, res) => {
  if (!transporter) return res.status(400).json({ success: false, error: 'Email not configured' });
  try {
    const { to, subject, html, attachments } = req.body;
    const info = await transporter.sendMail({
      from: transporter.options.auth.user,
      to, subject, html, attachments,
    });
    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/email/send-bulk', async (req, res) => {
  if (!transporter) return res.status(400).json({ success: false, error: 'Email not configured' });
  try {
    const { recipients, subject, html } = req.body;
    const results = [];
    for (const to of recipients) {
      try {
        const info = await transporter.sendMail({
          from: transporter.options.auth.user,
          to, subject, html,
        });
        results.push({ to, success: true, messageId: info.messageId });
      } catch (err) {
        results.push({ to, success: false, error: err.message });
      }
    }
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/email/send-automated-reminders', async (req, res) => {
  if (!transporter) return res.status(400).json({ success: false, error: 'Email not configured' });
  try {
    const { clients } = req.body;
    const results = [];
    for (const client of clients) {
      try {
        const info = await transporter.sendMail({
          from: transporter.options.auth.user,
          to: client.email,
          subject: `Tax Return Reminder - ${client.name}`,
          html: `<p>Dear ${client.name},</p><p>This is a reminder for your tax return.</p>`,
        });
        results.push({ to: client.email, success: true, messageId: info.messageId });
      } catch (err) {
        results.push({ to: client.email, success: false, error: err.message });
      }
    }
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = serverless(app);
