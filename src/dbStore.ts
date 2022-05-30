import { Sensor, SensorValue } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { BatchStore } from "./generate";

const prisma = new PrismaClient();

abstract class DBStore<T> implements BatchStore<T> {
  buffer: T[] = [];

  begin(): void {
    return;
  }

  abstract insertMany(t: T[]): Promise<void>;

  next(t: T): void {
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
