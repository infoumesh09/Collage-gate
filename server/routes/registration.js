const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireAdmin } = require('./auth');

const router = express.Router();
const prisma = new PrismaClient();

// Submit student registration request
router.post('/request', async (req, res) => {
  try {
    console.log('Registration request received:', {
      body_keys: Object.keys(req.body),
      has_moodle_id: !!req.body.moodle_id,
      has_name: !!req.body.name,
      has_photo: !!req.body.photo,
      photo_length: req.body.photo?.length,
      has_face_descriptor: !!req.body.face_descriptor
    });
    
    const { moodle_id, name, email, note, photo, face_descriptor, year, division } = req.body;

    if (!moodle_id || !name) {
      return res.status(400).json({ error: 'Moodle ID and name are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { moodle_id }
    });

    // Allow registration even if user exists; admin approval will update the user
    // This supports the case where a user was created earlier without face enrollment

    // Check if there's already a pending request
    const existingRequest = await prisma.studentRegistration.findFirst({
      where: {
        moodle_id,
        status: 'pending'
      }
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'A registration request for this Moodle ID is already pending' });
    }

    // Create registration request
    const registration = await prisma.studentRegistration.create({
      data: {
        moodle_id,
        name,
        email,
        note: note || 'Student registration request',
        status: 'pending',
        photo, // Store the photo in the registration request
        face_descriptor: face_descriptor ? (
          // If face_descriptor is already a string, use it directly
          // Otherwise, stringify it
          typeof face_descriptor === 'string' ? face_descriptor : JSON.stringify(face_descriptor)
        ) : null,
        year: year || null,
        division: division || null
      }
    });
    
    console.log('Registration created successfully:', {
      id: registration.id,
      moodle_id: registration.moodle_id,
      has_photo: !!registration.photo,
      has_face_descriptor: !!registration.face_descriptor
    });

    res.json({
      success: true,
      message: 'Registration request submitted successfully',
      registration
    });
  } catch (error) {
    console.error('Registration request error:', error);
    res.status(500).json({ error: 'Failed to submit registration request' });
  }
});

// Get all registration requests (admin only)
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};

    const registrations = await prisma.studentRegistration.findMany({
      where,
      orderBy: { created_at: 'desc' }
    });

    res.json(registrations);
  } catch (error) {
    console.error('Get registrations error:', error);
    res.status(500).json({ error: 'Failed to get registration requests' });
  }
});

// Approve registration request (admin only)
router.post('/:id/approve', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the registration request
    const registration = await prisma.studentRegistration.findUnique({
      where: { id }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration request not found' });
    }

    if (registration.status !== 'pending') {
      return res.status(400).json({ error: 'Registration request is not pending' });
    }

    // Start a transaction to update registration and create/update user with face template and photo
    const result = await prisma.$transaction(async (prisma) => {
      // Update registration status
      const updatedRegistration = await prisma.studentRegistration.update({
        where: { id },
        data: { status: 'approved' }
      });

      // Create or update user
      let user = await prisma.user.findUnique({
        where: { moodle_id: registration.moodle_id }
      });

      const faceTemplate = registration.face_descriptor || null;

      if (!user) {
        // Create new user
        user = await prisma.user.create({
          data: {
            moodle_id: registration.moodle_id,
            name: registration.name,
            role: 'student',
            status: 'active',
            photo: registration.photo,
            face_template: faceTemplate,
            year: registration.year ?? null,
            division: registration.division ?? null
          }
        });
      } else {
        // Update existing user with face/photo if provided
        user = await prisma.user.update({
          where: { moodle_id: registration.moodle_id },
          data: {
            name: registration.name,
            status: 'active',
            photo: registration.photo ?? user.photo,
            face_template: faceTemplate ?? user.face_template,
            year: registration.year ?? user.year,
            division: registration.division ?? user.division
          }
        });
      }

      return { registration: updatedRegistration, user };
    });

    res.json({
      success: true,
      message: 'Registration approved and user created',
      registration: result.registration,
      user: result.user
    });
  } catch (error) {
    console.error('Approve registration error:', error);
    res.status(500).json({ error: 'Failed to approve registration' });
  }
});

// Reject registration request (admin only)
router.post('/:id/reject', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    // Find the registration request
    const registration = await prisma.studentRegistration.findUnique({
      where: { id }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration request not found' });
    }

    if (registration.status !== 'pending') {
      return res.status(400).json({ error: 'Registration request is not pending' });
    }

    // Update registration status
    const updatedRegistration = await prisma.studentRegistration.update({
      where: { id },
      data: {
        status: 'rejected',
        note
      }
    });

    res.json({
      success: true,
      message: 'Registration request rejected',
      registration: updatedRegistration
    });
  } catch (error) {
    console.error('Reject registration error:', error);
    res.status(500).json({ error: 'Failed to reject registration' });
  }
});

module.exports = router;