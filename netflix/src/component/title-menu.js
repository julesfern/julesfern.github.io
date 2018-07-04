import Component from './base.js';
import {VListNavigationScheme} from '../navigation/navigation-schemes.js';

const BUTTONS = [
  {label: 'Play', event: 'selectedPlay'},
  {label: 'Back', event: 'selectedBack'},
  {label: 'Rate', event: 'selectedRate'},
  {label: 'Episodes', event: 'selectedEpisodes'},
];

export default class TitleMenu extends Component {
  constructor(options) {
    super({...options, cssClasses: ['title-menu']});
    this.setNavigationScheme(new VListNavigationScheme({
      next: () => this.focusNext(),
      previous: () => this.focusPrevious(),
      select: () => this.selectFocussed()
    }, {exclusive: true}));
  }

  createElements() {
    const root = document.createElement('ul');
    BUTTONS.forEach(btnConfig => {
      const li = document.createElement('li');
      li.setAttribute('data-event', btnConfig.event);
      li.innerText = btnConfig.label;
      root.appendChild(li);
    })
    return root;
  }
  updateElements() {
    this.focusItem(0);
  }

  setData(newData) {
    super.setData(newData);
    this._videoSelection = newData.selection;
  }

  focusNext() {
    this.focusItem((this._focusItem >= BUTTONS.length - 1)? 0 : this._focusItem + 1);
  }
  focusPrevious() {
    this.focusItem((this._focusItem <= 0)? BUTTONS.length - 1 : this._focusItem - 1);
  }
  focusItem(index) {
    const root = this.getElement();
    for (let i = 0; i < BUTTONS.length; i++) {
      if (i === index) root.childNodes[i].classList.add('focus');
      else root.childNodes[i].classList.remove('focus');
    }
    this._focusItem = index;
  }
  selectFocussed() {
    this.dispatch('optionSelected', BUTTONS[this._focusItem], this._videoSelection);
  }
}