import Promise from 'bluebird'

export class SirtiRemoteActivitySource {

  constructor(connection) {
    this.connection = connection
  }

  insert() {
    let query = 'SELECT 1 from dual'
    var bind = []
    this.connection.execute(query, bind)
      .then((result) => {
        resolve(result.rows[0][0])
      })
      .catch(err) {
        reject(err)
      }
  }

}

export default { SirtiRemoteActivitySource }
