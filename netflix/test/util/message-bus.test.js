import MessageBus from '../../src/util/message-bus.js';

describe('MessageBus', () => {

  let messageBus;
  beforeEach(() => messageBus = new MessageBus());

  it('invokes subscribers for the given message', () => {
    const triggerSpies = [sinon.spy(), sinon.spy()];
    const skipSpy = sinon.spy();
    const messageBus = new MessageBus();
    triggerSpies.forEach(spy => messageBus.subscribe('x', spy));
    messageBus.subscribe('y', skipSpy);
    messageBus.dispatch('x');
    
    triggerSpies.forEach(spy => {
      spy.callCount.should.equal(1);
    });
    skipSpy.callCount.should.equal(0);
  });

  it('passes data arguments to subscribers', (done) => {
    const callback = function() {
      arguments.length.should.equal(2);
      arguments[0].should.equal('a');
      arguments[1].should.equal('b');
      done(); // actually synchronous but guarantees call was made
    }
    messageBus.subscribe('x', callback);
    messageBus.dispatch('x', 'a', 'b');
  });

  it('removes listeners on unsubscribe', () => {
    const callback = sinon.spy();
    messageBus.subscribe('x', callback);
    messageBus.dispatch('x');
    messageBus.unsubscribe('x', callback);
    messageBus.dispatch('x');
    callback.callCount.should.equal(1);
  });

  it('unsubscribes automatically for single-use subscribers', () => {
    const callback = sinon.spy();
    messageBus.subscribeOnce('x', callback);
    messageBus.dispatch('x');
    messageBus.dispatch('x');
    callback.callCount.should.equal(1);
  });

  it('exposes subscriber count', () => {
    const callback = () => {};
    messageBus.subscribe('x', callback);
    messageBus.hasSubscribers('x').should.equal(true);
    messageBus.hasSubscribers('y').should.equal(false);
  });

});