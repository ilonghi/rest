import oracledb from 'oracledb'
import Promise from 'bluebird'
import _ from 'underscore'

import { EXCEPTIONS } from './constants'
import { SirtiError } from '../sirti-error'

export class RemoteActivitySource {

  constructor(connection, session) {
    this.connection = connection
    this.sessionDescription = session.description
    this.sourceService = session.sourceService
    this.sourceContext = session.sourceContext
    this.targetService = session.targetService
    this.targetContext = session.targetContext

    this.sessionType = "S"
    this.sessionToken = undefined
    this.sessionId = undefined
    this.targetToken = {}
    this.targetToken[this.targetService] = {}
    this.targetToken[this.targetService][this.targetContext] = undefined
    this.dbLink = ''

    this.sessionReady = false // Indica che l'insert nella RA_SESSION non è ancora avvenuto

    this.raDataChunkLength = 4000
  }

  _check_session_exists() {
    return new Promise((resolve, reject) => {
      let sql = `
        begin
          :CHECK_SESSION_ID := rm_activity.check_session_exists (
             :SESSION_TOKEN
            ,:SESSION_ID
          );
          ${EXCEPTIONS}
        end;
      `
      this.connection.execute(sql, {
        CHECK_SESSION_ID: { val: this.sessionToken, dir: oracledb.BIND_INOUT, type: oracledb.STRING },
        SESSION_TOKEN: { val: this.sessionToken, dir: oracledb.BIND_IN, type: oracledb.STRING },
        SESSION_ID: { val: this.sessionId, dir: oracledb.BIND_IN, type:oracledb.NUMBER },
        ERRMSG: { dir: oracledb.BIND_INOUT, type: oracledb.STRING },
        ERRCODE: { dir: oracledb.BIND_INOUT, type: oracledb.NUMBER },
        DBLINK: { val: this.dbLink, dir: oracledb.BIND_IN, type: oracledb.STRING }
      })
        .then((res) => {
          if(res.outBinds.CHECK_SESSION_ID === "0") {
            return resolve(false)
          }
          return resolve(true)
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  is_session_ready() {
    return new Promise((resolve, reject) => {
      // se la sessione non è ancora stata inizializzata restituisco false
      if(!this.sessionReady) {
        return resolve(false)
      }
      // la sessione è già stata inizializzata ma verifico che un rollback non abbia cancellato
      // il record in ra_session, eventualmente lo reinserisco e ritorno true
      this._check_session_exists()
        .then((bool) => {
          resolve(bool)
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  set_session_ready() {
    return this.sessionReady = true
  }

  init_session() {
    return new Promise((resolve, reject) => {
      this.is_session_ready()
        .then((bool) => {
          if(bool === true) {
            return resolve()
          }
          let sql = `
            begin
              rm_activity.store_session (
                :SESSION_TOKEN
              );
              ${EXCEPTIONS}
            end;
          `
          this.connection.execute(sql, {
            SESSION_TOKEN: { val: this.targetToken[this.targetService][this.targetContext], dir: oracledb.BIND_IN, typex: oracledb.STRING },
            ERRMSG: { dir: oracledb.BIND_INOUT, type: oracledb.STRING },
            ERRCODE: { dir: oracledb.BIND_INOUT, type: oracledb.NUMBER },
            DBLINK: { val: this.dbLink, dir: oracledb.BIND_IN, type: oracledb.STRING }
          })
            .then((res) => {
              if(res.outBinds.ERRCODE) {
                return reject(new SirtiError(res.outBinds.ERRCODE + ' - ' + res.outBinds.ERRMSG))
              }
              this.set_session_ready()
              resolve()
            })
            .catch((err) => {
              reject(err)
            })
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  init() {
    return new Promise((resolve, reject) => {
      let sql = `
        begin
          :SESSION_TOKEN := rm_activity.create_session (
             :SESSION_TYPE
            ,:RA_DBLINK
            ,:SESSION_DESCRIPTION
            ,:SESSION_CMDLINE
            ,:SOURCE_SERVICE
            ,:SOURCE_CONTEXT
            ,:USER_ID
            ,:USER_NAME
          );
          ${EXCEPTIONS}
        end;
      `
      this.connection.execute(sql, {
        SESSION_TOKEN: { dir: oracledb.BIND_INOUT, type: oracledb.STRING },
        SESSION_TYPE: { val: this.sessionType, dir: oracledb.BIND_IN, type:oracledb.STRING },
        RA_DBLINK: { val: "", dir: oracledb.BIND_IN, type:oracledb.STRING },
        SESSION_DESCRIPTION: { val: this.sessionDescription, dir: oracledb.BIND_IN, type:oracledb.STRING },
        SESSION_CMDLINE: { val: "FIXME", dir: oracledb.BIND_IN, type:oracledb.STRING }, // FIXME
        SOURCE_SERVICE: { val: this.sourceService, dir: oracledb.BIND_IN, type:oracledb.STRING },
        SOURCE_CONTEXT: { val: this.sourceContext, dir: oracledb.BIND_IN, type:oracledb.STRING },
        USER_ID: { val: null, dir: oracledb.BIND_IN, type:oracledb.NUMBER },
        USER_NAME: { val: null, dir: oracledb.BIND_IN, type:oracledb.STRING },
        ERRMSG: { dir: oracledb.BIND_INOUT, type: oracledb.STRING },
        ERRCODE: { dir: oracledb.BIND_INOUT, type: oracledb.NUMBER },
        DBLINK: { val: this.dbLink, dir: oracledb.BIND_IN, type: oracledb.STRING }
      })
        .then((res) => {
          if(res.outBinds.ERRCODE) {
            return reject(new SirtiError(res.outBinds.ERRCODE + ' - ' + res.outBinds.ERRMSG))
          }
          this.sessionToken = res.outBinds.SESSION_TOKEN
          let sql = `
            begin
              rm_activity.get_session_info (
                 :CUR
                ,:SESSION_TOKEN
              );
              ${EXCEPTIONS}
            end;
          `
          this.connection.execute(sql, {
            CUR: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
            SESSION_TOKEN: { val: this.sessionToken, dir: oracledb.BIND_IN, typex: oracledb.STRING },
            ERRMSG: { dir: oracledb.BIND_INOUT, type: oracledb.STRING },
            ERRCODE: { dir: oracledb.BIND_INOUT, type: oracledb.NUMBER },
            DBLINK: { val: this.dbLink, dir: oracledb.BIND_IN, type: oracledb.STRING }
          }, { outFormat: oracledb.OBJECT })
            .then((res) => {
              if(res.outBinds.ERRCODE) {
                return reject(new SirtiError(res.outBinds.ERRCODE + ' - ' + res.outBinds.ERRMSG))
              }
              res.outBinds.CUR.getRow()
                .then((row) => {
                  this.sessionId = row.ID
                  let sql = `
                    begin
                      :SESSION_TARGET_TOKEN := rm_activity.create_target_session (
                        :SESSION_TOKEN
                        ,:TARGET_SERVICE
                        ,:TARGET_CONTEXT
                      );
                      ${EXCEPTIONS}
                    end;
                  `
                  this.connection.execute(sql, {
                    SESSION_TARGET_TOKEN: { dir: oracledb.BIND_OUT, type: oracledb.STRING },
                    SESSION_TOKEN: { val: this.sessionToken, dir: oracledb.BIND_IN, typex: oracledb.STRING },
                    TARGET_SERVICE: { val: this.targetService, dir: oracledb.BIND_IN, typex: oracledb.STRING },
                    TARGET_CONTEXT: { val: this.targetContext, dir: oracledb.BIND_IN, typex: oracledb.STRING },
                    ERRMSG: { dir: oracledb.BIND_INOUT, type: oracledb.STRING },
                    ERRCODE: { dir: oracledb.BIND_INOUT, type: oracledb.NUMBER },
                    DBLINK: { val: this.dbLink, dir: oracledb.BIND_IN, type: oracledb.STRING }
                  })
                    .then((res) => {
                      if(res.outBinds.ERRCODE) {
                        return reject(new SirtiError(res.outBinds.ERRCODE + ' - ' + res.outBinds.ERRMSG))
                      }
                      this.targetToken[this.targetService][this.targetContext] = res.outBinds.SESSION_TARGET_TOKEN
                      let sql = `
                        begin
                          rm_activity.store_session (
                            :SESSION_TOKEN
                          );
                          ${EXCEPTIONS}
                        end;
                      `
                      this.connection.execute(sql, {
                        SESSION_TOKEN: { val: this.targetToken[this.targetService][this.targetContext], dir: oracledb.BIND_IN, typex: oracledb.STRING },
                        ERRMSG: { dir: oracledb.BIND_INOUT, type: oracledb.STRING },
                        ERRCODE: { dir: oracledb.BIND_INOUT, type: oracledb.NUMBER },
                        DBLINK: { val: this.dbLink, dir: oracledb.BIND_IN, type: oracledb.STRING }
                      })
                        .then((res) => {
                          if(res.outBinds.ERRCODE) {
                            return reject(new SirtiError(res.outBinds.ERRCODE + ' - ' + res.outBinds.ERRMSG))
                          }
                          this.set_session_ready()
                          resolve()
                        })
                        .catch((err) => {
                          reject(err)
                        })
                    })
                    .catch((err) => {
                      reject(err)
                    })
                })
                .catch((err) => {
                  reject(err)
                })
            })
            .catch((err) => {
              reject(err)
            })
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  insert(eventName, sourceRef, data = {}, needAck = false, scheduleDate = null, expiryDate = null) {
    return new Promise((resolve, reject) => {
      this.init_session()
        .then(() => {
          let sql = `
            begin
              :RES_ID := rm_activity.event_insert(
                 :SESSION_TOKEN
                ,:SOURCE_REF
                ,:EVENT
                ,sysdate
                ,:SCHEDULE_DATE
                ,:EXPIRY_DATE
                ,:NEED_ACK
              );
              ${EXCEPTIONS}
            end;
          `
          this.connection.execute(sql, {
            RES_ID: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
            SESSION_TOKEN: { val: this.sessionToken, dir: oracledb.BIND_IN, typex: oracledb.STRING },
            SOURCE_REF: { val: sourceRef, dir: oracledb.BIND_IN, typex: oracledb.STRING },
            EVENT: { val: eventName, dir: oracledb.BIND_IN, typex: oracledb.STRING },
            SCHEDULE_DATE: { val: scheduleDate, dir: oracledb.BIND_IN, typex: oracledb.DATE },
            EXPIRY_DATE: { val: expiryDate, dir: oracledb.BIND_IN, typex: oracledb.DATE },
            NEED_ACK: { val: (needAck ? "1" : null), dir: oracledb.BIND_IN, typex: oracledb.STRING },
            ERRMSG: { dir: oracledb.BIND_INOUT, type: oracledb.STRING },
            ERRCODE: { dir: oracledb.BIND_INOUT, type: oracledb.NUMBER },
            DBLINK: { val: this.dbLink, dir: oracledb.BIND_IN, type: oracledb.STRING }
          })
            .then((res) => {
              if(res.outBinds.ERRCODE) {
                return reject(new SirtiError(res.outBinds.ERRCODE + ' - ' + res.outBinds.ERRMSG))
              }
              let raId = res.outBinds.RES_ID
              this._insertRaData(raId, data)
                .then(() => {
                  resolve(raId)
                })
                .catch((err) => {
                  reject(err)
                })
            })
            .catch((err) => {
              reject(err)
            })
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  _insertRaDataChunk(raId, name, value, chunkId = null) {
    // console.log("chunkId,name,value: %s,%s,%s", name, value, chunkId)
    return new Promise((resolve, reject) => {
      let sql = `
        begin
          :RES_ID := rm_activity.event_data_insert(
             :SESSION_TOKEN
            ,:EVENT_ID
            ,:NAME
            ,:VALUE
            ,:CHUNK_ID
          );
          ${EXCEPTIONS}
        end;
      `
      this.connection.execute(sql, {
        RES_ID: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        SESSION_TOKEN: { val: this.sessionToken, dir: oracledb.BIND_IN, type: oracledb.STRING },
        EVENT_ID: { val: raId, dir: oracledb.BIND_IN, type: oracledb.NUMBER },
        NAME: { val: name, dir: oracledb.BIND_IN, type: oracledb.STRING },
        VALUE: { val: value, dir: oracledb.BIND_IN, type: oracledb.STRING },
        CHUNK_ID: { val: chunkId, dir: oracledb.BIND_IN, type: oracledb.NUMBER },
        ERRMSG: { dir: oracledb.BIND_INOUT, type: oracledb.STRING },
        ERRCODE: { dir: oracledb.BIND_INOUT, type: oracledb.NUMBER },
        DBLINK: { val: this.dbLink, dir: oracledb.BIND_IN, type: oracledb.STRING }
      })
        .then((res) => {
          if(res.outBinds.ERRCODE) {
            return resolve({ ok: false, err: new SirtiError(res.outBinds.ERRCODE + ' - ' + res.outBinds.ERRMSG) })
          }
          resolve({ ok: true, raDataId: res.outBinds.RES_ID })
        })
        .catch((err) => {
          return resolve({ ok: false, err })
        })
    })
  }

  _insertRaDataString(raId, name, value, chunkId = null, raDataIds = []) {
    return new Promise((resolve, reject) => {
      if(_.isNull(chunkId)) {
        chunkId = value.length > this.raDataChunkLength ? 0 : null
      } else {
        chunkId++
      }
      // console.log("arguments: ", arguments)
      // console.log("chunkId: ", chunkId)
      // console.log("value: ", value)
      let chunk = value.substr(0, this.raDataChunkLength)
      value = value.substr(this.raDataChunkLength)
      // inserisco l'elemento dell'array
      return this._insertRaDataChunk(raId, name, chunk, chunkId)
        .then((res) => {
          if(!res.ok) {
            return resolve({ ok: res.ok, err: res.err })
          }
          raDataIds.push(res.raDataId)
          if(value.length) {
            // ho ancora elementi da inserire quindi chiamo ricorsivamente la funzione
            return this._insertRaDataString(raId, name, value, chunkId, raDataIds)
              .then((res) => {
                return resolve({ ok: true, raDataId: raDataIds })
              })
          }
          // iterazione finale
          return resolve({ ok: true, raDataId: raDataIds })
        })
    })
  }

  _insertRaDataArray(raId, name, values, raDataIds = []) {
    return new Promise((resolve, reject) => {
      if(!values.length) {
        resolve({ ok: false, err: new SirtiError("Cannot insert empty array as ra data")})
      }
      let value = values.shift()
      // inserisco l'elemento dell'array
      return this._insertRaDataString(raId, name, value)
        .then((res) => {
          if(!res.ok) {
            return resolve({ ok: res.ok, err: res.err })
          }
          raDataIds.push(res.raDataId)
          if(values.length) {
            // ho ancora elementi da inserire quindi chiamo ricorsivamente la funzione
            return this._insertRaDataArray(raId, name, values, raDataIds)
              .then((res) => {
                return resolve({ ok: true, raDataId: raDataIds })
              })
          }
          // iterazione finale
          return resolve({ ok: true, raDataId: raDataIds })
        })
    })
  }

  _insertRaData(raId, data) {
    return new Promise((resolve, reject) => {
      // console.log(data)
      if(_.isEmpty(data)) {
        // console.log("_insertRaData finish")
        return resolve()
      }
      let name = _.keys(data)[0]
      let value = data[name]
      delete data[name]
      if(_.isNull(value) || _.isUndefined(value)) {
        value = ""
      }
      if(_.isNumber(value)) {
        value = value.toString()
      }
      // inserisco l'elemento
      let promise;
      if(_.isArray(value)) {
        promise = this._insertRaDataArray(raId, name, value)
      } else if(_.isString(value)) {
        // console.log("chiamo con ", value)
        promise = this._insertRaDataString(raId, name, value)
      } else {
        reject(new SirtiError("You can insert only strings, numbers or array as ra data"))
      }
      return promise
        .then((res) => {
          if(!res.ok) {
            // console.log(res.err)
            return reject(res.err)
          }
          if(!_.isEmpty(data)) {
            // ho ancora elementi da inserire, quindi chiamo ricorsivamente
            // la funzione
            return this._insertRaData(raId, data)
              .then((res) => {
                resolve()
              })
              .catch((err) => {
                reject(err)
              })
          }
          // iterazione finale
          return resolve()
        })
    })
  }

}

export default { RemoteActivitySource }
