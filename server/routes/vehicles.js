const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireAdmin } = require('./auth');

const router = express.Router();
const prisma = new PrismaClient();

// Register vehicle (student/staff)
router.post('/register', verifyToken, async (req, res) => {
  try {
    const { plate, note } = req.body;

    if (!plate) {
      return res.status(400).json({ error: 'Plate number required' });
    }

    // Check if already registered
    const existing = await prisma.vehicleRegistration.findFirst({
      where: {
        moodle_id: req.user.moodle_id,
        plate: plate
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Vehicle already registered' });
    }

    // Create vehicle registration request
    const registration = await prisma.vehicleRegistration.create({
      data: {
        moodle_id: req.user.moodle_id,
        plate: plate,
        note: note || 'Vehicle access request',
        status: 'pending'
      }
    });

    res.json({
      success: true,
      message: 'Vehicle request submitted successfully',
      registration: registration
    });
  } catch (error) {
    console.error('Register vehicle error:', error);
    res.status(500).json({ error: 'Failed to register vehicle' });
  }
});

// Get pending vehicle registrations (admin only)
router.get('/pending', verifyToken, requireAdmin, async (req, res) => {
  try {
    const registrations = await prisma.vehicleRegistration.findMany({
      where: { status: 'pending' },
      include: {
        user: {
          select: {
            moodle_id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json(registrations);
  } catch (error) {
    console.error('Get pending vehicles error:', error);
    res.status(500).json({ error: 'Failed to get pending vehicle registrations' });
  }
});

// Approve vehicle registration (admin only)
router.post('/:plate/approve', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { note } = req.body;

    const registration = await prisma.vehicleRegistration.findFirst({
      where: { 
        plate: req.params.plate,
        status: 'pending'
      }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Pending registration not found' });
    }

    // Update registration status
    await prisma.vehicleRegistration.update({
      where: { id: registration.id },
      data: { 
        status: 'approved',
        note: note || 'Approved by admin'
      }
    });

    // Update user's vehicle plate
    await prisma.user.update({
      where: { moodle_id: registration.moodle_id },
      data: { vehicle_plate: req.params.plate }
    });

    res.json({ success: true, message: 'Vehicle registration approved' });
  } catch (error) {
    console.error('Approve vehicle error:', error);
    res.status(500).json({ error: 'Failed to approve vehicle registration' });
  }
});

// Deny vehicle registration (admin only)
router.post('/:plate/deny', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { note } = req.body;

    if (!note) {
      return res.status(400).json({ error: 'Note required for denial' });
    }

    const registration = await prisma.vehicleRegistration.findFirst({
      where: { 
        plate: req.params.plate,
        status: 'pending'
      }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Pending registration not found' });
    }

    await prisma.vehicleRegistration.update({
      where: { id: registration.id },
      data: { 
        status: 'denied',
        note
      }
    });

    res.json({ success: true, message: 'Vehicle registration denied' });
  } catch (error) {
    console.error('Deny vehicle error:', error);
    res.status(500).json({ error: 'Failed to deny vehicle registration' });
  }
});

// Get all vehicle registrations (admin only)
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};

    const registrations = await prisma.vehicleRegistration.findMany({
      where,
      include: {
        user: {
          select: {
            moodle_id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json(registrations);
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ error: 'Failed to get vehicle registrations' });
  }
});

// Get user's own vehicle requests
router.get('/my', verifyToken, async (req, res) => {
  try {
    const registrations = await prisma.vehicleRegistration.findMany({
      where: {
        moodle_id: req.user.moodle_id
      },
      orderBy: {
        created_at: "desc"
      }
    });

    res.json(registrations);
  } catch (error) {
    console.error('Get my vehicles error:', error);
    res.status(500).json({ error: 'Failed to get user vehicle requests' });
  }
});

module.exports = router;
