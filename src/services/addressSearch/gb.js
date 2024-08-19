import { stringify } from 'querystring';
import fetch from 'node-fetch';

import { AddressSearchService } from './base.js';
import { API_PROVIDERS } from '../../constants.js';
import { logger } from '../logger/index.js';
import { ExternalApiError } from '../../lib/error/index.js';

const apiUrl = process.env.IDEAL_POSTCODES_URL;
const apiKey = process.env.IDEAL_POSTCODES_API_KEY;

export class GBAddressSearchService extends AddressSearchService {
  constructor() {
    super();
    this.config = {
      url: apiUrl,
      apiKey,
    };
  }

  async _fetch(method, options) {
    const queryParams = stringify({
      api_key: this.config.apiKey,
      ...(options.query || {}),
    });

    const resp = await fetch(`${this.config.url}${method}?${queryParams}`, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!resp.ok) {
      throw new ExternalApiError(resp.statusText, {
        provider: API_PROVIDERS.IDEAL_POSTCODES,
        code: resp.status,
        isHTTPError: true,
      });
    }

    const data = await resp.json();

    if (data.code !== 2000) {
      throw new ExternalApiError(data.message, {
        provider: API_PROVIDERS.IDEAL_POSTCODES,
        code: data.code,
        isHTTPError: false,
      });
    }

    return data.result;
  }

  async _suggestAddresses(searchQuery) {
    const data = await this._fetch('/autocomplete/addresses', { query: { query: searchQuery } });
    return data.hits;
  }

  async _resolveAddress(addressId, address) {
    try {
      const data = await this._fetch(`/autocomplete/addresses/${addressId}/gbr`, {});
      return { ...data, name: address };
    } catch (err) {
      const logData = {
        service: this.constructor.name,
        message: err.message,
        address,
        addressId,
      };

      if (err instanceof ExternalApiError) {
        logData.provider = err.provider;
        logData.code = err.code;
      }

      logger.error(logData);
    }

    return null;
  }

  async _request(searchQuery) {
    const suggestions = await this._suggestAddresses(searchQuery);
    const items = await Promise.all(suggestions.map(({ id, suggestion }) => this._resolveAddress(id, suggestion)));
    return items.filter(item => Boolean(item));
  }

  _parse(items) {
    return items.map(data => {
      return {
        id: data.id,
        name: data.name,
        line1: data.line_1,
        line2: data.line_2,
        line3: data.line_3,
        city: data.post_town,
        zip: data.postcode,
        state: data.county,
        country: data.country_iso_2
      };
    });
  }
}