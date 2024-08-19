import SmartySDK from 'smartystreets-javascript-sdk';

import { AddressSearchService } from './base.js';
import { API_PROVIDERS } from '../../constants.js';
import { ExternalApiError } from '../../lib/error/index.js';

const SmartyCore = SmartySDK.core;
const Lookup = SmartySDK.usAutocompletePro.Lookup;

const authId = process.env.SMARTY_AUTH_ID;
const authToken = process.env.SMARTY_AUTH_TOKEN;

function buildAddress(suggestion) {
  let whiteSpace = '';
  let secondary = '';
  if (suggestion.secondary) {
    secondary = suggestion.entries > 1 ? `${suggestion.secondary} (${suggestion.entries} entries)` : suggestion.secondary;
    whiteSpace = ' ';
  }
  return `${suggestion.streetLine}${whiteSpace}${secondary} ${suggestion.city}, ${suggestion.state} ${suggestion.zipcode}`;
}

export class USAddressSearchService extends AddressSearchService {
  constructor() {
    super();
    this.config = {
      authId,
      authToken,
    };

    const credentials = new SmartyCore.StaticCredentials(this.config.authId, this.config.authToken);
    const clientBuilder = new SmartyCore.ClientBuilder(credentials).withLicenses(['us-autocomplete-pro-cloud']);

    this.client = clientBuilder.buildUsAutocompleteProClient();
  }

  async _request(searchQuery) {
    const lookup = new Lookup(searchQuery);
    let resp;
    try {
      resp = await this.client.send(lookup);
    } catch(err) {
      throw new ExternalApiError(err.error || 'smarty call error', {
        provider: API_PROVIDERS.SMARTY,
        code: err.statusCode || 500,
        isHTTPError: true,
      });
    }

    return resp.result;
  }

  _parse(suggestions) {
    return suggestions.map((data) => {
      return {
        id: '',
        name: buildAddress(data),
        line1: data.streetLine,
        line2: data.secondary,
        line3: '',
        city: data.city,
        zip: data.zipcode,
        state: data.state,
        country: 'US'
      };
    });
  }
}