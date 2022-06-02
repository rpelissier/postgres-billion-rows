# Postgres Prisma Benchmark

The purpose of this project is to measure how Postgres perf is scaling with the number of entries in the DB.

The performance is measured on the following use case :

- search SensorValue over a range of dates
- insert a small number of new SensorValues

The project is a node/ts project.

Usage :

```bash
yarn install
yarn docker:up
yarn start
yarn docker:down
```
