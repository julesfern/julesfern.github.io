export function debounce(msThrottle, callback) {
  let lastCallMs = 0;
  return function() {
    const nowMs = Date.now();
    if (nowMs > lastCallMs + msThrottle) {
      lastCallMs = nowMs;
      callback(...arguments);
    }
  }
}