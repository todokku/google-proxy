#!/bin/bash
cd /wwwroot/so.ggga.ga
git fetch --all
git reset --hard origin/master
npm install
docker restart so