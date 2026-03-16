const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireAdmin } = require('./auth');
const presenceService = require('../services/presenceService');

const router = express.Router();
const prisma = new PrismaClient();

// Create access log with presence tracking
router.post('/', async (req, res) => {
  try {
    const { 
      moodle_id, 
      method, 
      direction, 
      success, 
      confidence, 
      plate_detected, 
      note 
    } = req.body;

    if (!moodle_id || !method || !direction || success === undefined) {
      return res.status(400).json({ 
        error: 'moodle_id, method, direction, and success are required' 
      });
    }

    // Validate entry/exit based on presence rules
    if (direction === 'entry') {
      const validation = await presenceService.validateEntry(moodle_id, method, plate_detected);
      if (!validation.valid) {
        return res.json({ 
          success: false, 
          error: validation.errors.join(', '),
          requiresExit: validation.errors.some(err => err.includes('already inside'))
        });
      }
    } else if (direction === 'exit') {
      const validation = await presenceService.validateExit(moodle_id, method, plate_detected);
      if (!validation.valid) {
        return res.json({ 
          success: false, 
          error: validation.errors.join(', '),
          requiresEntry: validation.errors.some(err => err.includes('No active'))
        });
      }
    }

    // Create the access log
    const log = await prisma.accessLog.create({
      data: {
        moodle_id,
        method,
        direction,
        success,
        confidence,
        plate_detected,
        note
      }
    });

    // Update presence if successful
    if (success) {
      if (direction === 'entry') {
        await presenceService.createEntry(moodle_id, method, plate_detected);
      } else if (direction === 'exit') {
        await presenceService.createExit(moodle_id, method, plate_detected);
      }
    }

    res.json(log);
  } catch (error) {
    console.error('Create log error:', error);
    res.status(500).json({ error: 'Failed to create access log' });
  }
});

// Get access logs (admin only)
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { 
      moodle_id, 
      method, 
      direction, 
      success, 
      start_date, 
      end_date,
      limit = 100,
      offset = 0
    } = req.query;

    const where = {};

    if (moodle_id) where.moodle_id = moodle_id;
    if (method) where.method = method;
    if (direction) where.direction = direction;
    if (success !== undefined) where.success = success === 'true';

    if (start_date || end_date) {
      where.timestamp = {};
      if (start_date) where.timestamp.gte = new Date(start_date);
      if (end_date) where.timestamp.lte = new Date(end_date);
    }

    const logs = await prisma.accessLog.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            role: true,
            year: true,
            division: true
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    res.json(logs);
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Failed to get access logs' });
  }
});

// Get user's own logs
router.get('/my', verifyToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const logs = await prisma.accessLog.findMany({
      where: { moodle_id: req.user.moodle_id },
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    res.json(logs);
  } catch (error) {
    console.error('Get user logs error:', error);
    res.status(500).json({ error: 'Failed to get user logs' });
  }
});

// Get recent logs for dashboard
router.get('/recent', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const logs = await prisma.accessLog.findMany({
      include: {
        user: {
          select: {
            name: true,
            role: true,
            year: true,
            division: true
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit)
    });

    res.json(logs);
  } catch (error) {
    console.error('Get recent logs error:', error);
    res.status(500).json({ error: 'Failed to get recent logs' });
  }
});

// Get current presences (admin only)
router.get('/presence', verifyToken, requireAdmin, async (req, res) => {
  try {
    const presences = await presenceService.getAllCurrentPresences();
    res.json(presences);
  } catch (error) {
    console.error('Get presence error:', error);
    res.status(500).json({ error: 'Failed to get current presences' });
  }
});

// Force clear presence (admin only)
router.post('/presence/:id/clear', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    await presenceService.forceClearPresence(id, reason);
    res.json({ success: true, message: 'Presence cleared successfully' });
  } catch (error) {
    console.error('Force clear presence error:', error);
    res.status(500).json({ error: 'Failed to clear presence' });
  }
});

module.exports = router;
