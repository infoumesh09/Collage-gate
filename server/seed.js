const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default settings
  await prisma.setting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      face_threshold: 0.6,
      allow_manual: true,
      max_retries: 3
    }
  });

  // Create demo users
  const demoUsers = [
    {
      moodle_id: '23102185',
      name: 'John Doe',
      role: 'student',
      vehicle_plate: 'ABC123',
      status: 'active'
    },
    {
      moodle_id: '23102186',
      name: 'Jane Smith',
      role: 'staff',
      vehicle_plate: 'XYZ789',
      status: 'active'
    },
    {
      moodle_id: '23102187',
      name: 'Bob Johnson',
      role: 'student',
      vehicle_plate: null,
      status: 'active'
    },
    {
      moodle_id: '23102188',
      name: 'Alice Brown',
      role: 'staff',
      vehicle_plate: 'DEF456',
      status: 'active'
    }
  ];

  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: { moodle_id: user.moodle_id },
      update: user,
      create: user
    });
  }

  // Create some demo access logs
  const demoLogs = [
    {
      moodle_id: '23102185',
      method: 'pedestrian',
      direction: 'entry',
      success: true,
      confidence: 0.85,
      note: 'Demo entry log'
    },
    {
      moodle_id: '23102186',
      method: 'vehicle',
      direction: 'entry',
      success: true,
      confidence: 0.92,
      plate_detected: 'XYZ789',
      note: 'Demo vehicle entry'
    },
    {
      moodle_id: '23102187',
      method: 'pedestrian',
      direction: 'exit',
      success: true,
      confidence: 0.78,
      note: 'Demo exit log'
    }
  ];

  for (const log of demoLogs) {
    await prisma.accessLog.create({
      data: {
        ...log,
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) // Random time in last 24 hours
      }
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('📊 Demo users created:');
  demoUsers.forEach(user => {
    console.log(`   - ${user.moodle_id}: ${user.name} (${user.role})`);
  });
  console.log('🔑 Admin login: username=admin, password=admin123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
