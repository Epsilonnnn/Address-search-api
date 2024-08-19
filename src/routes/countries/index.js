import express from 'express';
import getAddressSearchService from '../../services/addressSearch/index.js';
import { formatResponse } from './utils/format.js';
import { ExternalApiError } from '../../lib/error/index.js';
import { logger } from '../../services/logger/index.js';

const router = express.Router();

/* GET address search by country */
router.get('/:country', async function(req, res) {
  const country = req.params.country;
  const searchQuery = req.query.q || '';

  const addressSearchService = getAddressSearchService(country);

  if (!addressSearchService) {
    logger.info({
      message: `country ${country} is not found`,
      route: 'countries',
    });
    res.status(400).send('Bad request');
    return;
  }

  if (!searchQuery) {
    res.json(formatResponse([]));
    return;
  }

  try {
    const data = await addressSearchService.search(searchQuery);
    res.json(formatResponse(data));
  } catch(err) {
    if (err instanceof ExternalApiError) {
      if (err.code === 400) {
        res.status(400).send('Bad request');
        return;
      }

      res.json(formatResponse([]));
      return;
    }

    logger.error({
      message: err.message,
      route: 'countries',
      stack: err.stack,
    });

    res.status(500).end();
  }
});

export default router;
