"use strict";

import { uFuzzy } from "../node_modules/@leeoniya/ufuzzy/dist/uFuzzy.iife.js";
import { blades, brushes, lathers, postshaves, razors, frags, preps } from "./data.js";

const searchBox = document.getElementById("searchbox");
const searchResults = document.getElementById("searchresults");
const sotd = document.getElementById("sotd");
const copyButton = document.getElementById("copy_sotd");
const useButton = document.getElementById("use_it");
const defaultPrompt = 'First choose a product, then search here.';
let haystack;
let currentState;

function mod(n, m) { //Force the result to be in 0..n-1 even when n<0
  return ((n % m) + m) % m;
}

function date(){
  const today = new Date();
  renderSotd(today.toDateString());
}

const states = {
    "lather": {
      data: lathers,
      markdown: "* **Lather:** ",
      prompt: "Search for Lather",
    },
    "brush": {
      data: brushes,
      markdown: "* **Brush:** ",
      prompt: "Search for Brush",
    },
    "razor": {
      data: razors,
      markdown: "* **Razor:** ",
      prompt: "Search for Razor",
    },
    "blade": {
      data: blades,
      markdown: "* **Blade:** ",
      prompt: "Search for Blade",
    },
    "postshave": {
      data: postshaves,
      markdown: "* **Post Shave:** ",
      prompt: "Search for Post Shave",
    },
    "fragrance": {
      data: frags,
      markdown: "* **Fragrance:** ",
      prompt: "Search for Fragrance",
    },
    "prep": {
      data: preps,
      markdown: "* **Prep:** ",
      prompt: "Search for Prep",
    },
};

function handler(key) {
  const state = states[key];
  return () => {
    currentState = state;
    haystack = state.data;
    searchBox.placeholder = state.prompt;
    searchBox.value = "";
    searchResults.innerHTML = "";
    searchBox.focus();
  };
}

function checkKey(event) {
  const callback = {
    "ArrowUp": () => focusChange(-1),
    "ArrowDown": () => focusChange(1),
    "Enter": () => useResult(document.activeElement.textContent),
  }[event.key];
  callback?.();
}

function useSearchString() {
  const value = searchBox.value.trim();
  if (value != "") {
    useResult(value);
  }
}

function useSearchResult() {
  const active = document.activeElement;
  if (active.parentElement == searchResults) {
    useResult(active.textContent.trim());
  }
}

function useResult(txt) {
  const text = `${currentState.markdown} ${txt.trim()}`;
  renderSotd(text);
}

function sotdDrop(){
  if (sotd.lastChild){
    sotd.removeChild(sotd.lastChild);
    haystack = null;
  }
}

function sotdAppend(text){
  const item = document.createElement("li");
  item.innerText = text;
  sotd.appendChild(item);
}


function clearSearchBox(){
  searchBox.value = '';
  searchBox.placeholder = 'Choose a product.';
  searchBox.focus();
  haystack = null;
  searchResults.innerHTML = '';
}

function renderSotd(text) {
  sotd.style.display = 'block';
  sotdAppend(`${text.trim()} \n`);
  clearSearchBox();
}

function enterKeyHandler(event) {
  if (event.key == "Enter") {
    const count = searchResults.childElementCount;
    if (count == 0) {
      useSearchString();
    }
    if (count > 0) {
      useResult(searchResults.firstChild.textContent);
    }
  }
  if (event.key == "ArrowDown" && searchResults.children[1]) {
    searchResults.children[1].focus()
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
      if (result.trim() != ''){
        searchResults.appendChild(li(result));
      }
    }
    if (searchResults.firstChild) {
      searchResults.firstChild.setAttribute('targeted', '');
    }
  }
  if (!haystack) {
    clearSearchBox();
    searchBox.placeholder = 'First choose a product, then search here.';
    return;
  }
  searchResults.innerHTML = "";
  const { value: target, _ } = event.target;
  if (target != "") {
    search(target);
  }
}

function focusChange(delta) {
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
  window.navigator.clipboard.writeText(sotd.innerHTML);
}

function onBlur(){
  const first = searchResults.firstChild;
  if (first) first.removeAttribute('targeted');
}

function onFocus(){
  const first = searchResults.firstChild;
  if (first) first.setAttribute('targeted', '');
}

searchBox.addEventListener("input", renderSearchResults);
searchBox.addEventListener("keydown", enterKeyHandler);
searchBox.addEventListener("blur", onBlur);
searchBox.addEventListener("focus", onFocus);

searchResults.addEventListener("keydown", checkKey);
searchResults.addEventListener("click", useSearchResult);

copyButton.addEventListener("click", copySotd);
useButton.addEventListener("click", useSearchString);

const latherButton = document.getElementById('lather');
latherButton.addEventListener('click', handler('lather'));

const brushButton = document.getElementById('brush');
brushButton.addEventListener('click', handler('brush'));

const razorButton = document.getElementById('razor');
razorButton.addEventListener('click', handler('razor'));

const bladeButton = document.getElementById('blade');
bladeButton.addEventListener('click', handler('blade'));

const fragButton = document.getElementById('frag');
fragButton.addEventListener('click', handler('fragrance'));

const postShaveButton = document.getElementById('postshave');
postShaveButton.addEventListener('click', handler('postshave'));

const prepButton = document.getElementById('prep');
prepButton.addEventListener('click', handler('prep'));

const undoButton = document.getElementById('undo');
undoButton.addEventListener('click', sotdDrop)

const dateButton = document.getElementById('date');
dateButton.addEventListener('click', date)

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
sotd.style.display = 'none';
sotd.innerHTML= '';
clearSearchBox();