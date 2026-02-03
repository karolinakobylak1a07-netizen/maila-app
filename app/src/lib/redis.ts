const mockRedis = {
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue('OK'),
  expire: vi.fn().mockResolvedValue(1)
}

export const redis = mockRedis as any

export function resetRedisMock() {
  mockRedis.get.mockResolvedValue(null)
  mockRedis.set.mockResolvedValue('OK')
  mockRedis.expire.mockResolvedValue(1)
}

export function setRedisGetMock(value: string | null) {
  mockRedis.get.mockResolvedValue(value)
}
