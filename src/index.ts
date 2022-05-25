import { generateSensors, generateSensorValues } from "./generate";
import { resetDB, SensorDBStore, SensorValueDBStore } from "./dbStore";

//const SV_CSV_FILE = "data-sensor-value.csv";
//const SENSOR_CSV_FILE = "data-sensor.csv";

async function main() {
  await resetDB();
  const sensors = await generateSensors(new SensorDBStore(), 123);
  await generateSensorValues(new SensorValueDBStore(), sensors, 100);
}

void main();
