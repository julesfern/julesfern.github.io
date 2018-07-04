export function loadJson(url) {
  return fetch(url).then(resp => resp.json());
}