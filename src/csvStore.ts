import { createWriteStream, rmSync, WriteStream } from "fs";
import { Sensor, SensorValue } from "@prisma/client";
import { BatchStore } from "./generate";

abstract class CsvStore<T> implements BatchStore<T> {
  file: string;
  svStream: WriteStream | undefined = undefined;

  constructor(file: string) {
    this.file = file;
    rmSync(file, { force: true });
  }

  begin(): void {
    this.svStream = createWriteStream(this.file, { flags: "a" });
  }

  abstract toCsv(t: T): string;

  next(t: T): void {
    if (!this.svStream) throw new Error("Missing begin() before next()");
    this.svStream.write(`${this.toCsv(t)}\n`);
  }

  async commit(): Promise<void> {
    this.svStream?.end();
    this.svStream?.close();
    this.svStream = undefined;
  }
}

export class SensorValueCsvStore extends CsvStore<SensorValue> {
  toCsv(t: SensorValue): string {
    return `${t.sensorTag},${t.date.toISOString()},${t.mean?.toString()},${t.std?.toString()}`;
  }
}

export class SensorCsvStore extends CsvStore<Sensor> {
  toCsv(t: Sensor): string {
    return t.tag;
  }
}
