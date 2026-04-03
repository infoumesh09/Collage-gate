const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireAdmin } = require('./auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get today's statistics
router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [entries, exits, denied] = await Promise.all([
      prisma.accessLog.count({
        where: {
          direction: 'entry',
          success: true,
          timestamp: {
            gte: today,
            lt: tomorrow
          }
        }
      }),
      prisma.accessLog.count({
        where: {
          direction: 'exit',
          success: true,
          timestamp: {
            gte: today,
            lt: tomorrow
          }
        }
      }),
      prisma.accessLog.count({
        where: {
          success: false,
          timestamp: {
            gte: today,
            lt: tomorrow
          }
        }
      })
    ]);

    res.json({
      entries,
      exits,
      denied,
      total_attempts: entries + exits + denied
    });
  } catch (error) {
    console.error('Get today stats error:', error);
    res.status(500).json({ error: 'Failed to get today statistics' });
  }
});

// Get historical daily statistics (last N days)
router.get('/daily', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '30', 10);
    const stats = await prisma.dailyStat.findMany({
      orderBy: { date: 'desc' },
      take: limit
    });

    res.json(stats);
  } catch (error) {
    console.error('Get daily stats error:', error);
    res.status(500).json({ error: 'Failed to get daily statistics' });
  }
});

// Admin: force archive for a given date (YYYY-MM-DD)
router.post('/archive', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { date } = req.body; // e.g., '2025-11-25'
    const target = date ? new Date(date + 'T00:00:00') : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const archiveDate = target || new Date(today.getTime() - 24 * 60 * 60 * 1000);

    const start = new Date(archiveDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const [entries, exits, denied] = await Promise.all([
      prisma.accessLog.count({ where: { direction: 'entry', success: true, timestamp: { gte: start, lt: end } } }),
      prisma.accessLog.count({ where: { direction: 'exit', success: true, timestamp: { gte: start, lt: end } } }),
      prisma.accessLog.count({ where: { success: false, timestamp: { gte: start, lt: end } } })
    ]);

    const total_attempts = entries + exits + denied;

    const saved = await prisma.dailyStat.upsert({
      where: { date: start },
      update: { entries, exits, denied, total_attempts },
      create: { date: start, entries, exits, denied, total_attempts }
    });

    res.json({ success: true, archived: saved });
  } catch (error) {
    console.error('Archive daily stats error:', error);
    res.status(500).json({ error: 'Failed to archive daily statistics' });
  }
});

// Get currently inside count and list of people
router.get('/inside', verifyToken, requireAdmin, async (req, res) => {
  try {
    const presences = await prisma.presence.findMany({
      where: { 
        status: 'inside'
      },
      include: {
        user: {
          select: {
            name: true,
            role: true,
            year: true,
            division: true,
            vehicle_plate: true
          }
        }
      },
      orderBy: {
        entered_at: 'desc'
      }
    });

    res.json({
      currently_inside: presences.length,
      inside_users: presences.map(p => ({
        moodle_id: p.moodle_id,
        name: p.user.name,
        role: p.user.role,
        year: p.user.year,
        division: p.user.division,
        plate: p.plate || p.user.vehicle_plate,
        entered_at: p.entered_at,
        type: p.type
      }))
    });
  } catch (error) {
    console.error('Get inside stats error:', error);
    res.status(500).json({ error: 'Failed to get inside statistics' });
  }
});

// Get dashboard statistics (admin only)
router.get('/dashboard', verifyToken, requireAdmin, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      todayEntries,
      todayExits,
      todayDenied,
      totalUsers,
      activeUsers,
      faceEnrolledUsers,
      vehicleRegisteredUsers
    ] = await Promise.all([
      prisma.accessLog.count({
        where: {
          direction: 'entry',
          success: true,
          timestamp: { gte: today, lt: tomorrow }
        }
      }),
      prisma.accessLog.count({
        where: {
          direction: 'exit',
          success: true,
          timestamp: { gte: today, lt: tomorrow }
        }
      }),
      prisma.accessLog.count({
        where: {
          success: false,
          timestamp: { gte: today, lt: tomorrow }
        }
      }),
      prisma.user.count(),
      prisma.user.count({ where: { status: 'active' } }),
      prisma.user.count({ where: { face_template: { not: null } } }),
      prisma.user.count({ where: { vehicle_plate: { not: null } } })
    ]);

    // Get currently inside count based on presence (anyone marked as 'inside')
    const presences = await prisma.presence.findMany({
      where: { 
        status: 'inside'
      },
      select: { moodle_id: true }
    });
    const insideSet = new Set(presences.map(p => p.moodle_id));

    res.json({
      today: {
        entries: todayEntries,
        exits: todayExits,
        denied: todayDenied,
        total_attempts: todayEntries + todayExits + todayDenied
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        face_enrolled: faceEnrolledUsers,
        vehicle_registered: vehicleRegisteredUsers
      },
      currently_inside: insideSet.size
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to get dashboard statistics' });
  }
});

module.exports = router;
