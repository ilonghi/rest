import http from 'http'
import { env, mongo, port, ip } from './config'
import mongoose from './services/mongoose'
import express from './services/express'
import api from './api'
import oracledb from 'oracledb';
import dbConfig from './dbconfig.js';

const app = express(api)
const server = http.createServer(app)

// mongoose.connect(mongo.uri)
function init() {
  oracledb.createPool({
    user: dbConfig.user,
    password: dbConfig.password,
    connectString: dbConfig.connectString
    // Default values shown below
    // externalAuth: false, // whether connections should be established using External Authentication
    // poolMax: 4, // maximum size of the pool. Increase UV_THREADPOOL_SIZE if you increase poolMax
    // poolMin: 0, // start with no connections; let the pool shrink completely
    // poolIncrement: 1, // only grow the pool by one connection at a time
    // poolTimeout: 60, // terminate connections that are idle in the pool for 60 seconds
    // poolPingInterval: 60, // check aliveness of connection if in the pool for 60 seconds
    // queueRequests: true, // let Node.js queue new getConnection() requests if all pool connections are in use
    // queueTimeout: 60000, // terminate getConnection() calls in the queue longer than 60000 milliseconds
    // poolAlias: 'myalias' // could set an alias to allow access to the pool via a name
    // stmtCacheSize: 30 // number of statements that are cached in the statement cache of each connection
   })
    .then((pool) => {
      setImmediate(() => {
        server.listen(port, ip, () => {
          console.log('Express server listening on http://%s:%d, in %s mode', ip, port, env)
        })
      })
    })
    .catch((err) => {
      console.error("createPool() error: " + err.message)
      return
    })
}

init()

export default app
