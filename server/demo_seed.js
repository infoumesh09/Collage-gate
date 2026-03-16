const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function makeDescriptor(len = 128) {
  // Deterministic descriptor for demo purposes
  const arr = Array.from({ length: len }, (_, i) => Number(((Math.sin(i + 1) + 1) / 2).toFixed(6)));
  return JSON.stringify(arr);
}

async function main() {
  console.log('🌱 Seeding demo student and vehicle...');

  // Ensure settings exist
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

  const demoStudent = {
    moodle_id: '23109999',
    name: 'Demo Student',
    role: 'student',
    status: 'active',
    vehicle_plate: null,
    // Store a demo face template and photo so face enrollment reads as enrolled
    face_template: makeDescriptor(128),
    photo: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB' // placeholder
  };

  // Upsert demo user
  const user = await prisma.user.upsert({
    where: { moodle_id: demoStudent.moodle_id },
    update: demoStudent,
    create: demoStudent
  });

  // Create a pending vehicle registration for the demo user
  const plate = 'DEMO001';
  const existingReg = await prisma.vehicleRegistration.findFirst({
    where: { moodle_id: demoStudent.moodle_id, plate }
  });

  if (!existingReg) {
    await prisma.vehicleRegistration.create({
      data: {
        moodle_id: demoStudent.moodle_id,
        plate,
        note: 'Demo vehicle access request',
        status: 'pending'
      }
    });
  }

  console.log('✅ Demo seed complete!');
  console.log('👤 Student:', user.moodle_id, user.name);
  console.log('🚗 Pending vehicle plate:', plate);
  console.log('🔐 Admin login: username=admin, password=admin123456');
  console.log('➡️  Next: login as student with moodle_id + name, submit or review vehicle, and approve via admin.');
}

main()
  .catch((e) => {
    console.error('❌ Demo seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });