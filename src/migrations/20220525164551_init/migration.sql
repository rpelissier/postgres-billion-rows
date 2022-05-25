-- CreateTable
CREATE TABLE "sensor" (
    "tag" TEXT NOT NULL,

    CONSTRAINT "sensor_pkey" PRIMARY KEY ("tag")
);

-- CreateTable
CREATE TABLE "sensor_value" (
    "sensorTag" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "mean" DOUBLE PRECISION,
    "std" DOUBLE PRECISION,

    CONSTRAINT "sensor_value_pkey" PRIMARY KEY ("date","sensorTag")
);

-- CreateIndex
CREATE INDEX "sensor_value_sensorTag_date_idx" ON "sensor_value"("sensorTag", "date");

-- AddForeignKey
ALTER TABLE "sensor_value" ADD CONSTRAINT "sensor_value_sensorTag_fkey" FOREIGN KEY ("sensorTag") REFERENCES "sensor"("tag") ON DELETE RESTRICT ON UPDATE CASCADE;
