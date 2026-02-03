const mockRedis = {
  get: async () => null as string | null,
  set: async () => 'OK',
  expire: async () => 1,
}

export const redis = mockRedis

export function resetRedisMock() {
  mockRedis.get = async () => null
  mockRedis.set = async () => 'OK'
  mockRedis.expire = async () => 1
}

export function setRedisGetMock(value: string | null) {
  mockRedis.get = async () => value
}
