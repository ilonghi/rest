import oracledb from 'oracledb'
import Promise from 'bluebird'
import { SirtiError } from '../../services/sirti-error'

class UserSchema {

  constructor(row) {
    console.log('constructor ', row)
    this.username = row[0]
    this.surname = row[1]
    this.firstname = row[2]
    console.log(this)
  }

  show() {
    return {
      username: this.username,
      surname: this.surname,
      firstname: this.firstname
    }
  }

}

class Users {

  static find(username) {
    return new Promise((resolve, reject) => {
      if(username === 'ILONGHIX') {
        reject(new SirtiError('ILONGHIX error', 'nun se vede', 400))
      }
      if(username === 'ILONGHIZ') {
        reject(new Error('ILONGHIZ error'))
      }
      oracledb.getPool().getConnection()
        .then((connection) => {
          var query = 'SELECT login_operatore "username", cognome_operatore "surname", nome_operatore "firstname" from operatori where 1=1'
          var bind = []
          if(username) {
            query += ' and login_operatore = :username'
            bind.push(username)
          }
          // console.log(query)
          // console.log(bind);
          connection.execute(query, bind)
            .then((result) => {
              // console.log(result.metaData)
              // console.log(result.rows)
              var users
              users = result.rows.map((user) => new UserSchema(user).show())
              doRelease(connection)
              resolve(users)
            })
            .catch((err) => {
              console.error(err)
              doRelease(connection)
              reject(err)
            })
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  static findByUsername(username) {
    return new Promise((resolve, reject) => {
      this.find(username)
        .then((users) => {
          if(users.length == 0) {
            return resolve()
          }
          resolve(users[0])
        })
        .catch((err) => reject(err))
    })
  }

}

function doRelease(connection) {
  connection.close((err) => {
    if (err) {
      console.error(err.message)
    }
    console.log("Releasing connection")
  })
}


/*
import mongoose, { Schema } from 'mongoose'

const usersSchema = new Schema({
  username: {
    type: String
  },
  surname: {
    type: String
  },
  firstname: {
    type: String
  }
}, {
  timestamps: true
})

usersSchema.methods = {
  view (full) {
    const view = {
      // simple view
      id: this.id,
      username: this.username,
      surname: this.surname,
      firstname: this.firstname,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }

    return full ? {
      ...view
      // add properties for a full view
    } : view
  }
}

const model = mongoose.model('Users', usersSchema)
*/

// export const schema = model.schema
export default Users
