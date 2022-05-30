-- CreateTable
CREATE TABLE "sensor" (
    "source" TEXT NOT NULL,
    "tag" TEXT NOT NULL,

    CONSTRAINT "sensor_pkey" PRIMARY KEY ("source","tag")
);

-- CreateTable
CREATE TABLE "sensor_value" (
    "source" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "sensorTag" TEXT NOT NULL,
    "mean" DOUBLE PRECISION,
    "std" DOUBLE PRECISION,

    CONSTRAINT "sensor_value_pkey" PRIMARY KEY ("source","date","sensorTag")
);

-- CreateIndex
CREATE INDEX "sensor_value_source_sensorTag_date_idx" ON "sensor_value"("source", "sensorTag", "date");

-- AddForeignKey
ALTER TABLE "sensor_value" ADD CONSTRAINT "sensor_value_source_sensorTag_fkey" FOREIGN KEY ("source", "sensorTag") REFERENCES "sensor"("source", "tag") ON DELETE RESTRICT ON UPDATE CASCADE;
