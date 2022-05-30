import { generateSensors, generateSensorValues, randomDate } from "./generate";
import { resetDB, SensorDBStore, SensorValueDBStore } from "./dbStore";
import { PrismaClient } from "@prisma/client";
import { Chrono } from "./chrono";
import { chown } from "fs";

//const SV_CSV_FILE = "data-sensor-value.csv";
//const SENSOR_CSV_FILE = "data-sensor.csv";

const prisma = new PrismaClient();
const chrono = new Chrono();
const sensorStore = new SensorDBStore();
const svStore = new SensorValueDBStore();

async function main() {
  await resetDB();

  const nSnapshotSeq = [100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000];

  for (const nSnapshot of nSnapshotSeq) {
    chrono.start("Generating");
    await generateSensorValues(sensorStore, svStore, nSnapshot);
    chrono.log();
    chrono.start("Searching");
    await search();
    chrono.log();
  }
}

async function search() {
  const from = randomDate();
  const to = randomDate(from);
  await prisma.sensorValue.findMany({
    where: {
      AND: [
        {
          date: {
            lt: to,
          },
        },
        {
          date: {
            gte: from,
          },
        },
      ],
    },
  });
}

void main();
