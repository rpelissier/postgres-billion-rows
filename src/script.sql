COPY sensor("tag") FROM '/var/lib/postgresql/data/mts-data-sensor.csv' CSV;
COPY sensor_value("sensorTag", "date", "mean", "std") FROM '/var/lib/postgresql/data/mts-data-sensor-value.csv' CSV;