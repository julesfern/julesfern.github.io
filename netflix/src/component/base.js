/*
 *
 * Defines an (extremely) simple hierarchical component type. Each component
 * owns both a DOM tree, and a map of named child components. While a typical
 * component has a simple DOM hierarchy in which a single element contains
 * all the DOM trees provided by its children, it is legal for a component
 * to 'slot' child components into different DOM locations based on their
 * names, type or other properties at insertion time.
 * 
 * Components have little in the way of lifecycle, relying on GC for disposal.
 * 
 * Unlike React components, these instances do not differentiate between 'props'
 * and 'state' - there is only `data`, updated by calling `setData` with new values.
 * When data is set on a component, two seperate update methods will be called -
 * `updateElements`, responsible for updating the component's own DOM tree,
 * and `updateChildren`, responsible for relaying data to any child components.
 * 
 * Component lifecycle:
 * - During creation:
 *   1. `createElements` is called and is expected to return the root element 
 *      for the component.
 *   2. `createChildren` is called, and is expected to return an k/v object of named
 *      child components. These will be inserted into the root element, or whatever
 *      element is designated by `getTargetParentElement` if you choose to override.
 * - During `setData`:
 *   1. `updateElements` is called with both the new and previous data. In this method
 *      you may make destructive changes to elements directly owned by this component.
 *   2. `updateChildren` is called with both the new and previous data. Typically one
 *      would simply be assigning relevant child data to child components in this method.
 */

import MessageBus from '../util/message-bus.js';

export default class Component extends MessageBus {

  constructor(options={}) {
    super();
    this._options = options;
    this._data = null;
    this._name = null;
    this._parent = null;
    this._navigationController = options.navigationController || null;
    this._element = this.createElements(options);
    this._children = new Map();
    // Initialize child components
    const initialChildren = this.createChildren(options);
    for (let k in initialChildren) {
      this.addChild(k, initialChildren[k])
    }
    // Initialize classlist
    if (options.cssClasses) {
      options.cssClasses.forEach(className => this._element.classList.add(className));
    }
  }

  // ------------------------------------------------
  // PUBLIC SECTION

  getElement() {
    return this._element;
  }

  getChild(name) {
    return this._children.get(name);
  }

  addChild(name, child) {
    // make insertion order match DOM appendChild semantics
    this._children.set(name, child);
    child.setParentage(name, this);
    this.domAppendChild(name, child);
  }

  removeChild(name) {
    const child = this._children.get(name);
    if (child) {
      this._children.delete(name);
      child.setParentage(null, null);
      this.domRemoveChild(name, child);
    }
    return child;
  }

  removeFromParent() {
    if (this._parent) {
      this._parent.removeChild(this._name);
    }
  }

  removeAllChildren() {
    this._children.forEach((component, name) => this.removeChild(name));
  }

  setData(newData) {
    const oldData = this._data;
    this._data = newData;
    this.updateElements(newData, oldData);
    this.updateChildren(newData, oldData);
  }

  focus() {
    if (this._element.classList.contains('focus')) {
      return;
    }
    this.log('focus');
    this._element.classList.add('focus');
    const navigationController = this.getNavigationController();
    const navigationScheme = this.getNavigationScheme();
    if (navigationController && navigationScheme) {
      if (this._navigationReleaseHandle) {
        this.log('releasing pre-existing navigation handle');
        this._navigationReleaseHandle();
      }
      this.log('taking navigation control');
      this._navigationReleaseHandle = navigationController.pushScheme(navigationScheme);
    }
  }

  blur() {
    if (!this._element.classList.contains('focus')) {
      return;
    }
    this.log('blur');
    this._element.classList.remove('focus');
    if (this._navigationReleaseHandle) {
      this.log('releasing navigation control');
      this._navigationReleaseHandle.call();
      this._navigationReleaseHandle = null;
    }
  }

  show() {
    this.log('show');
    this.getElement().style.display = 'block';
  }
  hide() {
    this.log('hide');
    this.getElement().style.display = 'none';
  }

  setNavigationScheme(scheme) {
    this._navigationScheme = scheme;
  }

  // ------------------------------------------------
  // PROTECTED SECTION

  getParent() {
    return this._parent;
  }

  getParentage() {
    return [this._name, this._parent];
  }

  setParentage(name, parent) {
    this._name = name;
    this._parent = parent;
  }

  getNavigationController() {
    return getNearestAncestorValue(this, '_navigationController');
  }

  getNavigationScheme() {
    return this._navigationScheme;
  }

  getLogName() {
    const nameSegs = [];
    let target = this;
    while(target) {
      nameSegs.unshift(target.getParentage()[0]);
      target = target.getParent();
    }
    return nameSegs.join('.');
  }

  log() {
    console.log(this.getLogName(), 'log:', ...arguments);
  }

  domAppendChild(name, child) {
    const childElem = child.getElement();
    this.getTargetParentElement(name, child).appendChild(childElem);
  }

  domRemoveChild(name, child) {
    const childElem = child.getElement();
    this.getTargetParentElement(name, child).removeChild(childElem);
  }

  createElements() {
    return document.createElement('div');
  }

  createChildren() {
    return {};
  }

  getTargetParentElement(name, component) {
    return this.getElement();
  }

  // Called to update elements belonging to this component
  updateElements(newData, oldData) {
    return; // NOOP on abstract class
  }

  // Called to update child components
  updateChildren(newData, oldData) {
    return; // NOOP on abstract class
  }

}

// ---------------------------------------------------
// PRIVATE SECTION

function getNearestAncestorValue(component, key) {
  let target = component;
  while (target) {
    if (target[key]) return target[key];
    target = target.getParent();
  }
}