const express = require('express');
const { verifyToken, requireAdmin } = require('./auth');
const attendanceService = require('../services/attendanceService');

const router = express.Router();

// Admin: Attendance summary by year/division
router.get('/admin/get-attendance-summary', verifyToken, requireAdmin, async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    // Ensure records exist for date
    await attendanceService.generateForDate(date);
    const summary = await attendanceService.getSummary(date);
    res.json({ date, summary });
  } catch (err) {
    console.error('Attendance summary error:', err);
    res.status(500).json({ error: 'Failed to get attendance summary' });
  }
});

// Admin: Division attendance list
router.get('/admin/get-division-attendance', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { year, division } = req.query;
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    await attendanceService.generateForDate(date);
    const records = await attendanceService.getDivisionAttendance({ year, division, dateInput: date });
    res.json({ date, year: year || null, division: division || null, records });
  } catch (err) {
    console.error('Division attendance error:', err);
    res.status(500).json({ error: 'Failed to get division attendance' });
  }
});

// Student: Get my attendance
router.get('/student/get-attendance', verifyToken, async (req, res) => {
  try {
    const { from, to } = req.query;
    const records = await attendanceService.getStudentAttendance(req.user.moodle_id, { from, to });
    res.json({ records });
  } catch (err) {
    console.error('Student attendance error:', err);
    res.status(500).json({ error: 'Failed to get attendance records' });
  }
});

module.exports = router;