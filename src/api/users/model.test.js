import { Users } from '.'

let users

beforeEach(async () => {
  users = await Users.create({ username: 'test', surname: 'test', firstname: 'test' })
})

describe('view', () => {
  it('returns simple view', () => {
    const view = users.view()
    expect(typeof view).toBe('object')
    expect(view.id).toBe(users.id)
    expect(view.username).toBe(users.username)
    expect(view.surname).toBe(users.surname)
    expect(view.firstname).toBe(users.firstname)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })

  it('returns full view', () => {
    const view = users.view(true)
    expect(typeof view).toBe('object')
    expect(view.id).toBe(users.id)
    expect(view.username).toBe(users.username)
    expect(view.surname).toBe(users.surname)
    expect(view.firstname).toBe(users.firstname)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })
})
