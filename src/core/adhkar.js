'use strict';
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', '..', 'data', 'adhkar.json');
const CATEGORIES = ['morning', 'evening', 'after-prayer'];

function loadAdhkar(file = FILE) {
  return JSON.parse(fs.readFileSync(file, 'utf8')).categories;
}

function validateAdhkar(categories) {
  const errors = [];
  const ids = new Set();
  for (const cat of CATEGORIES) {
    const list = categories[cat];
    if (!Array.isArray(list) || list.length === 0) errors.push(`category "${cat}" is empty or missing`);
    for (const item of list || []) {
      if (!item.id || ids.has(item.id)) errors.push(`duplicate/missing id: ${item.id}`);
      ids.add(item.id);
      if (!item.ar || !item.en || !item.source) errors.push(`${item.id}: needs ar, en and source`);
      if (!Number.isInteger(item.repeat) || item.repeat < 1) errors.push(`${item.id}: repeat must be a positive integer`);
    }
  }
  return errors;
}

module.exports = { loadAdhkar, validateAdhkar, CATEGORIES };
