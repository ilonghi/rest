import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { create, index, show, update, destroy } from './controller'
// import { schema } from './model'
// export Users, { schema } from './model'
import Users from './model'
export Users from './model'

const router = new Router()
// const { username, surname, firstname } = schema.tree

/**
 * @api {post} /users Create users
 * @apiName CreateUsers
 * @apiGroup Users
 * @apiParam username Users's username.
 * @apiParam surname Users's surname.
 * @apiParam firstname Users's firstname.
 * @apiSuccess {Object} users Users's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Users not found.
 */
router.post('/',
//  body({ username, surname, firstname }),
  create)

/**
 * @api {get} /users Retrieve users
 * @apiName RetrieveUsers
 * @apiGroup Users
 * @apiUse listParams
 * @apiSuccess {Object[]} users List of users.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 */
router.get('/',
  query(),
  index)

/**
 * @api {get} /users/:id Retrieve users
 * @apiName RetrieveUsers
 * @apiGroup Users
 * @apiSuccess {Object} users Users's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Users not found.
 */
router.get('/:username',
  show)

/**
 * @api {put} /users/:id Update users
 * @apiName UpdateUsers
 * @apiGroup Users
 * @apiParam username Users's username.
 * @apiParam surname Users's surname.
 * @apiParam firstname Users's firstname.
 * @apiSuccess {Object} users Users's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Users not found.
 */
router.put('/:id',
//  body({ username, surname, firstname }),
  update)

/**
 * @api {delete} /users/:id Delete users
 * @apiName DeleteUsers
 * @apiGroup Users
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Users not found.
 */
router.delete('/:id',
  destroy)

export default router
