const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany();
    const registrations = await prisma.studentRegistration.findMany();
    const vehicles = await prisma.vehicleRegistration.findMany();
    const logs = await prisma.accessLog.findMany({
      take: 20,
      orderBy: { timestamp: 'desc' },
    });
    const presence = await prisma.presence.findMany();

    console.log(JSON.stringify({
      users,
      registrations,
      vehicles,
      logs,
      presence,
    }, null, 2));
  } catch (e) {
    console.error('Error reading database:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();

