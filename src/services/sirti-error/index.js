import uuid from 'uuid/v4'

export class SirtiError extends Error {

  constructor(data) {
    
    data = data || {}

    if(data instanceof Error) {
      data = { message: data.message }
    }

    data.status = data.status || 500
    data.message = data.message || "Internal server error"
    
    // Calling parent constructor of base Error class.
    super(data.message)
    // Set the prototype explicitly
    Object.setPrototypeOf(this, SirtiError.prototype);
    // Capturing stack trace, excluding constructor call from it.
    Error.captureStackTrace(this, this.constructor);
    // Saving class name in the property of our custom error as a shortcut.
    this.name = this.constructor.name;
 
    this.internalMessage = data.internalMessage || this.message
    this.status = data.status

  }

}

export function errorHandler(err, req, res, next) {
  // console.log("sono qui")
  // console.log(err)
  // console.log("err instanceof SirtiError: ", err instanceof SirtiError)
  // console.log("err instanceof Error: ", err instanceof Error)
  // console.log("err.name: ", err.name)
  if(err instanceof SirtiError) {
    var ret = {
      message: err.message,
      UUID: req.UUID || uuid()
    }
    if(!/^production/.test(process.env.NODE_ENV)) {
      ret.internalMessage = err.internalMessage
    }
    return res.status(err.status).json(ret)
  } else if(err instanceof Error) {
    return errorHandler(new SirtiError(err), req, res, next)
  }
  next(err)
}

export default { SirtiError, errorHandler }
