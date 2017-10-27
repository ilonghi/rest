import uuid from 'uuid/v4'

export class SirtiError {

  constructor(message, internalMessage, status = 500) {
    this.message = message
    this.internalMessage = internalMessage || message
    this.status = status
  }

}

export function errorHandler(err, req, res, next) {
  // console.log("sono qui")
  // console.log(err)
  if(err instanceof SirtiError) {
    var ret = {
      message: err.message,
      UUID: req.UUID || uuid()
    }
    if(process.env.NODE_ENV !== 'production') {
      ret.internalMessage = err.internalMessage
    }
    return res.status(err.status).json(ret)
  }
  next(err)
}

export default { SirtiError, errorHandler }
