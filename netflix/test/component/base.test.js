import Component from '../../src/component/base.js';

class MockComponent extends Component {
  createElements() {
    return document.createElement('section');
  }
  createChildren() {
    return {inner: new Component()};
  }
  updateElements(newData, oldData) {
    this.getElement().dataset.newData = newData;
    this.getElement().dataset.oldData = oldData;
  }
  updateChildren(newData, oldData) {
    const inner = this.getChild('inner');
    if (inner) {
      inner.getElement().dataset.newData = newData;
      inner.getElement().dataset.oldData = oldData;
    }
  }
}

describe('Component', () => {

  let component, child;
  beforeEach(() => {
    component = new MockComponent({
      cssClasses: ['extra-classiness']
    });
    child = new Component();
  });

  describe('constructor', () => {
    it('populates elements', () => {
      component.getElement().tagName.should === 'SECTION';
    });
    it('populates child components', () => {
      component.getChild('inner').should.exist;
    });
    it('appends CSS classes', () => {
      component.getElement().classList.contains('extra-classiness').should.be.ok;
    });
  });

  describe('#getElement', () => {
    it('returns the DOM element', () => {
      component.getElement().should.be.instanceof(HTMLElement);
    });
  });

  describe('#getChild', () => {
    it('returns the named child component', () => {
      component.getChild('inner').should.be.instanceof(Component);
    });
  });

  describe('#addChild', () => {
    it('appends the component in DOM', () => {
      component.addChild('newChild', child);
      component.getElement().lastChild.should.equal(child.getElement());
    });
    it('stores the component by name', () => {
      component.addChild('newChild', child);
      component.getChild('newChild').should.equal(child);
    });
    it('sets parentage data on the child', () => {
      component.addChild('newChild', child);
      child.getParentage().should.deepEqual(['newChild', component]);
    });
  })

  describe('#removeChild', () => {
    it('removes the named component', () => {
      component.removeChild('inner');
      component.getElement().childNodes.length.should.equal(0);
      should(component.getChild('inner')).be.undefined;
    });
    it('removes parentage data', () => {
      const inner = component.getChild('inner');
      component.removeChild('inner');
      inner.getParentage().should.deepEqual([null, null]);
    });
  });

  describe('#removeFromParent', () => {
    it('removes self from the parent component', () => {
      const inner = component.getChild('inner');
      inner.removeFromParent();
      should(component.getChild('inner')).be.undefined;
    });
  });

  describe('#removeAllChildren', () => {
    it('calls removeChild for each named child', () => {
      component.addChild('newChild', child);
      component.removeAllChildren();
      should(component.getChild('inner')).be.undefined;
      should(component.getChild('newChild')).be.undefined;
    });
  });

  describe('#setData', () => {
    it('updates elements passing new data and old data', () => {
      const element = component.getElement();
      component.setData('first');
      element.dataset.newData.should.equal('first');
      element.dataset.oldData.should.equal('null');
      component.setData('second');
      element.dataset.newData.should.equal('second');
      element.dataset.oldData.should.equal('first');
    });
    it('updates child components passing new data and old data', () => {
      const element = component.getChild('inner').getElement();
      component.setData('first');
      element.dataset.newData.should.equal('first');
      element.dataset.oldData.should.equal('null');
      component.setData('second');
      element.dataset.newData.should.equal('second');
      element.dataset.oldData.should.equal('first');
    });
  });

});