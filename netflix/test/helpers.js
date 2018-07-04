const TESTBENCH_ELEMENT_ID = 'testbench';

export function simulateKeyboardEvent(name, keyCode) {
  const event = new Event(name);
  event.which = keyCode;
  document.dispatchEvent(event);
}

export function getTestbenchElement() {
  let element;
  if (element = document.getElementById(TESTBENCH_ELEMENT_ID)) {
    element.remove();
    element.innerText = '';
  }

  element = document.createElement('div');
  element.setAttribute('id', TESTBENCH_ELEMENT_ID)
  document.body.appendChild(element);
  return element;
}