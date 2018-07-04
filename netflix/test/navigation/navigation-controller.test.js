import NavigationController from '../../src/navigation/navigation-controller.js';
import {ArbitraryNavigationScheme} from '../../src/navigation/navigation-schemes.js';
import {simulateKeyboardEvent} from '../helpers.js';

describe('NavigationController', () => {

  const hitEnter = simulateKeyboardEvent.bind(null, 'keydown', 13);
  let schemes, navigationController;
  beforeEach(() => {
    schemes = [];
    navigationController = new NavigationController();
    for (let i = 0; i < 10; i++) {
      schemes.push(new ArbitraryNavigationScheme({
        'enter': sinon.stub()
      }, {exclusive: false}));
    }
  });

  describe('::handleKeyDown', () => {
    it('triggers topmost mapping for the given key', () => {
      schemes.forEach((scheme) => navigationController.pushScheme(scheme));
      hitEnter();
      schemes.forEach((scheme, index) => {
        const expectedCalls = (index === schemes.length - 1)? 1 : 0;  
        scheme.getMappings().get('enter').callCount.should.equal(expectedCalls);
      });
    });
    it('trickles unmapped keys down to the next appropriate key', () => {
      const leftMapping = new ArbitraryNavigationScheme({'left': sinon.stub()}, {exclusive: false});
      schemes.forEach((scheme) => navigationController.pushScheme(scheme));
      navigationController.pushScheme(leftMapping);
      schemes[schemes.length - 1].getMappings().get('enter').callCount.should.equal(0);
      hitEnter();
      schemes[schemes.length - 1].getMappings().get('enter').callCount.should.equal(1);
    });
    it('does not trickle unmapped keypresses past an exclusive scheme', () => {
      const leftMapping = new ArbitraryNavigationScheme({'left': sinon.stub()}, {exclusive: true});
      schemes.forEach((scheme) => navigationController.pushScheme(scheme));
      navigationController.pushScheme(leftMapping);
      schemes[schemes.length - 1].getMappings().get('enter').callCount.should.equal(0);
      hitEnter();
      schemes[schemes.length - 1].getMappings().get('enter').callCount.should.equal(0);
    });
  })

  describe('#pushScheme', () => {
    describe('releaseHandle', () => {
      it('throws if called more than once', () => {
        const handle = navigationController.pushScheme(schemes.pop());
        handle.should.not.throw();
        handle.should.throw();
      });
      it('frees down to the next unreleased scheme when the topmost scheme is released', () => {
        const releaseHandles = [];
        const initialLength = schemes.length;
        schemes.forEach((scheme) => releaseHandles.push(navigationController.pushScheme(scheme)));
        

        schemes[schemes.length - 1].getMappings().get('enter').callCount.should.equal(0);
        hitEnter();
        navigationController.getStack().length.should.equal(initialLength);
        schemes[schemes.length - 1].getMappings().get('enter').callCount.should.equal(1);

        releaseHandles[schemes.length - 3].call();
        hitEnter();
        navigationController.getStack().length.should.equal(initialLength);
        schemes[schemes.length - 1].getMappings().get('enter').callCount.should.equal(2);

        releaseHandles[schemes.length - 2].call();
        hitEnter();
        navigationController.getStack().length.should.equal(initialLength);
        schemes[schemes.length - 1].getMappings().get('enter').callCount.should.equal(3);

        schemes[schemes.length - 4].getMappings().get('enter').callCount.should.equal(0);
        releaseHandles[schemes.length - 1].call();
        hitEnter();
        navigationController.getStack().length.should.equal(initialLength - 3);
        schemes[schemes.length - 4].getMappings().get('enter').callCount.should.equal(1);
      })
    });
  });

});