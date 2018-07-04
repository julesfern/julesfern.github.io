import Component from './base.js';
import VirtualList from './virtual-list.js';
import VideoList from './video-list.js';
import {VListNavigationScheme} from '../navigation/navigation-schemes.js';

/*
 * Defines a UI components for browsing through curated lists of videos ("categories")
 * that make up a user's catalog.
 */
export default class CategoryList extends VirtualList {

  constructor(options) {
    super({
      ...options, 
      direction: 'vertical',
      viewGutter: 15,
      cssClasses: ['category-list']
    });
    this.setNavigationScheme(new VListNavigationScheme({
      next: () => this.focusNext(),
      previous: () => this.focusPrevious()
    }));
  }

  setData(newCatalog) {
    super.setData(newCatalog);
    if (newCatalog && newCatalog !== this._oldCatalog) {
      const delegate = new CategoryListDelegate(newCatalog.getListsWithVideoData());
      this.setDelegate(delegate);
    }
    this._oldCatalog = newCatalog;
  }

}

/*
 * Defines the view for a single "category" item, i.e. a single row in the catalog
 */
class CategoryListItem extends Component {
  constructor(options) {
    super(options);
    this.boundOnVideoFocussed = this.onVideoFocussed.bind(this);
    this.boundOnVideoSelected = this.onVideoSelected.bind(this);
  }
  createElements() {
    const root = document.createElement('li');
    const heading = document.createElement('h2');
    root.classList.add('category');
    root.appendChild(heading);
    return root;
  }
  createChildren() {
    return {
      'videoList': new VideoList()
    };
  }
  updateElements({data, index}) {
    // Retag data
    this._element.setAttribute('data-index', index);
    // Update heading
    const heading = this._element.querySelector('h2');
    heading.innerText = `${data.listName}`;
  }
  updateChildren({data, index}) {
    this.getChild('videoList').setData(data.listVideos);
  }
  focus() {
    super.focus();
    const videoList = this.getChild('videoList');
    videoList.subscribe('focussedItem', this.boundOnVideoFocussed);
    videoList.subscribe('selectedItem', this.boundOnVideoSelected);
    videoList.focus();
    videoList.focusItem(videoList.getFocusIndex());
  }
  blur() {
    super.blur();
    const videoList = this.getChild('videoList');
    videoList.blur();
    videoList.unsubscribe('focussedItem', this.boundOnVideoFocussed);
    videoList.unsubscribe('selectedItem', this.boundOnVideoSelected);
  }
  onVideoFocussed(index, videoData) {
    const parent = this.getParent(); // guaranteed to be categoryList
    if (parent) {
      parent.dispatch('videoFocussed', videoData);
    }
  }
  onVideoSelected(index, videoData) {
    const parent = this.getParent(); // guaranteed to be categoryList
    if (parent) {
      parent.dispatch('videoSelected', videoData);
    }
  }
}

/*
 * Defines delegate behavior for the category list
 */
class CategoryListDelegate {

  constructor(data) {
    this._data = data;
    this._itemDimensions = [260, 186];
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
    return new CategoryListItem();
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