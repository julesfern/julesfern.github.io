import Component from './base.js';
import VirtualList from './virtual-list.js';
import {HListNavigationScheme} from '../navigation/navigation-schemes.js';

/*
 * Defines a UI components for browsing through curated lists of videos ("categories")
 * that make up a user's catalog.
 */
export default class VideoList extends VirtualList {

  constructor(options) {
    super({
      ...options, 
      direction: 'horizontal',
      viewGutter: 30,
      cssClasses: ['video-list']
    });
    this.setNavigationScheme(new HListNavigationScheme({
      next: () => this.focusNext(),
      previous: () => this.focusPrevious(),
      select: () => this.selectFocussedItem()
    }));
  }

  setData(videos) {
    super.setData(videos);
    const delegate = new VideoListDelegate(videos || []);
    this.setDelegate(delegate);
  }

  selectFocussedItem() {
    const index = this.getFocusIndex();
    const data = this.getDelegate().getItemData(index);
    this.dispatch('selectedItem', index, data);
  }

}

/*
 * Defines the view for a single "category" item, i.e. a single row in the catalog
 */
class VideoListItem extends Component {
  createElements() {
    const root = document.createElement('li');
    const img = document.createElement('img');
    root.classList.add('video');
    root.appendChild(img);
    return root;
  }
  updateElements({data, index}) {
    // Retag data
    this._element.setAttribute('data-index', index);
    // Update heading
    const img = this._element.querySelector('img');
    img.setAttribute('src', `/netflix/asset/image/boxart/${data.videoId}.jpg`)
  }
}

/*
 * Defines delegate behavior for the category list
 */
class VideoListDelegate {

  constructor(data) {
    this._data = data;
    this._itemDimensions = [268, 154];
  }

  getItemCount() { 
    return Infinity;
  } // -> int
  getItemData(index) {
    // circular/infinite access
    let circularIndex = (index < this._data.length)? index : index % this._data.length;
    return this._data[circularIndex];
  }
  getMaximumItemDimensions() {
    return this._itemDimensions;
  }
  getItemDimensions(index) {
    return this._itemDimensions;
  }
  createComponent() {
    return new VideoListItem();
  }
  updateComponent(index, data, targetComponent) {
    targetComponent.setData({data, index});
  }

  releaseComponent(targetComponent) {
    // no release routine needed
  }

  destroyComponent(targetComponent) {
    // no destruction needed
  }

}