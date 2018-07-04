/*
 *
 * This is the root Application component.
 *  
 */

import BackgroundSwitcher from './component/background-switcher.js';
import Component from './component/base.js';
import Catalog from './data/catalog.js';
import CategoryList from './component/category-list.js';
import NavigationController from './navigation/navigation-controller.js';
import TitleDisplay from './component/title-display.js';
import TitleMenu from './component/title-menu.js';

export default class App extends Component {

  constructor(options) {
    super({
      ...options, 
      navigationController: new NavigationController(),
      cssClasses: ['app']
    });
    this._name = 'app'; // logging readability hack, no functionality
    this.initApplicationState();
  }

  initApplicationState() {
    // Inject data
    const catalog = new Catalog();
    this.setData({});
    catalog.loadData().then(() => {
      // Bind events
      let selectedVideoId = null;
      this.getChild('categories').subscribe('videoFocussed', (videoData) => {
        if (videoData.videoId !== selectedVideoId) {
          this.setData({catalog, selection: videoData, screen: 'carousel'});
          selectedVideoId = videoData.videoId;
        }
      });
      this.getChild('categories').subscribe('videoSelected', (videoData) => {
        this.setData({catalog, selection: videoData, screen: 'menu'});
      });
      this.getChild('menu').subscribe('optionSelected', (option, videoData) => {
        if (option.event === 'selectedBack') {
          this.setData({catalog, selection: videoData, screen: 'carousel'});
        }
        else {
          alert(`${option.label} ${videoData.title}`);
        }
      });
      // Set initial state
      this.setData({catalog});
      // Reset UI focus
      this.getChild('categories').focus();
    });
  }

  createElements({elementId='app-root'}) {
    const root = document.createElement('section');
    root.setAttribute('id', elementId);
    return root;
  }

  createChildren(options) {
    return {
      'title': new TitleDisplay(),
      'menu': new TitleMenu(),
      'background': new BackgroundSwitcher(),
      'categories': new CategoryList()
    };
  }

  updateChildren(newData, oldData) {
    const {catalog, selection, screen} = newData;
    this.log('updateState', catalog, selection, screen);
    const title = this.getChild('title');
    const categories = this.getChild('categories');
    const menu = this.getChild('menu');
    const background = this.getChild('background');

    if (catalog && !oldData.catalog) {
      // Set catalog data (first load only)
      categories.setData(catalog);
    }

    if (selection) {
      // update only if selection has changed
      background.setData(selection);
      title.setData({selection, showDetail: (screen === 'menu')});
      menu.setData({selection});
    }

    if (screen === 'menu') {
      categories.hide();
      menu.show();
      menu.focus();
    }
    else {
      categories.show();
      menu.hide();
      menu.blur();
    }
  }

}