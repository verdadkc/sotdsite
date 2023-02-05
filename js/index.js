'use strict';

import { uFuzzy } from '../node_modules/@leeoniya/ufuzzy/dist/uFuzzy.iife.js';
import { blades, brushes, lathers, postshaves, razors } from './data.js';

const searchBox = document.getElementById('searchbox');
const searchResults = document.getElementById('searchresults');
const sotd = document.getElementById('sotd');
const copyButton = document.getElementById('copy_sotd');
const useButton = document.getElementById('use_it');
const states = {
  A: {
    next: 'B',
    data: lathers,
    markdown: '* **Lather:** ',
    prompt: 'Search for Lather',
    label: 'Lather',
    button: document.getElementById('button_A'),
    buffer: document.getElementById('buffer_A'),
    handler: stateChangeHandler('A'),
  },
  B: {
    next: 'C',
    data: brushes,
    markdown: '* **Brush:** ',
    prompt: 'Search for Brush',
    label: 'Brush',
    button: document.getElementById('button_B'),
    buffer: document.getElementById('buffer_B'),
    handler: stateChangeHandler('B'),
  },
  C: {
    next: 'D',
    data: razors,
    markdown: '* **Razor:** ',
    prompt: 'Search for Razor',
    label: 'Razor',
    button: document.getElementById('button_C'),
    buffer: document.getElementById('buffer_C'),
    handler: stateChangeHandler('C'),
  },
  D: {
    next: 'E',
    data: blades,
    markdown: '* **Blade:** ',
    prompt: 'Search for Blade',
    label: 'Razor',
    button: document.getElementById('button_D'),
    buffer: document.getElementById('buffer_D'),
    handler: stateChangeHandler('D'),
  },
  E: {
    next: 'F',
    data: postshaves,
    markdown: '* **Post Shave:** ',
    prompt: 'Search for Post Shave',
    label: 'Post Shave',
    button: document.getElementById('button_E'),
    buffer: document.getElementById('buffer_E'),
    handler: stateChangeHandler('E'),
  },
  F: {
    next: 'A',
    data: postshaves,
    markdown: '* **Post Shave:** ',
    prompt: 'Search for Moar Post Shave',
    label: 'Moar Post Shave',
    button: document.getElementById('button_F'),
    buffer: document.getElementById('buffer_F'),
    handler: stateChangeHandler('F'),
  },
};

function stateChangeHandler(key) {
  return () => {
    currentState = states[key];
    currentState.button.checked = true;
    haystack = currentState.data;
    searchBox.placeholder = currentState.prompt;
    searchBox.value = '';
    searchResults.innerHTML = '';
    searchBox.focus();
  };
}

function checkKey(event) {
  const callback = {
    'ArrowUp': () => focusChange(-1),
    'ArrowDown': () => focusChange(1),
    'Enter': () => storeResult(document.activeElement.textContent),
  }[event.key];
  callback?.();
}

function storeSearchString() {
  const value = searchBox.value.trim();
  if (value != ''){
    storeResult(value)
  }
  else {
    states[currentState.next].handler();
  }
}

function storeSearchResult() {
  const active = document.activeElement;
  if (active.parentElement == searchResults){
    storeResult(active.textContent.trim())
  }
}

function storeResult(txt) {
  currentState.buffer.value = txt
  renderSotd();
  states[currentState.next].handler();
}

function renderSotd() {
  sotd.value = '';
  const keys = Object.keys(states);
  keys.forEach((key) => {
    var item = states[key].buffer.value.trim();
    if (item != '' ) {
      sotd.value += states[key].markdown + item + '  \n';
    }
  });
}

function enterKeyHandler(event) {
  if (event.key == 'Enter') {
    const count = searchResults.childElementCount;
    if (count == 0) {
      storeSearchString();
    }
    if (count == 1) {
      storeResult(searchResults.firstChild.textContent);
    }
  }
}

function renderSearchResults(event) {
  function li(text) {
    const item = document.createElement('li');
    item.innerText = text;
    item.setAttribute('class', 'searchresult');
    item.setAttribute('tabindex', 0);
    return item;
  }

  function search(needle) { // Docs available at github.com/leeoniya/uFuzzy
    let outOfOrder = true;
    let [idxs, _, __] = ufuzzy.search(haystack, needle, outOfOrder, 1000);
    let result;
    for (var k = 0; k < idxs.length; k++) {
      result = haystack[idxs[k]];
      searchResults.appendChild(li(result));
    }
  }
  searchResults.innerHTML = '';
  const { value: target, _ } = event.target;
  if (target != ''){
     search(target);
  }
}

function focusChange(delta) {
  function mod(n, m) { //Force the result to be in 0..n-1 even when n<0
    return ((n % m) + m) % m;
  }
  const items = Array.from(
    searchResults.getElementsByClassName('searchresult'),
  );
  const idx = items.indexOf(document.activeElement);
  console.assert(
    idx > -1,
    'Element with focus was not found in list of items.',
  );
  items[mod(idx + delta, items.length)].focus();
}

function copySotd(){
  window.navigator.clipboard.writeText(sotd.value);
}

searchBox.addEventListener('input', renderSearchResults);
searchBox.addEventListener('keydown', enterKeyHandler);

searchResults.addEventListener('keydown', checkKey);
searchResults.addEventListener('click', storeSearchResult);

copyButton.addEventListener('click', copySotd);
useButton.addEventListener('click', storeSearchString);

// Assign each state's radio button handler
const keys = Object.keys(states);
keys.forEach((key) => {
  states[key].button.addEventListener('click', states[key].handler);
});

// A page reload needs to clear prior user selections (if any)
keys.forEach((key) => {
  states[key].buffer.value = '';
});
sotd.value = '';

const opts = { // Search library documentation lives at github.com/leeoniya/uFuzzy
  interIns: Infinity,
  interLft: 0,
  interRgt: 0,
  intraDel: 1,
  intraIns: 0,
  intraMode: 0,
  intraSub: 1,
  intraTrn: 1,
};
const ufuzzy = new uFuzzy(opts);

let currentState = states.A;
let haystack = currentState.data; // metaphor: we search for needle in haystack
currentState.handler();
