import { setImmediate } from "timers";
import { faker } from "@faker-js/faker";
import { Sensor, SensorValue } from "@prisma/client";

const N_BATCH_SIZE = 1000;

export interface BatchStore<T> {
  begin(): void;
  next(t: T): void;
  commit(): Promise<void>;
}

function sensorTag(ordinal: number) {
  return `sensor${ordinal}`;
}

function randomDate() {
  const startDate = new Date(2017, 1, 1);
  const endDate = new Date(2020, 12, 31);
  return faker.date.between(startDate, endDate);
}

function randomMean() {
  return Math.random() * 10;
}

function randomStd() {
  return Math.random() * 2;
}

function randomSensorValue(sensorTag: string, date: Date): SensorValue {
  return {
    sensorTag,
    date,
    mean: randomMean(),
    std: randomStd(),
  };
}

export async function generateSensorValues(
  store: BatchStore<SensorValue>,
  sensors: Sensor[],
  snapshotCount: number,
  snapshotRemaining: number = snapshotCount
) {
  if (snapshotRemaining == 0) return;

  let n = snapshotRemaining;

  if (n * sensors.length > N_BATCH_SIZE) {
    n = Math.max(1, Math.floor(N_BATCH_SIZE / sensors.length));
    if (snapshotRemaining == snapshotCount)
      console.log(`Starting batchs of ${n} Snapshots with ${sensors.length} Sensor.`);
  }

  store.begin();
  for (let i = 0; i < n; i++) {
    const date = randomDate();
    sensors.forEach(s => {
      store.next(randomSensorValue(s.tag, date));
    });
  }
  await store.commit();

  snapshotRemaining = snapshotRemaining - n;
  const snapshotGenerated = snapshotCount - snapshotRemaining;
  console.log(
    `${snapshotGenerated}/${snapshotCount} Snapshots and ${
      snapshotGenerated * sensors.length
    } SensorValues generated.`
  );
  if (snapshotRemaining > 0) {
    setImmediate(() => {
      generateSensorValues(store, sensors, snapshotCount, snapshotRemaining);
    });
  }
}

export async function generateSensors(store: BatchStore<Sensor>, count: number): Promise<Sensor[]> {
  const sensors: Sensor[] = [];
  store.begin();
  for (let i = 1; i <= count; i++) {
    const sensor = { tag: sensorTag(i) };
    store.next(sensor);
    sensors.push(sensor);
  }
  await store.commit();
  console.log(`${count}/${count} Sensors generated.`);
  return sensors;
}
