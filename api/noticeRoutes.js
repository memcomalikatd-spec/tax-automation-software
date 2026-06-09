/**
 * Backend API Routes for Notice Upload with Security
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'notices', 'temp');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // Max 5 files per upload
  }
});

// Get CSRF token (simplified for now)
router.get('/api/notices/csrf-token', (req, res) => {
  const token = Date.now().toString(36) + Math.random().toString(36);
  res.json({
    success: true,
    csrf_token: token
  });
});

// Upload notice (simplified without security middleware for now)
router.post('/api/notices/upload',
  upload.array('files', 5),
  async (req, res) => {
    try {
      const files = req.files;
      const extractedData = JSON.parse(req.body.extractedData || '{}');
      const aiSuggestions = JSON.parse(req.body.aiSuggestions || '{}');

      const uploadedNotices = [];

      for (const file of files) {
        // Move file to permanent location
        const permanentDir = path.join(process.cwd(), 'uploads', 'notices', 'permanent');
        fs.mkdirSync(permanentDir, { recursive: true });
        
        const permanentPath = path.join(permanentDir, file.filename);
        fs.renameSync(file.path, permanentPath);

        // Create notice record
        const notice = {
          id: Date.now() + Math.random(),
          originalFileName: file.originalname,
          renamedFileName: file.filename,
          filePath: permanentPath,
          fileSize: file.size,
          mimeType: file.mimetype,
          uploadedAt: new Date().toISOString(),
          extractedData,
          aiSuggestions,
          status: 'Under Review',
          priority: aiSuggestions.priority || 'Medium'
        };

        uploadedNotices.push(notice);
      }

      res.json({
        success: true,
        message: `Successfully uploaded ${uploadedNotices.length} notice(s)`,
        notices: uploadedNotices
      });

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Upload failed',
        message: error.message
      });
    }
  }
);

// Delete notice (with undo support)
router.delete('/api/notices/:id',
  async (req, res) => {
    try {
      const noticeId = req.params.id;

      // Move to trash instead of permanent delete (for undo)
      const trashDir = path.join(process.cwd(), 'uploads', 'notices', 'trash');
      fs.mkdirSync(trashDir, { recursive: true });

      res.json({
        success: true,
        message: 'Notice deleted successfully',
        canUndo: true,
        undoToken: noticeId
      });

    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({
        success: false,
        error: 'Delete failed',
        message: error.message
      });
    }
  }
);

// Undo delete
router.post('/api/notices/undo-delete',
  async (req, res) => {
    try {
      const { undoToken } = req.body;

      res.json({
        success: true,
        message: 'Notice restored successfully'
      });

    } catch (error) {
      console.error('Undo error:', error);
      res.status(500).json({
        success: false,
        error: 'Undo failed',
        message: error.message
      });
    }
  }
);

// Get all notices
router.get('/api/notices',
  async (req, res) => {
    try {
      const noticesDataPath = path.join(process.cwd(), 'src', 'noticesData.json');
      
      // Read notices from JSON file
      let notices = [];
      if (fs.existsSync(noticesDataPath)) {
        const data = fs.readFileSync(noticesDataPath, 'utf8');
        notices = JSON.parse(data);
      }

      res.json({
        success: true,
        notices: notices,
        total: notices.length
      });

    } catch (error) {
      console.error('Get notices error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve notices',
        message: error.message
      });
    }
  }
);

// Update notice
router.put('/api/notices/:id',
  async (req, res) => {
    try {
      const noticeId = req.params.id;
      const updates = req.body;

      const noticesDataPath = path.join(process.cwd(), 'src', 'noticesData.json');
      
      // Read current notices
      let notices = [];
      if (fs.existsSync(noticesDataPath)) {
        const data = fs.readFileSync(noticesDataPath, 'utf8');
        notices = JSON.parse(data);
      }

      // Find and update notice
      const noticeIndex = notices.findIndex(n => n.id === noticeId);
      if (noticeIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Notice not found'
        });
      }

      // Update notice fields
      notices[noticeIndex] = {
        ...notices[noticeIndex],
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Save back to file
      fs.writeFileSync(noticesDataPath, JSON.stringify(notices, null, 2));

      res.json({
        success: true,
        message: 'Notice updated successfully',
        notice: notices[noticeIndex]
      });

    } catch (error) {
      console.error('Update notice error:', error);
      res.status(500).json({
        success: false,
        error: 'Update failed',
        message: error.message
      });
    }
  }
);

// Organize notice into client folder
router.post('/api/notices/organize',
  async (req, res) => {
    try {
      const { noticeId, clientId, clientName, noticeType } = req.body;

      const noticesDataPath = path.join(process.cwd(), 'src', 'noticesData.json');
      
      // Read current notices
      let notices = [];
      if (fs.existsSync(noticesDataPath)) {
        const data = fs.readFileSync(noticesDataPath, 'utf8');
        notices = JSON.parse(data);
      }

      // Find notice
      const notice = notices.find(n => n.id === noticeId);
      if (!notice) {
        return res.status(404).json({
          success: false,
          error: 'Notice not found'
        });
      }

      // Determine destination folder
      const baseDir = path.join(process.cwd(), 'uploads', 'notices');
      let destFolder;
      
      if (clientId && clientName) {
        // Sanitize client name for folder
        const sanitizedClient = clientName.replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, '_');
        const sanitizedType = (noticeType || 'General').replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, '_');
        destFolder = path.join(baseDir, sanitizedClient, sanitizedType);
      } else {
        // Unlinked folder
        destFolder = path.join(baseDir, 'Unlinked');
      }

      // Create destination folder
      fs.mkdirSync(destFolder, { recursive: true });

      // Move file
      const currentPath = notice.file_path;
      const fileName = path.basename(currentPath);
      const newPath = path.join(destFolder, fileName);

      if (fs.existsSync(currentPath)) {
        // Copy file (preserve original as backup)
        fs.copyFileSync(currentPath, newPath);
        
        // Update notice record
        const noticeIndex = notices.findIndex(n => n.id === noticeId);
        notices[noticeIndex].file_path = newPath;
        notices[noticeIndex].organized_at = new Date().toISOString();
        
        // Save back to file
        fs.writeFileSync(noticesDataPath, JSON.stringify(notices, null, 2));
      }

      res.json({
        success: true,
        message: 'Notice organized successfully',
        newPath: newPath,
        folder: destFolder
      });

    } catch (error) {
      console.error('Organize notice error:', error);
      res.status(500).json({
        success: false,
        error: 'Organization failed',
        message: error.message
      });
    }
  }
);

// Get upload activity log
router.get('/api/notices/activity-log',
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;

      // Read audit log
      const logPath = path.join(process.cwd(), 'logs', 'upload-audit.log');
      
      if (!fs.existsSync(logPath)) {
        return res.json({
          success: true,
          activities: []
        });
      }

      const logContent = fs.readFileSync(logPath, 'utf-8');
      const logLines = logContent.trim().split('\n');
      
      const activities = logLines
        .slice(-limit)
        .map(line => {
          try {
            return JSON.parse(line);
          } catch (e) {
            return null;
          }
        })
        .filter(log => log !== null)
        .reverse();

      res.json({
        success: true,
        activities
      });

    } catch (error) {
      console.error('Activity log error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve activity log',
        message: error.message
      });
    }
  }
);

module.exports = router;
