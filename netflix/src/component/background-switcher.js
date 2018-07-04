import Component from './base.js';

export default class BackgroundSwitcher extends Component {
  
  constructor(options) {
    super({...options, cssClasses: ['background-switcher']});
  }

  createElements() {
    const root = document.createElement('div');
    return root;
  }

  updateElements(selectedVideo) {
    const root = this._element;
    const existingImg = root.firstChild;
    if (existingImg && existingImg.getAttribute('data-video-id') === selectedVideo.videoId) {
      return;
    }
    // add new img
    const selectionImg = document.createElement('img');
    const cleanupOldNodes = () => {
      let pivot;
      for (let i = 0; i < root.childNodes.length; i++) {
        const node = root.childNodes[i];
        if (node === selectionImg) pivot = i; 
        if (i >= pivot) root.removeChild(node);
      }
      selectionImg.removeEventListener('transitionend', cleanupOldNodes);
    };
    selectionImg.setAttribute('data-video-id', selectedVideo.videoId);
    selectionImg.setAttribute('src', `/netflix/asset/image/displayart/${selectedVideo.videoId}.jpg`);
    selectionImg.addEventListener('transitionend', cleanupOldNodes);
    root.insertBefore(selectionImg, root.firstChild);
  }

}