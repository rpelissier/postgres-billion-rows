import { Sensor, SensorValue } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export abstract class DBStore<T> {
  buffer: T[] = [];

  abstract insertMany(t: T[]): Promise<void>;

  save(t: T): void {
    this.buffer.push(t);
  }

  async commit(): Promise<void> {
    await this.insertMany(this.buffer);
    this.buffer.length = 0;
  }
}

export async function resetDB() {
  console.log("Reseting the DB.");
  await prisma.$executeRaw`delete from sensor_value;`;
  await prisma.$executeRaw`delete from sensor;`;
  console.log("Reseting the DB done.");
}

export class SensorValueDBStore extends DBStore<SensorValue> {
  async insertMany(data: SensorValue[]) {
    await prisma.sensorValue.createMany({ data });
  }
}

export class SensorDBStore extends DBStore<Sensor> {
  async insertMany(data: Sensor[]) {
    await prisma.sensor.createMany({ data });
  }
}
