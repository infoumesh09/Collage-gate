const express = require('express');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireAdmin } = require('./auth');

const router = express.Router();
const prisma = new PrismaClient();
const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || 'http://localhost:8001';

// Store face template for user
router.post('/:moodle_id', verifyToken, async (req, res) => {
  try {
    const { descriptor, photo } = req.body;
    
    if (!descriptor || !Array.isArray(descriptor)) {
      return res.status(400).json({ error: 'Face descriptor array required' });
    }

    // Verify user exists and user can only update their own face template
    const user = await prisma.user.findUnique({
      where: { moodle_id: req.params.moodle_id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is updating their own face template or is admin
    if (req.user.moodle_id !== req.params.moodle_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Can only update your own face template' });
    }

    const faceTemplate = JSON.stringify(descriptor);

    // Update with both face template and photo if provided
    const updateData = { face_template: faceTemplate };
    if (photo) {
      updateData.photo = photo;
    }

    await prisma.user.update({
      where: { moodle_id: req.params.moodle_id },
      data: updateData
    });

    res.json({ success: true, message: 'Face template stored successfully' });
  } catch (error) {
    console.error('Store face template error:', error);
    res.status(500).json({ error: 'Failed to store face template' });
  }
});

// Get face template (admin only)
router.get('/:moodle_id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { moodle_id: req.params.moodle_id },
      select: { face_template: true, photo: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.face_template) {
      return res.json({ descriptor: null, photo: user.photo || null });
    }

    res.json({ 
      descriptor: JSON.parse(user.face_template),
      photo: user.photo || null
    });
  } catch (error) {
    console.error('Get face template error:', error);
    res.status(500).json({ error: 'Failed to get face template' });
  }
});

// Helper for Euclidean distance
function calculateEuclideanDistance(descriptor1, descriptor2) {
  if (descriptor1.length !== descriptor2.length) {
    // In case of dimension mismatch, return a large distance
    return 100;
  }
  let sum = 0;
  for (let i = 0; i < descriptor1.length; i++) {
    const diff = descriptor1[i] - descriptor2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

// Compare face template
router.post('/:moodle_id/compare', async (req, res) => {
  try {
    const { descriptor, capturedPhoto } = req.body;

    if (!descriptor || !Array.isArray(descriptor)) {
      return res.status(400).json({ error: 'Face descriptor array required' });
    }

    const user = await prisma.user.findUnique({
      where: { moodle_id: req.params.moodle_id },
      select: { face_template: true, photo: true }
    });

    if (!user) {
      return res.json({
        match: false,
        confidence: 0,
        message: 'User not found'
      });
    }

    if (!user.face_template) {
      return res.json({
        match: false,
        confidence: 0,
        message: 'No reference face template found. Please re-register face.'
      });
    }

    // Primary path: call external face verification service when both photos are available
    if (capturedPhoto && user.photo) {
      try {
        const response = await axios.post(`${FACE_SERVICE_URL}/verify_match`, {
          image1: user.photo,
          image2: capturedPhoto
        });

        const data = response.data || {};
        const distance = typeof data.distance === 'number' ? data.distance : 0;
        const threshold = typeof data.threshold === 'number' && data.threshold > 0 ? data.threshold : 1;
        const rawMatch = typeof data.match === 'boolean' ? data.match : !!data.verified;
        const confidence = Math.max(0, Math.min(100, (1 - distance / threshold) * 100));

        return res.json({
          match: rawMatch,
          confidence: Math.round(confidence),
          distance: Math.round(distance * 1000) / 1000,
          threshold: Math.round(threshold * 1000) / 1000,
          quality: confidence < 60 ? 'Fair' : 'Good',
          model: data.model || 'Facenet512'
        });
      } catch (serviceError) {
        console.error('Face verification service error, falling back to descriptor match:', serviceError.message || serviceError);
      }
    }

    // Fallback: local descriptor-based comparison
    try {
      const storedDescriptor = JSON.parse(user.face_template);
      const distance = calculateEuclideanDistance(descriptor, storedDescriptor);

      const settings = await prisma.setting.findFirst();
      const baseThreshold = settings?.face_threshold || 0.6;
      const adaptiveThreshold = baseThreshold;

      const ratio = distance / adaptiveThreshold;
      const confidence = Math.max(0, Math.min(100, (1 - ratio) * 100));
      const match = distance <= adaptiveThreshold;

      res.json({
        match,
        confidence: Math.round(confidence),
        distance: Math.round(distance * 1000) / 1000,
        threshold: Math.round(adaptiveThreshold * 1000) / 1000,
        quality: confidence < 60 ? 'Fair' : 'Good'
      });
    } catch (calcError) {
      console.error('Face calculation error:', calcError);
      return res.status(500).json({ error: 'Error processing face template' });
    }
  } catch (error) {
    console.error('Compare face error:', error);
    res.status(500).json({ error: 'Failed to compare face template' });
  }
});

module.exports = router;
