#!/usr/bin/env node

import { randomBytes, createHash } from 'crypto';
import fs from 'node:fs/promises';
import path from 'path';

const HASHES_STORE_FILE_PATH = path.join(process.cwd(), 'keysHash.json');

const key = randomBytes(16).toString('hex');

const hash = createHash('sha256');
hash.update(key);
const hashStr = hash.digest('hex');

const hashesStore = JSON.parse(await fs.readFile(HASHES_STORE_FILE_PATH, { encoding: 'utf8' }));
hashesStore.push({ hash: hashStr });
await fs.writeFile(HASHES_STORE_FILE_PATH, JSON.stringify(hashesStore, null, 4));

console.log('=========================');
console.log(`YOUR API KEY - ${key}`);
console.log('=========================');
