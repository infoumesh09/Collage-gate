const { PrismaClient } = require('@prisma/client');
const presenceService = require('../services/presenceService');
const prisma = new PrismaClient();

exports.validateQR = async (req, res) => {
  try {
    const { moodle_id } = req.body;
    if (!moodle_id) return res.status(400).json({ error: 'moodle_id required' });
    const user = await prisma.user.findUnique({
      where: { moodle_id },
      select: { moodle_id: true, name: true, role: true, vehicle_plate: true, face_template: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    console.error('Gate validate-qr error:', err);
    res.status(500).json({ error: 'Failed to validate QR' });
  }
};

exports.processFace = async (req, res) => {
  try {
    const { moodle_id, descriptor } = req.body;
    if (!moodle_id || !descriptor || !Array.isArray(descriptor)) {
      return res.status(400).json({ error: 'moodle_id and face descriptor array required' });
    }
    const user = await prisma.user.findUnique({
      where: { moodle_id },
      select: { face_template: true }
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
    res.json({
      match,
      confidence: Math.round(confidence),
      distance: Math.round(distance * 1000) / 1000,
      threshold: Math.round(adaptiveThreshold * 1000) / 1000
    });
  } catch (err) {
    console.error('Gate process-face error:', err);
    res.status(500).json({ error: 'Failed to process face' });
  }
};

exports.processPlate = async (req, res) => {
  try {
    const { moodle_id, plate, confidence = 0 } = req.body;
    if (!moodle_id || !plate) {
      return res.status(400).json({ error: 'moodle_id and plate are required' });
    }
    const user = await prisma.user.findUnique({
      where: { moodle_id },
      select: { vehicle_plate: true }
    });
    if (!user || !user.vehicle_plate) {
      return res.json({ match: false, confidence: 0, message: 'No registered vehicle plate' });
    }
    const normalize = (p) => p.toUpperCase().replace(/\s|-/g, '').replace(/O/g, '0').replace(/I/g, '1').replace(/B/g, '8').replace(/S/g, '5');
    const match = normalize(user.vehicle_plate) === normalize(plate);
    res.json({ match, confidence: match ? confidence : 0, plate_registered: user.vehicle_plate });
  } catch (err) {
    console.error('Gate process-plate error:', err);
    res.status(500).json({ error: 'Failed to process plate' });
  }
};

exports.updateEntry = async (req, res) => {
  try {
    const { moodle_id, method, success, confidence = 0, plate_detected, note } = req.body;
    if (!moodle_id || !method || success === undefined) {
      return res.status(400).json({ error: 'moodle_id, method, and success are required' });
    }
    const validation = await presenceService.validateEntry(moodle_id, method, plate_detected);
    if (!validation.valid) {
      return res.json({ success: false, error: validation.errors.join(', '), requiresExit: validation.errors.some(e => e.includes('already inside')) });
    }
    const log = await prisma.accessLog.create({
      data: { moodle_id, method, direction: 'entry', success, confidence, plate_detected, note }
    });
    if (success) await presenceService.createEntry(moodle_id, method, plate_detected);
    res.json({ success: true, log });
  } catch (err) {
    console.error('Gate update-entry error:', err);
    res.status(500).json({ error: 'Failed to update entry' });
  }
};

exports.updateExit = async (req, res) => {
  try {
    const { moodle_id, method, success, confidence = 0, plate_detected, note } = req.body;
    if (!moodle_id || !method || success === undefined) {
      return res.status(400).json({ error: 'moodle_id, method, and success are required' });
    }
    const validation = await presenceService.validateExit(moodle_id, method, plate_detected);
    if (!validation.valid) {
      return res.json({ success: false, error: validation.errors.join(', '), requiresEntry: validation.errors.some(e => e.includes('No active')) });
    }
    const log = await prisma.accessLog.create({
      data: { moodle_id, method, direction: 'exit', success, confidence, plate_detected, note }
    });
    if (success) await presenceService.createExit(moodle_id, method, plate_detected);
    res.json({ success: true, log });
  } catch (err) {
    console.error('Gate update-exit error:', err);
    res.status(500).json({ error: 'Failed to update exit' });
  }
};

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

