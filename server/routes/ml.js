const express = require('express');
const { PrismaClient } = require('@prisma/client');
const presenceService = require('../services/presenceService');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const prisma = new PrismaClient();
const router = express.Router();

// POST /api/scan-face
// Body: { moodle_id, descriptor: number[], capturedPhoto?: string }
router.post('/scan-face', async (req, res) => {
  try {
    const { moodle_id, descriptor, capturedPhoto } = req.body;
    if (!moodle_id || !descriptor || !Array.isArray(descriptor)) {
      return res.status(400).json({ error: 'moodle_id and descriptor array required' });
    }

    const user = await prisma.user.findUnique({
      where: { moodle_id },
      select: { face_template: true, photo: true }
    });

    if (!user || !user.face_template) {
      return res.json({ match: false, confidence: 0, message: 'No face template found' });
    }

    const storedDescriptor = JSON.parse(user.face_template);
    const distance = calculateEuclideanDistance(descriptor, storedDescriptor);
    const settings = await prisma.setting.findFirst();
    const baseThreshold = settings?.face_threshold || 0.6;
    const adaptiveThreshold = baseThreshold * 1.2;
    const match = distance <= adaptiveThreshold;
    const confidence = Math.max(0, Math.min(100, (1 - (distance / adaptiveThreshold)) * 100));

    res.json({ match, confidence: Math.round(confidence), distance, threshold: adaptiveThreshold });
  } catch (err) {
    console.error('scan-face error:', err);
    res.status(500).json({ error: 'Failed to process face scan' });
  }
});

// POST /api/scan-plate
// Body: { moodle_id, plate }
router.post('/scan-plate', async (req, res) => {
  try {
    const { moodle_id, plate } = req.body;
    if (!moodle_id || !plate) {
      return res.status(400).json({ error: 'moodle_id and plate are required' });
    }

    const user = await prisma.user.findUnique({
      where: { moodle_id },
      select: { vehicle_plate: true }
    });

    if (!user || !user.vehicle_plate) {
      return res.json({ match: false, message: 'No vehicle plate registered' });
    }

    const detected = presenceService.normalizePlate(plate);
    const registered = presenceService.normalizePlate(user.vehicle_plate);
    const match = detected === registered;
    res.json({ match, detected, registered });
  } catch (err) {
    console.error('scan-plate error:', err);
    res.status(500).json({ error: 'Failed to process plate scan' });
  }
});

// POST /api/ocr-plate
// Body: { image: base64DataUrl }
router.post('/ocr-plate', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'image field (base64) is required' });
    }

    const base64Data = image.includes('base64,') ? image.split('base64,')[1] : image;
    const buffer = Buffer.from(base64Data, 'base64');

    const tmpDir = os.tmpdir();
    const tmpPath = path.join(tmpDir, `plate_${Date.now()}.jpg`);
    await fs.promises.writeFile(tmpPath, buffer);

    const rootDir = path.resolve(__dirname, '../..');

    const python = spawn('python', ['-m', 'plate_model', tmpPath], {
      cwd: rootDir
    });

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    python.on('close', async (code) => {
      try {
        await fs.promises.unlink(tmpPath).catch(() => {});
      } catch (_) {}

      if (code !== 0) {
        console.error('plate_model exited with code', code, 'stderr:', stderr);
        return res.status(500).json({ error: 'Failed to detect plate' });
      }

      const plate = stdout.trim();
      if (!plate) {
        return res.json({ plate: 'Unknown', confidence: 0 });
      }

      const normalized = plate.replace(/\s+/g, '');
      const pattern = /^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/;
      const confidence = pattern.test(normalized) ? 95 : 70;

      res.json({ plate, confidence });
    });
  } catch (err) {
    console.error('ocr-plate error:', err);
    res.status(500).json({ error: 'Failed to process plate image' });
  }
});

function calculateEuclideanDistance(descriptor1, descriptor2) {
  if (descriptor1.length !== descriptor2.length) {
    throw new Error('Descriptors must have the same length');
  }
  let sum = 0;
  for (let i = 0; i < descriptor1.length; i++) {
    const diff = descriptor1[i] - descriptor2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

module.exports = router;
