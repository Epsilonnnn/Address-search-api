import { createHash } from 'crypto';
import fs from 'node:fs/promises';
import path from 'path';
import { logger } from '../services/logger/index.js';

const HASHES_STORE_FILE_PATH = path.join(process.cwd(), 'keysHash.json');

export const authByToken = async (req, res, next) => {
  const apiKey = req.query.api_key || req.get('apiKey');

  if (!apiKey) {
    logger.info({
      middleware: 'authByToken',
      message: 'request with invalid apiKey',
      ip: req.ip,
      apiKey: '',
    });
    res.status(401).send('Unauthorized');
    return;
  }

  const hash = createHash('sha256');
  hash.update(apiKey);
  const hashStr = hash.digest('hex');

  let hashesStore;

  try {
    hashesStore = JSON.parse(await fs.readFile(HASHES_STORE_FILE_PATH, { encoding: 'utf8' }));
  } catch(err) {
    logger.error({
      message: err.message,
      middleware: 'authByToken',
    });
    res.status(500).end();
    return;
  }

  const keyConfig = hashesStore.find(({ hash }) => hash === hashStr);

  if (!keyConfig) {
    logger.info({
      middleware: 'authByToken',
      message: 'request with invalid apiKey',
      ip: req.ip,
      apiKey,
    });
    res.status(401).send('Unauthorized');
    return;
  }

  next();
};