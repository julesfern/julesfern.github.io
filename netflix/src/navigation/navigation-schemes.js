import MessageBus from '../util/message-bus.js';

/*
 * Defines a set of mappings between keys and functions. Typically, the NavigationController
 * will allow schemes to overlay one another (for example, a topmost scheme with only left/right
 * key handlers defined will allow the press of up/down to bubble to the next scheme in the stack).
 * To disable this behavior, 
 */

export class ArbitraryNavigationScheme {
  constructor(mappings, {exclusive=false}) {
    this._exclusive = exclusive;
    this._mappings = new Map();
    for (let k in mappings) this._mappings.set(k, mappings[k]);
  }
  isExclusive() {
    return this._exclusive;
  }
  getMappings() {
    return this._mappings;
  }
}

export class HListNavigationScheme extends ArbitraryNavigationScheme {
 constructor({next, previous, select}, options={}) {
   super({
     "left": previous,
     "right": next,
     "enter": select
   }, options);
 }
}

export class VListNavigationScheme extends ArbitraryNavigationScheme {
  constructor({next, previous, select}, options={}) {
    super({
      "up": previous,
      "down": next,
      "enter": select
    }, options);
  }
}