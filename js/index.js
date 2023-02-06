"use strict";

import { uFuzzy } from "../node_modules/@leeoniya/ufuzzy/dist/uFuzzy.iife.js";
import { blades, brushes, lathers, postshaves, razors } from "./data.js";

const searchBox = document.getElementById("searchbox");
const searchResults = document.getElementById("searchresults");
const sotd = document.getElementById("sotd");
const copyButton = document.getElementById("copy_sotd");
const useButton = document.getElementById("use_it");


function buildStates(word) {
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
  };
  const stateTemplates = [
    {
      htmlLabel: document.getElementById("label_A"),
      button: document.getElementById("button_A"),
      buffer: document.getElementById("buffer_A"),
      handler: stateChangeHandler(0),
      next: 1,
    },
    {
      htmlLabel: document.getElementById("label_B"),
      button: document.getElementById("button_B"),
      buffer: document.getElementById("buffer_B"),
      handler: stateChangeHandler(1),
      next: 2,
    },
    {
      htmlLabel: document.getElementById("label_C"),
      button: document.getElementById("button_C"),
      buffer: document.getElementById("buffer_C"),
      handler: stateChangeHandler(2),
      next: 3,
    },
    {
      htmlLabel: document.getElementById("label_D"),
      button: document.getElementById("button_D"),
      buffer: document.getElementById("buffer_D"),
      handler: stateChangeHandler(3),
      next: 4,
    },
    {
      htmlLabel: document.getElementById("label_E"),
      button: document.getElementById("button_E"),
      buffer: document.getElementById("buffer_E"),
      handler: stateChangeHandler(4),
      next: 5,
    },
    {
      htmlLabel: document.getElementById("label_F"),
      button: document.getElementById("button_F"),
      buffer: document.getElementById("buffer_F"),
      handler: stateChangeHandler(5),
      next: 0,
    },
  ];
  const keys = word.split("");
  let result = [];
  for (let k = 0; k < keys.length; k++) {
    result[k] = { ...stateData[keys[k]], ...stateTemplates[k] };
  }
  return result;
}

//const order = "RbBLPM";
const order = "LBRbPM";
const states = buildStates(order);

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
  sotd.value = "";
  const keys = Object.keys(states);
  keys.forEach((key) => {
    var item = states[key].buffer.value.trim();
    if (item != "") {
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

let currentState = states[0];
let haystack = currentState.data; // metaphor: we search for needle in haystack
currentState.handler();
