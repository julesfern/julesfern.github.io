import Component from './base.js';

export default class TitleDisplay extends Component {
  
  constructor(options) {
    super({...options, cssClasses: ['title-display']});
  }

  createElements() {
    const root = document.createElement('div');
    const heading = document.createElement('h1');
    const metadata = document.createElement('ol');
    const yearLi = document.createElement('li');
    const ratingLi = document.createElement('li');
    root.appendChild(heading);
    root.appendChild(metadata);
    metadata.appendChild(yearLi);
    metadata.appendChild(ratingLi);
    return root;
  }

  updateElements({selection, showDetail}) {
    if (!selection) {
      return;
    }
    const root = this.getElement();
    const heading = root.querySelector('h1');
    const list = root.querySelector('ol');
    const [yearLi, ratingLi] = list.querySelectorAll('li');

    heading.innerText = selection.title;      
    yearLi.innerText = selection.releaseYear;
    ratingLi.innerText = selection.rating;

    if (showDetail) root.classList.add('show-detail');
    else root.classList.remove('show-detail');
  }

}