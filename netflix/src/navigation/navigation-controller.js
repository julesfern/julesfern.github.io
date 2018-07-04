/*
 * Manages a stack of navigation schemes, each of which 
 * steals control from the last and returns to it when completed.
 */

const KEYCODE_ALIASES = new Map([
  [37,  'left'],
  [38,  'up'],
  [39,  'right'],
  [40,  'down'],
  [13,  'enter'],
  [8,   'backspace']
]);

export default class NavigationController {

  constructor() {
    this._schemeStack = [];
    initDOMListener(this._schemeStack);
  }

  // ---------------------------------------------------
  // PUBLIC SECTION
  
  /*
   * Passes navigation control to the given navigation
   * scheme, returning a control handle which allows the caller
   * to exit and return control to the previous scheme.
   * 
   * Only the topmost scheme is allowed to exit immediately.
   * If a scheme in the middle of the stack is released,
   * it will not be scheduled for deactivation when it is
   * next at the top of the stack.
   */ 
  pushScheme(nextScheme) {
    const stack = this._schemeStack;
    const nextStackInfo = {released: false, scheme: nextScheme}; // [releaseTombstone, nextScheme]
    stack.push(nextStackInfo); 
    return getReleaseHandle(this, stack, stack.length - 1);
  }

  getStack() {
    return this._schemeStack;
  }
  
}

// ---------------------------------------------------
// PRIVATE SECTION

function initDOMListener(schemeStack) {
  document.addEventListener('keydown', handleKeyDown.bind(null, schemeStack));
}

function handleKeyDown(schemeStack, event) {
  const keyCode = event.which;
  const mappedHandler = getTopmostApplicableMappingFor(keyCode, schemeStack);
  if (mappedHandler) {
    mappedHandler.call();
  }
}

function getTopmostApplicableMappingFor(keyCode, schemeStack) {
  for (let i = schemeStack.length - 1; i >= 0; i--) {
    const {released, scheme} = schemeStack[i];
    const mappings = scheme.getMappings();

    if (released) {
      continue;
    }
    let handler = mappings.get(keyCode) || mappings.get(KEYCODE_ALIASES.get(keyCode));
    if (handler) {
      return handler;
    }
    if (scheme.isExclusive()) {
      break;
    }
  }
}

function getReleaseHandle(messageBus, stack, stackIndex) {
  let called = false;
  return function() {
    if (called) {
      throw new Error('Release handle called more than once');
    }
    // Mark released
    stack[stackIndex].released = true;
    // Free released schemes at top of stack
    freeReleasedSchemes(messageBus, stack);
    called = true;
  };
}

function freeReleasedSchemes(messageBus, stack) {
  let deleteCount = 0;
  for (let i = stack.length - 1; i >= 0; i--) {
    let {released, scheme} = stack[i];
    if (released) {
      deleteCount++;
      continue;
    }
    break;
  }   
  // slice
  stack.splice(stack.length - deleteCount, deleteCount);
}

