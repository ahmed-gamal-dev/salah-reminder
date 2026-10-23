'use strict';
const fs = require('fs');
const path = require('path');
const { sanitize } = require('../core/settings');

class Store {
  constructor(dir) {
    this.file = path.join(dir, 'settings.json');
    this.exists = fs.existsSync(this.file);
    this.value = this.read();
  }
  read() {
    try {
      return sanitize(JSON.parse(fs.readFileSync(this.file, 'utf8')));
    } catch {
      return sanitize({});
    }
  }
  get() {
    return this.value;
  }
  set(next) {
    this.value = sanitize(next);
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.writeFileSync(this.file, JSON.stringify(this.value, null, 2));
    this.exists = true;
    return this.value;
  }
}

module.exports = { Store };
