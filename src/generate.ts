import { setImmediate } from "timers";
import { faker } from "@faker-js/faker";
import { Sensor, SensorValue } from "@prisma/client";
import { DBStore } from "./dbStore";

export const CONST = {
  N_SENSOR_PER_SOURCE: 150,
  N_SNAPSHOT_PER_SOURCE: 500,
  N_SNAPSHOT_PER_BATCH: 100,
  MIN_DATE: new Date(2017, 1, 1),
  MAX_DATE: new Date(2020, 12, 31),
};

export let sourceCount = 0;
export interface BatchStore<T> {
  begin(): void;
  next(t: T): void;
  commit(): Promise<void>;
}

function sensorTag(ordinal: number) {
  return `sensor${ordinal}`;
}

export function randomDate(from = CONST.MIN_DATE) {
  if (from >= CONST.MAX_DATE) throw new Error(`$from must be stricly before ${CONST.MAX_DATE} `);
  return faker.date.between(from, CONST.MAX_DATE);
}

function randomMean() {
  return Math.random() * 10;
}

function randomStd() {
  return Math.random() * 2;
}

function createRandomSource() {
  return `source${++sourceCount}`;
}

export function pickRandomSource() {
  const randomId = Math.floor(Math.random() * sourceCount) + 1;
  return `source${randomId}`;
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

export async function generateSourceWithSensors(store: DBStore<Sensor>) {
  const source = createRandomSource();
  const sensors: Sensor[] = await generateSensors(store, source, CONST.N_SENSOR_PER_SOURCE);
  console.log(`Source ${source} generated with ${sensors.length} Sensors.`);
  return { source, sensors };
}

export async function generateSensorValues(
  sensorStore: DBStore<Sensor>,
  store: DBStore<SensorValue>,
  snapshotCount: number,
  snapshotRemaining: number = snapshotCount,
  source?: string,
  sensors?: Sensor[]
): Promise<number> {
  if (snapshotRemaining == 0) return 0;
  if (snapshotCount === snapshotRemaining) {
    console.log(`Generating ${snapshotCount} Snapshots x ${CONST.N_SENSOR_PER_SOURCE} Sensors.`);
  }

  let n = snapshotRemaining;

  if (!source || !sensors) {
    ({ source, sensors } = await generateSourceWithSensors(sensorStore));
  }

  if (n > CONST.N_SNAPSHOT_PER_BATCH) {
    n = CONST.N_SNAPSHOT_PER_BATCH;
    if (snapshotRemaining === snapshotCount) {
      console.log(
        `Starting batches of ${n * sensors.length} SensorValues (${n} Snapshots x ${
          sensors.length
        } Sensors).`
      );
    }
  }

  for (let i = 0; i < n; i++) {
    if ((snapshotRemaining - i) % CONST.N_SNAPSHOT_PER_SOURCE === 0) {
      ({ source, sensors } = await generateSourceWithSensors(sensorStore));
    }

    const date = randomDate();
    sensors.forEach(s => {
      if (!source) throw new Error("Source cannot be undefined.");
      store.save(randomSensorValue(source, s.tag, date));
    });
  }
  await store.commit();

  snapshotRemaining = snapshotRemaining - n;
  const nSnapshotGenerated = snapshotCount - snapshotRemaining;
  const nSvGenerated = nSnapshotGenerated * sensors.length;
  console.log(
    `${nSnapshotGenerated}/${snapshotCount} Snapshots generated (${
      nSnapshotGenerated * sensors.length
    } SensorValues).`
  );
  return new Promise<number>(resolve => {
    if (snapshotRemaining > 0) {
      setImmediate(() => {
        generateSensorValues(
          sensorStore,
          store,
          snapshotCount,
          snapshotRemaining,
          source,
          sensors
        ).then(n => resolve(n + nSvGenerated));
      });
    } else {
      resolve(nSvGenerated);
    }
  });
}

export async function generateSensors(
  store: DBStore<Sensor>,
  source: string,
  count: number
): Promise<Sensor[]> {
  const sensors: Sensor[] = [];
  for (let i = 1; i <= count; i++) {
    const sensor = { source, tag: sensorTag(i) };
    store.save(sensor);
    sensors.push(sensor);
  }
  await store.commit();
  return sensors;
}
