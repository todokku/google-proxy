#!/bin/bash
cd /wwwroot/so.ggga.ga
git fetch --all
git reset --hard origin/master
npm install
docker restart so
until [ "`/usr/bin/docker inspect -f {{.State.Running}} so`" == "true" ]
do
    sleep 0.1
done
docker restart so_slave
