import Component from './base.js';
import {debounce} from '../util/timings.js';

/*
 * Defines a basic one-dimensional virtual list capable of
 * supporting either horizontal or vertical scrolling. Requires
 * a delegate object implementing the ListDelegate interface.
 */

// interface ListDelegate {
//   constructor(data) {}
//   getItemCount() {} // -> positive Number
//   getItemData(index) {} // -> Any
//   getMaximumItemDimensions() {} // -> [int width, int height]
//   getItemDimensions(index) {} // -> [int width, int height]
//   createComponent() {} // -> Component
//   updateComponent(index, data, targetComponent) {} // -> void
//   releaseComponent(targetComponent) {} // -> void
//   destroyComponent(targetComponent) {} // -> void
// }

const MIN_PRERERENDERED_ITEMS = 4;
const VIEW_POOL_MAX_SIZE = 10;
const FOCUS_ANIMATION_DURATION = 250;

const CONFIG_VERTICAL = {
  direction: 'vertical',
  cssClass: 'vertical',
  delegateSizeDimension: 1, // second of dimensions tuple is height
  cssTransformFunction: 'translateY',
  navigationScheme: null
};
const CONFIG_HORIZONTAL = {
  direction: 'horizontal',
  cssClass: 'horizontal',
  delegateSizeDimension: 0, // first of dimensions tuple is width
  cssTransformFunction: 'translateX',
  navigationScheme: null
};

export default class VirtualList extends Component {

  constructor(options) {
    super(options);
    this._directionConfig = (options.direction === 'horizontal')? CONFIG_HORIZONTAL : CONFIG_VERTICAL;
    this._viewGutterSize = (typeof options.viewGutter === 'number')? options.viewGutter : 5; // distance between views
    this._componentPool = []; // views currently free for recycling
    this._debounceMs = options.debounceMs || 300;
    this._focusIndex = -1;
    this._width = 0;
    this._height = 0;
    this._size = 0;
    this.getElement().classList.add(this._directionConfig.cssClass);
    this.observeContainerSize();
    this.focusNext = debounce(this._debounceMs, this.focusNext.bind(this));
    this.focusPrevious = debounce(this._debounceMs, this.focusPrevious.bind(this));
  }

  createElements() {
    const root = document.createElement('div');
    const list = document.createElement('ul');
    root.classList.add('virtual-list');
    list.classList.add('delegate-container');
    root.appendChild(list);
    // stash a pointer to the list element as we'll use it later
    this._listElement = list;
    return root;
  }

  observeContainerSize() {
    if (this._resizeObserver) return;
    // ONLY using native ResizeObserver because the test stipulates
    // latest Chrome. Use polyfill for older browsers
    // https://github.com/que-etc/resize-observer-polyfill
    this._resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const cr = entry.contentRect;
        if (cr.width <= 0 || cr.height <= 0) return;
        this.setDimensions(Math.floor(cr.width), Math.floor(cr.height));
      }
    });
    this._resizeObserver.observe(this.getElement());
  }

  setDimensions(width, height) {
    if (width === this._width && height === this._height) return;
    this._width = width || 0;
    this._height = height || 0;
    this._size = (this._directionConfig.direction === 'horizontal')? width : height;
    this.focusItem(this._focusIndex);
  }

  getDelegate() {
    return this._delegate;
  }

  setDelegate(delegate) {
    const priorDelegate = this._delegate;
    if (priorDelegate === delegate) return;

    if (priorDelegate) {
      this._children.forEach((component, name) => {
        this.removeChild(name);
        priorDelegate.destroyComponent(component);
      });
    }

    this._componentPool = [];
    this._delegate = delegate;
    this.focusItem(0);
  }

  focusItem(index) {
    const delegate = this._delegate;
    const directionConfig = this._directionConfig;
    const containerSize = this._size || 0;
    const gutterSize = this._viewGutterSize;
    const componentPool = this._componentPool;
    
    if (!delegate) return;
    this.log('setting focus to index', index);

    // Compute layout
    const layoutMap = getComputedLayout(index, delegate, directionConfig, containerSize, gutterSize);
    // Build comparison lists
    const {added, removed, updated} = getItemChanges(layoutMap, this._children);

    added.forEach(index => {
      const component = getComponentFromPool(componentPool, delegate);
      delegate.updateComponent(index, delegate.getItemData(index), component);
      this.addChild(index, component);
      // init coords
      setElementOffset(component.getElement(), layoutMap.get(index), directionConfig);
    });
    updated.forEach(index => {
      // animate position
      const component = this.getChild(index);
      animateElementOffset(component.getElement(), layoutMap.get(index), directionConfig);
    });
    removed.forEach(index => {
      const component = this.getChild(index);
      releaseComponentToPool(component, componentPool, delegate); 
    });

    // Pass interaction focus between active components
    setComponentFocus(this, this._focusIndex, index);
    this.dispatch('focussedItem', index, delegate.getItemData(index));
    // State memo
    this._focusIndex = index;
  }

  focusNext() {
    this.focusItem(Math.min(this._delegate.getItemCount(), this._focusIndex + 1));
  }

  focusPrevious() {
    this.focusItem(Math.max(0, this._focusIndex - 1));
  }

  getFocusIndex() {
    return this._focusIndex;
  }

  getTargetParentElement(name, component) {
    return this._listElement;
  }

}

// ---------------------------------------------------
// PRIVATE SECTION

function getComponentFromPool(componentPool, delegate) {
  return componentPool.pop() || delegate.createComponent();
}

function releaseComponentToPool(component, componentPool, delegate) {
  component.removeFromParent();
  delegate.releaseComponent(component);
  if (componentPool.length >= VIEW_POOL_MAX_SIZE) {
    delegate.destroyComponent(component);
  }
  else {
    componentPool.push(component);
  }
}

// Create computed layout object e.g.:
// Map(
//  index -> {size: 50, offset: 0}
// )
function getComputedLayout(index, delegate, directionConfig, containerSize, gutterSize) {
  const computedLayout = [];
  // Fill up layout to the top/left and right/bottom until we run out of space   
  let iOffset = 0;
  let iOffsetFactor = -1;
  let accumulatedSize = 0;
  let lowerBoundExceeded = false;
  let upperBoundExceeded = false;
  const maxLayoutSize = getMaximumLayoutSize(delegate, directionConfig, containerSize);
  while(accumulatedSize < maxLayoutSize) {
    // Advance state (e.g. index, index+1, index-1, index+2, index-2...)
    iOffsetFactor *= -1;
    iOffset += (iOffsetFactor < 0)? 1 : 0;
    const itemIndex = index + (iOffset * iOffsetFactor);

    // Check in bounds   
    if (itemIndex < 0) {
      lowerBoundExceeded = true;
      continue;
    }
    else if (itemIndex >= delegate.getItemCount()) {
      upperBoundExceeded = true;
      continue;
    }

    if (lowerBoundExceeded && upperBoundExceeded) {
      break;
    }

    // Get layout data
    const layoutEntry = createLayoutEntry(itemIndex, delegate, directionConfig);

    // Add to computed layout in correct position
    if (iOffsetFactor < 0) { 
      computedLayout.unshift(layoutEntry); 
    }
    else { 
      computedLayout.push(layoutEntry); 
    }
    
    // Collect size of new item
    accumulatedSize += layoutEntry.size + gutterSize;
  }

  // Readjust accumulator to trim gutter from the last item
  accumulatedSize -= gutterSize;

  // Compute physical position for each layout item.
  // If the rendered items underrun the available space, anchor at top/left 
  let alignmentOffsetAdjustment = 0;
  // If the rendered items exceed available space, attempt to center (rounded to nearest view size)
  if (accumulatedSize > containerSize) {
    const centerAlignmentOffsetAdjustment = (containerSize - accumulatedSize) / 2;
    alignmentOffsetAdjustment = Math.floor(Math.max(containerSize - accumulatedSize, Math.min(0, centerAlignmentOffsetAdjustment)));
  }

  
  computedLayout.reduce((offsetAccumulator, layoutEntry) => {
    layoutEntry.offset = offsetAccumulator;
    return offsetAccumulator + layoutEntry.size + gutterSize;
  }, alignmentOffsetAdjustment); 
  
  // Convert to map format
  const mappedOutput = new Map();
  computedLayout.forEach(entry => mappedOutput.set(entry.index, entry));
  ensureFocusItemInBounds(index, mappedOutput, containerSize)
  return mappedOutput;
}

function getMaximumLayoutSize(delegate, directionConfig, containerSize) {
  const [maxItemW, maxItemH] = delegate.getMaximumItemDimensions();
  const maxItemSize = (directionConfig.direction === 'horizontal')? maxItemW : maxItemH;
  const layoutBuffer = maxItemSize * MIN_PRERERENDERED_ITEMS;
  return containerSize + layoutBuffer;
}

// If the adjustment forces the focussed entry off-screen then tune it a little
// Modifies the given layoutMap in-place
function ensureFocusItemInBounds(index, layoutMap, containerSize) {
  let focusEntry = layoutMap.get(index);
  let boundsAdjustment = 0;
  if (focusEntry) {
    const adjustedOffset = focusEntry.offset;
    const adjustedExtent = focusEntry.offset + focusEntry.size;
    if (adjustedOffset < 0) {
      boundsAdjustment -= adjustedOffset;
    }
    else if (adjustedExtent > containerSize) {
      boundsAdjustment -= adjustedExtent - containerSize;
    }
    layoutMap.forEach(layoutEntry => layoutEntry.offset += boundsAdjustment);  
  }
}

function getItemSize(index, delegate, directionConfig) {
  const [itemW, itemH] = delegate.getItemDimensions(index);
  return (directionConfig.direction === 'horizontal')? itemW : itemH;
}

function createLayoutEntry(index, delegate, directionConfig) {
  const itemSize = getItemSize(index, delegate, directionConfig);
  return {size: itemSize, index: index};
}

function setComponentFocus(parent, previousIndex, nextIndex) {
  const blurComponent = parent.getChild(previousIndex);
  const focusComponent = parent.getChild(nextIndex);
  if (blurComponent) {
    blurComponent.blur();
  }
  if (focusComponent) {
    focusComponent.focus();
  }
}

function getItemChanges(layoutMap, existingComponentMap) {
  const added = new Set();
  const removed = new Set();
  const updated = new Set();
 
  layoutMap.forEach(entry => {
    const hasChild = existingComponentMap.has(entry.index)
    const target = hasChild ? updated : added;
    target.add(entry.index);
  });
  existingComponentMap.forEach((component, index) => {
    if (!layoutMap.has(index)) removed.add(index);
  });

  return {added, removed, updated};
}

function animateElementOffset(element, layoutEntry, directionConfig) {
  const endCallback = function() {
    element.removeEventListener('transitionend', endCallback);
    element.style.transition = null;
  };
  if (!element.style.transition) {
    element.style.transition = `transform ${FOCUS_ANIMATION_DURATION}ms ease-in-out`;
  }
  element.addEventListener('transitionend', endCallback);
  setElementOffset(element, layoutEntry, directionConfig); 
}

function setElementOffset(element, layoutEntry, directionConfig) {
  const transformValue = `${directionConfig.cssTransformFunction}(${layoutEntry.offset}px)`;
  element.style.transform = transformValue;
}