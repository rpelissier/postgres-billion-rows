import { generateSensorValues, randomDate, pickRandomSource, CONST, sourceCount } from "./generate";
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

  const nSnapshots = [100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000];
  //const nSnapshots = [100, 200];
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

    insertChronoData.push([totalSv, insertChrono / newSv]);
    searchChronoData.push([totalSv, searchChrono]);
  }
  const xAxis = "Total number of SV in the DB";

  const summary = {
    ...CONST,
    snapshotsPerIteration: JSON.stringify(nSnapshots),
    generatedSensorValues: totalSv,
    generatedSnapshots: nSnapshots.reduce((acc, n) => acc + n, 0),
    generatedSources: sourceCount,
  };

  const insertChronoSerie = {
    title: "Batch insert duration per SensorValue",
    yAxis: "chrono per SV (milliseconds)",
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
    { token: '"${summary}"', replacement: JSON.stringify(summary, undefined, 2) },
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
