const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { moodle_id, name, role, username, password, year, division } = req.body;

    if (role === 'admin') {
      // Admin login with username/password
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required for admin login' });
      }

      // For demo purposes, using hardcoded admin credentials
      // In production, store hashed passwords in database
      if (username === 'admin' && password === 'admin123') {
        const token = jwt.sign(
          { moodle_id: 'admin', role: 'admin' },
          process.env.JWT_SECRET || 'fallback-secret',
          { expiresIn: '24h' }
        );
        return res.json({ 
          token, 
          user: { moodle_id: 'admin', name: 'System Administrator', role: 'admin' }
        });
      } else {
        return res.status(401).json({ error: 'Invalid admin credentials' });
      }
    } else {
      // Student/Staff login requires existing, approved user
      if (!moodle_id || !name) {
        return res.status(400).json({ error: 'Moodle ID and name required' });
      }

      // Require existing user record (created via admin-approved registration)
      let user = await prisma.user.findUnique({
        where: { moodle_id }
      });

      if (!user) {
        return res.status(404).json({ 
          error: 'User not registered. Please submit a registration request and wait for admin approval.' 
        });
      }

      // Update name/year/division if changed or provided
      const updateData = {};
      if (user.name !== name) updateData.name = name;
      // Only allow year/division updates for students
      if (user.role === 'student') {
        if (year && user.year !== year) updateData.year = year;
        if (division && user.division !== division) updateData.division = division;
      }
      if (Object.keys(updateData).length > 0) {
        const updated = await prisma.user.update({
          where: { moodle_id },
          data: updateData
        });
        user = updated;
      }

      const token = jwt.sign(
        { moodle_id, role: user.role },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      res.json({ 
        token, 
        user: { 
          moodle_id: user.moodle_id, 
          name: user.name, 
          role: user.role,
          vehicle_plate: user.vehicle_plate,
          face_enrolled: !!user.face_template,
          year: user.year ?? null,
          division: user.division ?? null
        }
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify token middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Admin only middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = { router, verifyToken, requireAdmin };
