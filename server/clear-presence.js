const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Clearing all presence records...');
  try {
    const result = await prisma.presence.updateMany({
      where: { status: 'inside' },
      data: {
        status: 'cleared',
        exited_at: new Date(),
        last_direction: 'exit'
      }
    });
    console.log(`✅ Cleared ${result.count} active sessions.`);
  } catch (e) {
    console.error('Error clearing presence:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
