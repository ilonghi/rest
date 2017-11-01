import oracledb from 'oracledb'
import Promise from 'bluebird'

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

    this.sessionReady = false // Indica che l'insert nella RA_SESSION non è ancora avvenuto
  }

  init() {
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
        -- EXCEPTIONS
      end;
    `
    return new Promise((resolve, reject) => {
      this.connection.execute(sql, {
        SESSION_TOKEN: { dir: oracledb.BIND_INOUT, type: oracledb.STRING },
        SESSION_TYPE: { val: this.sessionType, dir: oracledb.BIND_IN, type:oracledb.STRING },
        RA_DBLINK: { val: "", dir: oracledb.BIND_IN, type:oracledb.STRING },
        SESSION_DESCRIPTION: { val: this.sessionDescription, dir: oracledb.BIND_IN, type:oracledb.STRING },
        SESSION_CMDLINE: { val: "FIXME", dir: oracledb.BIND_IN, type:oracledb.STRING }, // FIXME
        SOURCE_SERVICE: { val: this.sourceService, dir: oracledb.BIND_IN, type:oracledb.STRING },
        SOURCE_CONTEXT: { val: this.sourceContext, dir: oracledb.BIND_IN, type:oracledb.STRING },
        USER_ID: { val: null, dir: oracledb.BIND_IN, type:oracledb.NUMBER },
        USER_NAME: { val: null, dir: oracledb.BIND_IN, type:oracledb.STRING }
      })
        .then((res) => {
          this.sessionToken = res.outBinds.SESSION_TOKEN
          let sql = `
            begin
              rm_activity.get_session_info (
                 :CUR
                ,:SESSION_TOKEN
              );
              -- EXCEPTIONS
            end;
          `
          this.connection.execute(sql, {
            CUR: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
            SESSION_TOKEN: { val: this.sessionToken, dir: oracledb.BIND_IN, typex: oracledb.STRING }
          }, { outFormat: oracledb.OBJECT })
            .then((res) => {
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
                      -- EXCEPTIONS
                    end;
                  `
                  this.connection.execute(sql, {
                    SESSION_TARGET_TOKEN: { dir: oracledb.BIND_OUT, type: oracledb.STRING },
                    SESSION_TOKEN: { val: this.sessionToken, dir: oracledb.BIND_IN, typex: oracledb.STRING },
                    TARGET_SERVICE: { val: this.targetService, dir: oracledb.BIND_IN, typex: oracledb.STRING },
                    TARGET_CONTEXT: { val: this.targetContext, dir: oracledb.BIND_IN, typex: oracledb.STRING },
                  })
                    .then((res) => {
                      this.targetToken[this.targetService][this.targetContext] = res.outBinds.SESSION_TARGET_TOKEN
                      let sql = `
                        begin
                          rm_activity.store_session (
                            :SESSION_TOKEN
                          );
                          -- EXCEPTIONS
                        end;
                      `
                      this.connection.execute(sql, {
                        SESSION_TOKEN: { val: this.targetToken[this.targetService][this.targetContext], dir: oracledb.BIND_IN, typex: oracledb.STRING }
                      })
                        .then(() => {
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

  insert() {
    let query = 'SELECT 1 from dual'
    var bind = []
    this.connection.execute(query, bind)
      .then((result) => {
        resolve(result.rows[0][0])
      })
      .catch((err) => {
        reject(err)
      })
  }

}

export default { RemoteActivitySource }
