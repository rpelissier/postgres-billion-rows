import { generateSensorValues, randomDate, pickRandomSource } from "./generate";
import { resetDB, SensorDBStore, SensorValueDBStore } from "./dbStore";
import { PrismaClient } from "@prisma/client";
import { Chrono } from "./chrono";
import { copyAndReplace } from "./replaceInFile";

const N_MULTI_SEARCH = 10;
const prisma = new PrismaClient();
const chrono = new Chrono();
const sensorStore = new SensorDBStore();
const svStore = new SensorValueDBStore();

export type Serie = {
  title: string;
  xAxis: string;
  yAxis: string;
  data: number[][];
};

export type Analytics = Serie[];

async function main(): Promise<void> {
  await resetDB();

  const nSnapshots = [100, 200, 500, 1000, 2000, 5000, 10000];
  //const nSnapshots = [100, 200];
  const nSnapshotData: number[][] = [];
  const newSvData: number[][] = [];
  const insertChronoData: number[][] = [];
  const searchChronoData: number[][] = [];
  let totalSv = 0;

  for (const nSnapshot of nSnapshots) {
    chrono.start("Generating");
    const newSv = await generateSensorValues(sensorStore, svStore, nSnapshot);
    const insertChrono = chrono.elapsedLogAndGet();
    chrono.start("Searching data range");
    await multiSearch();
    const searchChrono = chrono.elapsedLogAndGet() / N_MULTI_SEARCH;
    totalSv += newSv;

    nSnapshotData.push([totalSv, nSnapshot]);
    newSvData.push([totalSv, newSv]);
    insertChronoData.push([totalSv, insertChrono]);
    searchChronoData.push([totalSv, searchChrono]);
  }
  const xAxis = "Total number of SV in the DB";
  const nSnapshotSerie = {
    title: "Number of Snapshot generated in this iteration",
    yAxis: "count",
    xAxis,
    data: nSnapshotData,
  };
  const newSvSerie = {
    title: "Number of SensorValue generated in this iteration",
    yAxis: "count",
    xAxis,
    data: newSvData,
  };
  const insertChronoSerie = {
    title: "Time for inserting the generated data",
    yAxis: "chrono (milliseconds)",
    xAxis,
    data: insertChronoData,
  };
  const searchChronoSerie = {
    title: "AVG Time for searching a range of date in a Source over 10 iterations",
    yAxis: "chrono (milliseconds)",
    xAxis,
    data: searchChronoData,
  };

  copyAndReplace("src/index.template.html", "dist/index.html", [
    { token: '"${nSnapshotSerie}"', replacement: JSON.stringify(nSnapshotSerie) },
    { token: '"${newSvSerie}"', replacement: JSON.stringify(newSvSerie) },
    { token: '"${insertChronoSerie}"', replacement: JSON.stringify(insertChronoSerie) },
    { token: '"${searchChronoSerie}"', replacement: JSON.stringify(searchChronoSerie) },
  ]);
}

async function multiSearch() {
  for (let i = 0; i < N_MULTI_SEARCH; i++) {
    await search();
  }
}

async function search() {
  const from = randomDate();
  const to = randomDate(from);
  await prisma.sensorValue.findMany({
    where: {
      AND: [
        { source: pickRandomSource() },
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
