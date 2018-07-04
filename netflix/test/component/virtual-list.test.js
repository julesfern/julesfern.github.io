import Component from '../../src/component/base.js';
import VirtualList from '../../src/component/virtual-list.js';
import {getTestbenchElement} from '../helpers.js';

const TEST_STYLES = document.createElement('style');
TEST_STYLES.setAttribute('type', 'text/css');
TEST_STYLES.innerHTML = `
  .virtual-list {
    position: relative;
    width: 100%;
    height: 50%;
    overflow: hidden;
  }
  .virtual-list ul {
    list-style-type: none;
    margin: 0;
    padding: 0;
    background: #EFEFEF;
  }
  .virtual-list li {
    position: absolute;
    top: 0; 
    left: 0;
    width: 96px;
    height: 12px;
    background: #CCC;
    font-size: 12px;
    margin: 0;
    padding: 2px;
  }
  .virtual-list li.focus {
    background: #333;
    color: #EFEFEF;
  }

  .virtual-list.horizontal li {
    height: 100%;
  }
  .virtual-list.vertical li {
    width: 100%;
  }
`;


class MockListItemComponent extends Component {
  createElements() {
    const li = document.createElement('li');
    return li;
  }
  updateElements(newData) {
    this.getElement().innerText = newData;
  }
}

class MockListDelegate {

  constructor(id, data) {
    this._data = [];
    for (let i=0; i < 100; i++) {
      this._data.push(`delegate(${id})-index(${i})`);
    }
    this.releaseComponent = sinon.spy();
    this.destroyComponent = sinon.spy();
  }

  getItemCount() { return this._data.length; }
  getItemData(index) { return this._data[index]; }
  getMaximumItemDimensions() { return [100,16]; }
  getItemDimensions(index) {  return [100,16]; }
  createComponent() { return new MockListItemComponent(); }
  updateComponent(index, data, targetComponent) {
    targetComponent.setData(data);
  }

}

describe('VirtualList', () => {

  let testbench, vlist, hlist, gotInitialSize;
  before((done) => {
    document.body.appendChild(TEST_STYLES);
    testbench = getTestbenchElement();
    vlist = new VirtualList({direction: 'vertical', viewGutter: 1});
    hlist = new VirtualList({direction: 'horizontal', viewGutter: 1});

    const obs = new ResizeObserver(entries => {
      let resolve = true;
      for (let entry of entries) {
        const rect = entry.contentRect;
        if (rect.width <= 0 && rect.height <= 0) {
          resolve = false;
        }
      }
      if (resolve && !gotInitialSize) {
        gotInitialSize = true;
        done();
      }
    });
    obs.observe(vlist.getElement());
    obs.observe(hlist.getElement());

    testbench.appendChild(vlist.getElement());
    testbench.appendChild(hlist.getElement());
  });

  describe('#setDelegate', () => {
    it('renders and focusses the first item', () => {
      const ul = vlist.getElement().querySelector('ul');
      ul.childNodes.length.should.equal(0);
      vlist.setDelegate(new MockListDelegate('1'));
      ul.childNodes.length.should.be.greaterThan(0);
      ul.firstChild.classList.contains('focus').should.be.ok;
    });
    it('removes all prior delegate components', () => {
      vlist.setDelegate(new MockListDelegate('1'));
      vlist.setDelegate(new MockListDelegate('2'));
      const nodes = vlist.getElement().querySelector('ul').childNodes;
      nodes.length.should.be.greaterThan(0);
      for (let i=0; i<nodes.length; i++) {
        nodes[i].innerText.should.match(/^delegate\(2\)/);
      }
    });
    it('requests component destruction from the prior delegate', () => {
      const delegate1 = new MockListDelegate('1');
      const delegate2 = new MockListDelegate('2');
      vlist.setDelegate(delegate1);
      const nodes = vlist.getElement().querySelector('ul').childNodes;
      vlist.setDelegate(delegate2);
      delegate1.destroyComponent.callCount.should.equal(nodes.length);
    });
  });

  

  describe('with vertical orientation', () => {
    describe('#focusItem', () => {
      it('when focussing first item, anchors to the top edge', () => {
        vlist.setDelegate(new MockListDelegate('1'));
        vlist.focusItem(0);
        const elem = vlist.getElement().querySelector('li.focus');
        const position = parseInt(elem.style.transform.match(/-?\d+/)[0]);
        position.should.equal(0);
      });
      it('when focussing middle item, keeps the item within the bounding box', function() {
        vlist.setDelegate(new MockListDelegate('1'));
        vlist.focusItem(20);
        const elem = vlist.getElement().querySelector('li.focus');
        const position = parseInt(elem.style.transform.match(/-?\d+/)[0]);
        position.should.be.greaterThan(0);
        position.should.be.lessThan(vlist._size - 16);
      });
      it('when focussing last item, anchors to the bottom edge', () => {
        const delegate = new MockListDelegate('1');
        vlist.setDelegate(delegate);
        vlist.focusItem(delegate.getItemCount() - 1);
        const elem = vlist.getElement().querySelector('li.focus');
        const position = parseInt(elem.style.transform.match(/-?\d+/)[0]);
        position.should.equal(vlist._size - 16);
      });
      it('manages a single focussed item', () => {
        vlist.setDelegate(new MockListDelegate('1'));
        vlist.focusItem(0);
        vlist.focusItem(1);
        const elems = vlist.getElement().querySelectorAll('li.focus');
        elems.length.should.equal(1);
        elems[0].innerText.should.equal('delegate(1)-index(1)');
      });
    });
  }); 

  describe('with horizontal orientation', () => {
    describe('#focusItem', () => {
      it('keeps the focussed item within the bounding box', () => {
        hlist.setDelegate(new MockListDelegate('1'));
        hlist.focusItem(0);
        const elem = hlist.getElement().querySelector('li.focus');
        const position = parseInt(elem.style.transform.match(/-?\d+/)[0]);
        position.should.equal(0);
      });
      it('when focussing middle item, keeps the item within the bounding box', function() {
        hlist.setDelegate(new MockListDelegate('1'));
        hlist.focusItem(20);
        const elem = hlist.getElement().querySelector('li.focus');
        const position = parseInt(elem.style.transform.match(/-?\d+/)[0]);
        position.should.be.greaterThan(0);
        position.should.be.lessThan(hlist._size - 100);
      });
      it('when focussing last item, anchors to the bottom edge', () => {
        const delegate = new MockListDelegate('1');
        hlist.setDelegate(delegate);
        hlist.focusItem(delegate.getItemCount() - 1);
        const elem = hlist.getElement().querySelector('li.focus');
        const position = parseInt(elem.style.transform.match(/-?\d+/)[0]);
        position.should.equal(hlist._size - 100);
      });
    });
  });

});