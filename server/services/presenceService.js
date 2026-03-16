const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class PresenceService {
  normalizePlate(plate) {
    if (!plate) return null;
    return plate
      .toUpperCase()
      .replace(/\s|-/g, '')
      .replace(/O/g, '0')
      .replace(/I/g, '1')
      .replace(/B/g, '8')
      .replace(/S/g, '5');
  }
  // Check if user is currently inside
  async isUserInside(moodleId, type = 'pedestrian') {
    const presence = await prisma.presence.findFirst({
      where: {
        moodle_id: moodleId,
        type: type,
        status: 'inside'
      }
    });
    return !!presence;
  }

  // Check if vehicle is currently inside
  async isVehicleInside(plate) {
    const presence = await prisma.presence.findFirst({
      where: {
        plate: plate,
        type: 'vehicle',
        status: 'inside'
      }
    });
    return !!presence;
  }

  // Create entry presence record
  async createEntry(moodleId, type, plate = null) {
    return await prisma.presence.create({
      data: {
        moodle_id: moodleId,
        type: type,
        plate: plate,
        last_direction: 'entry',
        entered_at: new Date(),
        status: 'inside'
      }
    });
  }

  // Create exit presence record
  async createExit(moodleId, type, plate = null) {
    // Find the current presence record
    const currentPresence = await prisma.presence.findFirst({
      where: {
        moodle_id: moodleId,
        type: type,
        plate: plate,
        status: 'inside'
      }
    });

    if (!currentPresence) {
      throw new Error('No active presence found');
    }

    // Update the existing record
    return await prisma.presence.update({
      where: { id: currentPresence.id },
      data: {
        last_direction: 'exit',
        exited_at: new Date(),
        status: 'cleared'
      }
    });
  }

  // Get current presence for user
  async getCurrentPresence(moodleId, type = 'pedestrian') {
    return await prisma.presence.findFirst({
      where: {
        moodle_id: moodleId,
        type: type,
        status: 'inside'
      }
    });
  }

  // Get current presence for vehicle
  async getCurrentVehiclePresence(plate) {
    return await prisma.presence.findFirst({
      where: {
        plate: plate,
        type: 'vehicle',
        status: 'inside'
      }
    });
  }

  // Validate entry request
  async validateEntry(moodleId, type, plate = null) {
    const errors = [];

    // Check if user exists and is active
    const user = await prisma.user.findUnique({
      where: { moodle_id: moodleId }
    });

    if (!user) {
      errors.push('User not found');
    } else if (user.status !== 'active') {
      errors.push('User account is inactive');
    }

    // Check if already inside
    if (type === 'pedestrian') {
      const isInside = await this.isUserInside(moodleId, 'pedestrian');
      if (isInside) {
        errors.push('Already inside as pedestrian - please exit first');
      }
      
      // Check if inside as vehicle
      const userVehiclePresence = await prisma.presence.findFirst({
        where: {
          moodle_id: moodleId,
          type: 'vehicle',
          status: 'inside'
        }
      });
      if (userVehiclePresence) {
        errors.push(`User is currently inside with VEHICLE (${userVehiclePresence.plate}). Please exit with vehicle first.`);
      }

    } else if (type === 'vehicle') {
      if (plate) {
        const normalizedDetected = this.normalizePlate(plate);
        
        // Check if inside as pedestrian
        const isPedestrianInside = await this.isUserInside(moodleId, 'pedestrian');
        if (isPedestrianInside) {
          errors.push('User is currently inside as PEDESTRIAN. Please exit as PEDESTRIAN before entering as VEHICLE.');
        }

        // Check if ANY vehicle belonging to this user is already inside
        // This prevents multiple vehicles registered to the same user from entering simultaneously
        const userVehiclePresence = await prisma.presence.findFirst({
          where: {
            moodle_id: moodleId,
            type: 'vehicle',
            status: 'inside'
          }
        });

        if (userVehiclePresence) {
          // If the vehicle inside is the same as the one trying to enter, it's a duplicate entry attempt
          // If it's a different vehicle, it's a fraud attempt (second vehicle)
          if (this.normalizePlate(userVehiclePresence.plate) === normalizedDetected) {
            errors.push('This vehicle is already inside');
          } else {
            errors.push(`User already has a vehicle inside (${userVehiclePresence.plate}). Entry denied for second vehicle.`);
          }
        }

        const normalizedInsideCheckPlate = normalizedDetected; // presence stores raw; check by detected for now
        const isVehicleInside = await this.isVehicleInside(normalizedInsideCheckPlate);
        if (isVehicleInside && !userVehiclePresence) {
          // This case handles if the plate is inside but somehow not linked to the user (shouldn't happen with correct data)
          errors.push('Vehicle already inside - please exit first');
        }

        // Check if plate is registered to user
        if (user) {
          const normalizedUserPlate = this.normalizePlate(user.vehicle_plate);
          if (normalizedUserPlate !== normalizedDetected) {
            // Check if any approved registration matches after normalization
            const registrations = await prisma.vehicleRegistration.findMany({
              where: {
                moodle_id: moodleId,
                status: 'approved'
              }
            });
            const hasMatch = registrations.some(r => this.normalizePlate(r.plate) === normalizedDetected);
            if (!hasMatch) {
              errors.push('Plate not registered to this user');
            }
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  // Validate exit request
  async validateExit(moodleId, type, plate = null) {
    const errors = [];

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { moodle_id: moodleId }
    });

    if (!user) {
      errors.push('User not found');
    }

    // Check if currently inside
    if (type === 'pedestrian') {
      const isInside = await this.isUserInside(moodleId, 'pedestrian');
      if (!isInside) {
        // Check if inside as vehicle to give better error
        const userVehiclePresence = await prisma.presence.findFirst({
          where: {
            moodle_id: moodleId,
            type: 'vehicle',
            status: 'inside'
          }
        });
        if (userVehiclePresence) {
          errors.push(`User is currently inside with VEHICLE (${userVehiclePresence.plate}). Please exit with VEHICLE.`);
        } else {
          errors.push('No active pedestrian session found');
        }
      }
    } else if (type === 'vehicle') {
      if (plate) {
        const isVehicleInside = await this.isVehicleInside(plate);
        if (!isVehicleInside) {
          // Check if inside as pedestrian to give better error
          const isPedestrianInside = await this.isUserInside(moodleId, 'pedestrian');
          if (isPedestrianInside) {
            errors.push('User is currently inside as PEDESTRIAN. Cannot exit with a VEHICLE.');
          } else {
            errors.push('No active vehicle session found (Did you scan on entry?)');
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  // Get all current presences (admin function)
  async getAllCurrentPresences() {
    return await prisma.presence.findMany({
      where: {
        status: 'inside'
      },
      include: {
        user: {
          select: {
            moodle_id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        entered_at: 'desc'
      }
    });
  }

  // Force clear presence (admin function)
  async forceClearPresence(presenceId, reason = 'Admin override') {
    return await prisma.presence.update({
      where: { id: presenceId },
      data: {
        status: 'cleared',
        exited_at: new Date(),
        last_direction: 'exit'
      }
    });
  }
}

module.exports = new PresenceService();
