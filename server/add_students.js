const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Adding new students to database...');

  // Create new users
  const newUsers = [
    {
      moodle_id: '23102035',
      name: 'Tanmay Shelar',
      role: 'student',
      vehicle_plate: 'MH04LN9523',
      status: 'active'
    },
    {
      moodle_id: '23102036',
      name: 'Jyoti Sahu',
      role: 'student',
      vehicle_plate: null,
      status: 'active'
    },
    {
      moodle_id: '23102105',
      name: 'Gargi Saswade',
      role: 'student',
      vehicle_plate: null,
      status: 'active'
    }
  ];

  for (const user of newUsers) {
    await prisma.user.upsert({
      where: { moodle_id: user.moodle_id },
      update: user,
      create: user
    });
  }

  console.log('✅ New students added successfully!');
  console.log('📊 New students created:');
  newUsers.forEach(user => {
    console.log(`   - ${user.moodle_id}: ${user.name} (${user.role})${user.vehicle_plate ? ', Vehicle: ' + user.vehicle_plate : ', No vehicle'}`);
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });