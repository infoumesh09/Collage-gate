const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const includeUsers = process.argv.includes('--all') || process.argv.includes('--include-users');

  console.log('Starting database reset...');
  console.log('This will delete records from: attendance, presence, access logs, vehicle registrations, student registrations, daily stats.');
  console.log(`Users table deletion: ${includeUsers ? 'ENABLED' : 'DISABLED (use --all to include users)'}`);

  // Show counts before deletion for visibility
  const countsBefore = {
    attendance: await prisma.attendance.count(),
    presence: await prisma.presence.count(),
    accessLog: await prisma.accessLog.count(),
    vehicleRegistration: await prisma.vehicleRegistration.count(),
    studentRegistration: await prisma.studentRegistration.count(),
    dailyStat: await prisma.dailyStat.count(),
    users: await prisma.user.count(),
  };
  console.table({ before: countsBefore });

  // Delete in order to respect potential foreign keys
  await prisma.attendance.deleteMany({});
  await prisma.presence.deleteMany({});
  await prisma.accessLog.deleteMany({});
  await prisma.vehicleRegistration.deleteMany({});
  await prisma.studentRegistration.deleteMany({});
  await prisma.dailyStat.deleteMany({});

  if (includeUsers) {
    await prisma.user.deleteMany({});
  }

  const countsAfter = {
    attendance: await prisma.attendance.count(),
    presence: await prisma.presence.count(),
    accessLog: await prisma.accessLog.count(),
    vehicleRegistration: await prisma.vehicleRegistration.count(),
    studentRegistration: await prisma.studentRegistration.count(),
    dailyStat: await prisma.dailyStat.count(),
    users: await prisma.user.count(),
  };
  console.table({ after: countsAfter });

  console.log('Database reset completed.');
}

main()
  .catch((e) => {
    console.error('Reset failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });