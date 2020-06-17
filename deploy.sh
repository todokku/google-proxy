#!/bin/bash
cd /wwwroot/so.ggga.ga
git fetch --all
git reset --hard origin/master
npm install
docker restart so
i=0
fail=0
until [ "`/usr/bin/docker inspect -f {{.State.Running}} so`" == "true" ]; do
    sleep 0.1
    i=$((i+1))
    if [[ i -gt 100 ]]; then
        fail=1
        break;
    fi;
done;
if [[ fail -eq 0 ]]; then
    docker restart so_slave
fi;
