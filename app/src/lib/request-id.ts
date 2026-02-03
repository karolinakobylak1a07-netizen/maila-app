export const generateRequestId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  const randomId = Math.random().toString(36).substring(2, 9);
  return `req_${timestamp}_${random}_${randomId}`;
};

export const generateLastSyncRequestId = (clientId: string): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `sync_${clientId.slice(0, 8)}_${timestamp}_${random}`;
};
