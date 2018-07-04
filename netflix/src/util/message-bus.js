/*
 * Simple utility class for managing message subscription
 * and dispatch. Can be used as a simple event emitter.
 */

export default class MessageBus {

  constructor() {
    this._allSubscribers = new Map();
  }

  // ---------------------------------------------------
  // PUBLIC SECTION

  subscribe(messageType, callback) {
    const subscribers = getSubscribers(this._allSubscribers, messageType);
    subscribers.add(callback);
  }

  subscribeOnce(messageType, callback) {
    const subscribers = getSubscribers(this._allSubscribers, messageType);
    const wrappedCallback = (function() { 
      // long-hand bound function to preserve arguments 
      // passed during dispatch
      this.unsubscribe(messageType, wrappedCallback);
      callback.call(null, ...arguments);
    }).bind(this);
    subscribers.add(wrappedCallback);
  }

  unsubscribe(messageType, callback) {
    const subscribers = getSubscribers(this._allSubscribers, messageType);
    subscribers.delete(callback);
  }

  dispatch(messageType, ...data) {
    const subscribers = getSubscribers(this._allSubscribers, messageType);
    for (let callback of subscribers) {
      callback.call(null, ...data);
    }
  }

  hasSubscribers(messageType) {
    return getSubscribers(this._allSubscribers, messageType).size > 0;
  }

}

// ---------------------------------------------------
// PRIVATE SECTION

function getSubscribers(subscriptionMap, messageType) {
  if (subscriptionMap.has(messageType)) {
    return subscriptionMap.get(messageType);
  } else {
    const subscribers = new Set();
    subscriptionMap.set(messageType, subscribers);
    return subscribers;
  }
}