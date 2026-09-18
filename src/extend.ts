/** Last-10-minute bid adds 10 minutes, only if that new close is still in the future. */
export const SNIPE_WINDOW_MS = 10 * 60 * 1000

export function shouldExtend(closesAt: Date, bidAt: Date, now = new Date(), windowMs = SNIPE_WINDOW_MS) {
  return bidAt < closesAt && closesAt.getTime() - bidAt.getTime() <= windowMs && bidAt.getTime() + windowMs > now.getTime()
}

export function extendedClose(closesAt: Date, windowMs = SNIPE_WINDOW_MS) {
  return new Date(closesAt.getTime() + windowMs)
}
