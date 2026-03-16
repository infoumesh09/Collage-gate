const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireAdmin } = require('./auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get settings
router.get('/', async (req, res) => {
  try {
    let settings = await prisma.setting.findFirst();

    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.setting.create({
        data: {
          face_threshold: 0.6,
          allow_manual: false,
          max_retries: 3
        }
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Update settings (admin only)
router.patch('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { face_threshold, allow_manual, max_retries } = req.body;
    const updateData = {};

    if (face_threshold !== undefined) {
      if (face_threshold < 0 || face_threshold > 1) {
        return res.status(400).json({ error: 'Face threshold must be between 0 and 1' });
      }
      updateData.face_threshold = face_threshold;
    }

    if (allow_manual !== undefined) {
      updateData.allow_manual = allow_manual;
    }

    if (max_retries !== undefined) {
      if (max_retries < 1 || max_retries > 10) {
        return res.status(400).json({ error: 'Max retries must be between 1 and 10' });
      }
      updateData.max_retries = max_retries;
    }

    let settings = await prisma.setting.findFirst();

    if (!settings) {
      settings = await prisma.setting.create({
        data: {
          face_threshold: 0.6,
          allow_manual: false,
          max_retries: 3,
          ...updateData
        }
      });
    } else {
      settings = await prisma.setting.update({
        where: { id: settings.id },
        data: updateData
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;
