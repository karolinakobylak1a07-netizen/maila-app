const mockRedis = {
  get: () => null,
  set: () => 'OK',
  expire: () => 1
}

export const redis = mockRedis
