import {loadJson} from '../util/json-loader.js';

/*
 *
 * Defines a simple read-only data layer for the user's video catalog.
 * The application is expected to `loadData()` the data layer before querying it for data.
 * 
 */

const VIDEOS_URL = '/netflix/asset/data/videos.json';
const LISTS_URL = '/netflix/asset/data/lists.json';

export default class Catalog {

  constructor() {
    this._lists = [];
    this._videos = [];
  }

  loadData() {
    return Promise.all([loadJson(LISTS_URL), loadJson(VIDEOS_URL)])
      .then(([listsData, videosData]) => {
        this._lists = listsData;
        this._videos = videosData;
      })
      .catch(err => {
        console.error('FATAL: Could not load catalog data');
        console.error(err);
      });
  }

  getAllLists() {
    return this._lists;
  }

  getAllVideos() {
    return this._videos;
  }

  getListsWithVideoData() {
    const videoMap = new Map();
    this._videos.forEach(video => videoMap.set(video.videoId, video));
    this._lists.forEach(list => {
      list.listVideos = list.listVideoIds.map(id => videoMap.get(id));
    });
    return this._lists;
  }

}