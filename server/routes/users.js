const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireAdmin } = require('./auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get current user profile
router.get('/me', verifyToken, async (req, res) => {
  try {
  const user = await prisma.user.findUnique({
      where: { moodle_id: req.user.moodle_id },
      select: {
        moodle_id: true,
        name: true,
        role: true,
        vehicle_plate: true,
        face_template: true,
        status: true,
        year: true,
        division: true,
        created_at: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

  res.json({
      ...user,
      face_enrolled: !!user.face_template,
      year: user.year ?? null,
      division: user.division ?? null
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Update current user profile
router.patch('/me', verifyToken, async (req, res) => {
  try {
    const { name, vehicle_plate } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (vehicle_plate !== undefined) updateData.vehicle_plate = vehicle_plate;

    const user = await prisma.user.update({
      where: { moodle_id: req.user.moodle_id },
      data: updateData,
      select: {
        moodle_id: true,
        name: true,
        role: true,
        vehicle_plate: true,
        face_template: true,
        status: true
      }
    });

    res.json({
      ...user,
      face_enrolled: !!user.face_template
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Get all users (admin only)
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { search, role, status } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { moodle_id: { contains: search } },
        { name: { contains: search } }
      ];
    }
    if (role) where.role = role;
    if (status) where.status = status;

    const users = await prisma.user.findMany({
      where,
      select: {
        moodle_id: true,
        name: true,
        role: true,
        vehicle_plate: true,
        face_template: true,
        status: true,
        created_at: true,
        updated_at: true
      },
      orderBy: { created_at: 'desc' }
    });

    res.json(users.map(user => ({
      ...user,
      face_enrolled: !!user.face_template
    })));
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Update user (admin only)
router.patch('/:moodle_id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, role, vehicle_plate, status, reset_face } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (vehicle_plate !== undefined) updateData.vehicle_plate = vehicle_plate;
    if (status) updateData.status = status;
    if (reset_face) updateData.face_template = null;

    const user = await prisma.user.update({
      where: { moodle_id: req.params.moodle_id },
      data: updateData,
      select: {
        moodle_id: true,
        name: true,
        role: true,
        vehicle_plate: true,
        face_template: true,
        status: true
      }
    });

    res.json({
      ...user,
      face_enrolled: !!user.face_template
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Get user by moodle_id (public for scanning)
router.get('/:moodle_id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { moodle_id: req.params.moodle_id },
      select: {
        moodle_id: true,
        name: true,
        role: true,
        vehicle_plate: true,
        face_template: true,
        status: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      ...user,
      face_enrolled: !!user.face_template
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Delete user and all related records (admin only)
router.delete('/:moodle_id', verifyToken, requireAdmin, async (req, res) => {
  const moodleId = req.params.moodle_id;
  try {
    // Ensure user exists
    const existing = await prisma.user.findUnique({ where: { moodle_id: moodleId } });
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Perform cascading deletion of related records
    await prisma.$transaction([
      prisma.accessLog.deleteMany({ where: { moodle_id: moodleId } }),
      prisma.vehicleRegistration.deleteMany({ where: { moodle_id: moodleId } }),
      prisma.presence.deleteMany({ where: { moodle_id: moodleId } }),
      prisma.attendance.deleteMany({ where: { moodle_id: moodleId } }),
      prisma.studentRegistration.deleteMany({ where: { moodle_id: moodleId } }),
      prisma.user.delete({ where: { moodle_id: moodleId } })
    ]);

    res.json({ success: true, message: `Deleted user ${moodleId} and all related records` });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user and related records' });
  }
});

module.exports = router;
