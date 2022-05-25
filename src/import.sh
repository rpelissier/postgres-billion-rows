#!/bin/sh

startChrono(){
    echo ===== $1 starting...
    start=`date +%s`
}

endChrono(){
    end=`date +%s`
    durationSec=$(end-start)
    echo ===== $1 done in $durationSec secs
}


docker_id=$(docker ps -aqf "name=postgres-billion")
echo Postgres Docker ID : $docker_id

startChrono "Generating DATA"
#node index.js
endChrono "Generating DATA"

container_data=/var/lib/postgresql/data
local_data=./postgres-data


startChrono "Uploading Script and CSV to Docker"
#docker exec -it $docker_id rm $container_data/mts-script.sql
#docker exec -it $docker_id rm $container_data/mts-data-sensor.csv
#docker exec -it $docker_id rm $container_data/mts-data-sensor-value.csv

#docker cp script.sql $docker_id:$container_data/mts-script.sql
#docker cp data-sensor.csv $docker_id:$container_data/mts-data-sensor.csv
#docker cp data-sensor-value.csv $docker_id:$container_data/mts-data-sensor-value.csv

rm $local_data/mts-script.sql
rm $local_data/mts-data-sensor.csv
rm $local_data/mts-data-sensor-value.csv

cp script.sql $local_data/mts-script.sql
cp data-sensor.csv $local_data/mts-data-sensor.csv
cp data-sensor-value.csv $local_data/mts-data-sensor-value.csv

endChrono "Uploading Script and CSV to Docker"

startChrono "Running import"
docker exec -it $docker_id psql postgres -f $container_data/mts-script.sql
endChrono "Running import"