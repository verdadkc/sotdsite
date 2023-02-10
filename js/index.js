"use strict";

import { uFuzzy } from "../node_modules/@leeoniya/ufuzzy/dist/uFuzzy.iife.js";
import { blades, brushes, lathers, postshaves, razors } from "./data.js";

const searchBox = document.getElementById("searchbox");
const searchResults = document.getElementById("searchresults");
const sotd = document.getElementById("sotd");
const copyButton = document.getElementById("copy_sotd");
const useButton = document.getElementById("use_it");
const dateBuffer = document.getElementById("date_buffer");


function getDateParm(){
  const parms = new URL(location.href).searchParams;
  const date = parms.get('date');
  const today = new Date();
  switch(date){
    case 'D':
      dateBuffer.value = today.toDateString();
      break;
    case 'd':
      dateBuffer.value = today.toLocaleDateString();
      break;
    default:
      dateBuffer.value = '';
  }
}

function getOrderParm(){
  function scrub(word){
    const validChars = ['B', 'L', 'R', 'b', 'P', 'M'];
    const order = word.split('').filter((c)=>validChars.includes(c));
    const maxLen = Math.min(6, order.length)
    return order.slice(0,maxLen) // max of 6 categories are currently supported
  }
  const defaultOrder = 'LBRbPM';
  const parms = new URL(location.href).searchParams;
  const order = parms.get('order');
  if (order == null || order == '') return defaultOrder;
  return scrub(order);
}

function template(suffix, index){
  return {
    htmlLabel: document.getElementById("label_" + suffix ),
    button: document.getElementById("button_" + suffix),
    buffer: document.getElementById("buffer_" + suffix),
    handler: stateChangeHandler(index)
  }
}

function buildStates() {
  const order = getOrderParm();
  const stateData = {
    "L": {
      data: lathers,
      markdown: "* **Lather:** ",
      prompt: "Search for Lather",
      label: "Lather",
    },
    "B": {
      data: brushes,
      markdown: "* **Brush:** ",
      prompt: "Search for Brush",
      label: "Brush",
    },
    "R": {
      data: razors,
      markdown: "* **Razor:** ",
      prompt: "Search for Razor",
      label: "Razor",
    },
    "b": {
      data: blades,
      markdown: "* **Blade:** ",
      prompt: "Search for Blade",
      label: "Blade",
    },
    "P": {
      data: postshaves,
      markdown: "* **Post Shave:** ",
      prompt: "Search for Post Shave",
      label: "Post Shave",
    },
    "M": {
      data: postshaves,
      markdown: "* **Post Shave:** ",
      prompt: "Search for Moar Post Shave",
      label: "Moar Post Shave",
    },
    "F": {
      data: frags,
      markdown: "* **Fragrance:** ",
      prompt: "Search for Fragrance",
      label: "Frag",
    },
    "p": {
      data: preps,
      markdown: "* **Prep:** ",
      prompt: "Search for Prep",
      label: "Prep",
    },

  };

  const stateTemplates = [
     template('00',0),
     template('01',1),
     template('02',2),
     template('03',3),
     template('04',4),
     template('05',5),
     template('06',6),
     template('07',7),
  ];


  let result = [];
  for (let b = 0; b < stateTemplates.length; b++){
     stateTemplates[b].htmlLabel.style.display = 'none'
  }
  for (let k = 0; k < order.length; k++) {
    stateTemplates[k].htmlLabel.style.display = '';
    stateTemplates[k].next = (k+1)%order.length;
    result[k] = { ...stateData[order[k]], ...stateTemplates[k] };
  }
  return result;
}

const states = buildStates() ;

function stateChangeHandler(idx) {
  return () => {
    currentState = states[idx];
    currentState.button.checked = true;
    haystack = currentState.data;
    searchBox.placeholder = currentState.prompt;
    searchBox.value = "";
    searchResults.innerHTML = "";
    searchBox.focus();
  };
}

function checkKey(event) {
  const callback = {
    "ArrowUp": () => focusChange(-1),
    "ArrowDown": () => focusChange(1),
    "Enter": () => storeResult(document.activeElement.textContent),
  }[event.key];
  callback?.();
}

function storeSearchString() {
  const value = searchBox.value.trim();
  if (value != "") {
    storeResult(value);
  } else {
    states[currentState.next].handler();
  }
}

function storeSearchResult() {
  const active = document.activeElement;
  if (active.parentElement == searchResults) {
    storeResult(active.textContent.trim());
  }
}

function storeResult(txt) {
  currentState.buffer.value = txt;
  renderSotd();
  states[currentState.next].handler();
}

function renderSotd() {
  sotd.value = '';
  sotd.value += dateBuffer.value + '\n\n';
  const keys = Object.keys(states);
  keys.forEach((key) => {
    var item = states[key].buffer.value.trim();
    if (item != '') {
      sotd.value += states[key].markdown + item + "  \n";
    }
  });
}

function enterKeyHandler(event) {
  if (event.key == "Enter") {
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
    const item = document.createElement("li");
    item.innerText = text;
    item.setAttribute("class", "searchresult");
    item.setAttribute("tabindex", 0);
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
  searchResults.innerHTML = "";
  const { value: target, _ } = event.target;
  if (target != "") {
    search(target);
  }
}

function focusChange(delta) {
  function mod(n, m) { //Force the result to be in 0..n-1 even when n<0
    return ((n % m) + m) % m;
  }
  const items = Array.from(
    searchResults.getElementsByClassName("searchresult"),
  );
  const idx = items.indexOf(document.activeElement);
  console.assert(
    idx > -1,
    "Element with focus was not found in list of items.",
  );
  items[mod(idx + delta, items.length)].focus();
}

function copySotd() {
  window.navigator.clipboard.writeText(sotd.value);
}

searchBox.addEventListener("input", renderSearchResults);
searchBox.addEventListener("keydown", enterKeyHandler);

searchResults.addEventListener("keydown", checkKey);
searchResults.addEventListener("click", storeSearchResult);

copyButton.addEventListener("click", copySotd);
useButton.addEventListener("click", storeSearchString);

const keys = Object.keys(states);
keys.forEach((key) => {
  states[key].button.addEventListener("click", states[key].handler);
  states[key].buffer.value = "";
  states[key].htmlLabel.innerText = states[key].label;
});
sotd.value = "";

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

getDateParm();
let currentState = states[0];
let haystack = currentState.data; // metaphor: we search for needle in haystack
currentState.handler();
