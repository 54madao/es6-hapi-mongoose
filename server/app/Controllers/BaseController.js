import Boom from 'boom'
import Joi from 'joi'
import Async from 'async'

export class BaseController {

  /**
   * Constructor
   *
   * @param {stirng} notFoundMsg [optional]
   */
  constructor(notFoundMsg = '') {
    this.Boom = Boom
    this.notFoundMsg = notFoundMsg
    this.Joi = Joi
    this.Async = Async
  }

  
}