import request from 'supertest-as-promised'
import express from '../../services/express'
import routes, { Users } from '.'

const app = () => express(routes)

let users

beforeEach(async () => {
  users = await Users.create({})
})

test('POST /users 201', async () => {
  const { status, body } = await request(app())
    .post('/')
    .send({ username: 'test', surname: 'test', firstname: 'test' })
  expect(status).toBe(201)
  expect(typeof body).toEqual('object')
  expect(body.username).toEqual('test')
  expect(body.surname).toEqual('test')
  expect(body.firstname).toEqual('test')
})

test('GET /users 200', async () => {
  const { status, body } = await request(app())
    .get('/')
  expect(status).toBe(200)
  expect(Array.isArray(body)).toBe(true)
})

test('GET /users/:id 200', async () => {
  const { status, body } = await request(app())
    .get(`/${users.id}`)
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(users.id)
})

test('GET /users/:id 404', async () => {
  const { status } = await request(app())
    .get('/123456789098765432123456')
  expect(status).toBe(404)
})

test('PUT /users/:id 200', async () => {
  const { status, body } = await request(app())
    .put(`/${users.id}`)
    .send({ username: 'test', surname: 'test', firstname: 'test' })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(users.id)
  expect(body.username).toEqual('test')
  expect(body.surname).toEqual('test')
  expect(body.firstname).toEqual('test')
})

test('PUT /users/:id 404', async () => {
  const { status } = await request(app())
    .put('/123456789098765432123456')
    .send({ username: 'test', surname: 'test', firstname: 'test' })
  expect(status).toBe(404)
})

test('DELETE /users/:id 204', async () => {
  const { status } = await request(app())
    .delete(`/${users.id}`)
  expect(status).toBe(204)
})

test('DELETE /users/:id 404', async () => {
  const { status } = await request(app())
    .delete('/123456789098765432123456')
  expect(status).toBe(404)
})
