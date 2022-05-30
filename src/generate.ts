import { setImmediate } from "timers";
import { faker } from "@faker-js/faker";
import { Sensor, SensorValue } from "@prisma/client";

const N_SENSOR_PER_SOURCE = 150;
const N_SNAPSHOT_PER_BATCH = 100;
const N_SNAPSHOT_PER_SOURCE = 500;
export const MIN_DATE = new Date(2017, 1, 1);
export const MAX_DATE = new Date(2020, 12, 31);
export interface BatchStore<T> {
  begin(): void;
  next(t: T): void;
  commit(): Promise<void>;
}

function sensorTag(ordinal: number) {
  return `sensor${ordinal}`;
}

export function randomDate(from = MIN_DATE) {
  if (from >= MAX_DATE) throw new Error(`$from must be stricly before ${MAX_DATE} `);
  return faker.date.between(from, MAX_DATE);
}

function randomMean() {
  return Math.random() * 10;
}

function randomStd() {
  return Math.random() * 2;
}

function randomSource() {
  return `source${new Date().toISOString()}`;
}

function randomSensorValue(source: string, sensorTag: string, date: Date): SensorValue {
  return {
    source,
    date,
    sensorTag,
    mean: randomMean(),
    std: randomStd(),
  };
}

export async function generateSourceWithSensors(store: BatchStore<Sensor>) {
  const source = randomSource();
  const sensors: Sensor[] = await generateSensors(store, source, N_SENSOR_PER_SOURCE);
  console.log(`Source ${source} generated with ${sensors.length} Sensors.`);
  return { source, sensors };
}

export async function generateSensorValues(
  sensorStore: BatchStore<Sensor>,
  store: BatchStore<SensorValue>,
  snapshotCount: number,
  snapshotRemaining: number = snapshotCount,
  source?: string,
  sensors?: Sensor[]
) {
  if (snapshotRemaining == 0) return;
  if (snapshotCount === snapshotRemaining) {
    console.log(`Generating ${snapshotCount} Snapshots x ${N_SENSOR_PER_SOURCE} Sensors.`);
  }

  let n = snapshotRemaining;

  if (!source || !sensors) {
    ({ source, sensors } = await generateSourceWithSensors(sensorStore));
  }

  if (n > N_SNAPSHOT_PER_BATCH) {
    n = N_SNAPSHOT_PER_BATCH;
    if (snapshotRemaining === snapshotCount) {
      console.log(
        `Starting batches of ${n * sensors.length} SensorValues (${n} Snapshots x ${
          sensors.length
        } Sensors).`
      );
    }
  }

  store.begin();
  for (let i = 0; i < n; i++) {
    if ((snapshotRemaining - i) % N_SNAPSHOT_PER_SOURCE === 0) {
      ({ source, sensors } = await generateSourceWithSensors(sensorStore));
    }

    const date = randomDate();
    sensors.forEach(s => {
      if (!source) throw new Error("Source cannot be undefined.");
      store.next(randomSensorValue(source, s.tag, date));
    });
  }
  await store.commit();

  snapshotRemaining = snapshotRemaining - n;
  const snapshotGenerated = snapshotCount - snapshotRemaining;
  console.log(
    `${snapshotGenerated}/${snapshotCount} Snapshots generated (${
      snapshotGenerated * sensors.length
    } SensorValues).`
  );
  return new Promise<void>((resolve, reject) => {
    if (snapshotRemaining > 0) {
      setImmediate(() => {
        generateSensorValues(
          sensorStore,
          store,
          snapshotCount,
          snapshotRemaining,
          source,
          sensors
        ).then(resolve);
      });
    } else {
      resolve();
    }
  });
}

export async function generateSensors(
  store: BatchStore<Sensor>,
  source: string,
  count: number
): Promise<Sensor[]> {
  const sensors: Sensor[] = [];
  store.begin();
  for (let i = 1; i <= count; i++) {
    const sensor = { source, tag: sensorTag(i) };
    store.next(sensor);
    sensors.push(sensor);
  }
  await store.commit();
  return sensors;
}
