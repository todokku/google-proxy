#!/bin/bash
rm /data/db/mongod.lock
nohup mongod --repair > db.log 2>&1 &
nohup mongod --bind_ip=127.0.0.1 --nojournal > db.log 2>&1 &
nohup redis-server > redis.log 2>&1 &
nohup node index.js -p 8080 > server.log 2>&1 &
