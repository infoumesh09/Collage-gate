const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CUTOFF_HOUR_DEFAULT = 9; // 9:00 AM

class AttendanceService {
  async getCutoffHour() {
    const settings = await prisma.setting.findFirst();
    // Allow future extension: settings.late_cutoff_hour
    return settings?.late_cutoff_hour ?? CUTOFF_HOUR_DEFAULT;
  }

  // Generate attendance for a specific date (YYYY-MM-DD or Date)
  async generateForDate(dateInput) {
    const cutoffHour = await this.getCutoffHour();
    const date = typeof dateInput === 'string' ? new Date(dateInput) : new Date(dateInput);
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);

    const users = await prisma.user.findMany({
      where: { role: 'student' }
    });

    for (const user of users) {
      // First successful pedestrian entry
      const firstEntry = await prisma.accessLog.findFirst({
        where: {
          moodle_id: user.moodle_id,
          method: 'pedestrian',
          direction: 'entry',
          success: true,
          timestamp: { gte: dayStart, lt: dayEnd }
        },
        orderBy: { timestamp: 'asc' }
      });

      // Last successful exit
      const lastExit = await prisma.accessLog.findFirst({
        where: {
          moodle_id: user.moodle_id,
          method: 'pedestrian',
          direction: 'exit',
          success: true,
          timestamp: { gte: dayStart, lt: dayEnd }
        },
        orderBy: { timestamp: 'desc' }
      });

      let status = 'absent';
      let entryTime = null;
      let exitTime = null;

      if (firstEntry) {
        entryTime = firstEntry.timestamp;
        const cutoff = new Date(dayStart);
        cutoff.setHours(cutoffHour, 0, 0, 0);
        status = entryTime > cutoff ? 'late' : 'present';
      }

      if (lastExit) {
        exitTime = lastExit.timestamp;
      }

      await prisma.attendance.upsert({
        where: {
          moodle_id_date: { moodle_id: user.moodle_id, date: dayStart }
        },
        update: {
          year: user.year ?? null,
          division: user.division ?? null,
          entry_time: entryTime,
          exit_time: exitTime,
          status
        },
        create: {
          moodle_id: user.moodle_id,
          date: dayStart,
          year: user.year ?? null,
          division: user.division ?? null,
          entry_time: entryTime,
          exit_time: exitTime,
          status
        }
      });
    }
  }

  async getSummary(dateInput) {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : new Date(dateInput);
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const records = await prisma.attendance.findMany({
      where: { date: dayStart }
    });

    const summary = {};
    for (const rec of records) {
      const key = `${rec.year || 'UNKNOWN'}-${rec.division || 'UNK'}`;
      if (!summary[key]) {
        summary[key] = { year: rec.year || 'UNKNOWN', division: rec.division || 'UNK', present: 0, late: 0, absent: 0, total: 0 };
      }
      summary[key].total += 1;
      if (rec.status === 'present') summary[key].present += 1;
      else if (rec.status === 'late') summary[key].late += 1;
      else summary[key].absent += 1;
    }
    return Object.values(summary);
  }

  async getDivisionAttendance({ year, division, dateInput }) {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : new Date(dateInput);
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    return prisma.attendance.findMany({
      where: { date: dayStart, year: year ?? null, division: division ?? null },
      include: { user: { select: { moodle_id: true, name: true, roll_number: true } } },
      orderBy: { entry_time: 'asc' }
    });
  }

  async getStudentAttendance(moodleId, { from, to }) {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    if (fromDate) fromDate.setHours(0, 0, 0, 0);
    if (toDate) toDate.setHours(0, 0, 0, 0);

    return prisma.attendance.findMany({
      where: {
        moodle_id: moodleId,
        ...(fromDate && toDate ? { date: { gte: fromDate, lte: toDate } } : {})
      },
      orderBy: { date: 'desc' }
    });
  }
}

module.exports = new AttendanceService();
