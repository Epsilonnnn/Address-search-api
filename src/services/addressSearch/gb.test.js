import fetch from 'node-fetch';
import { GBAddressSearchService } from './gb.js';
import { ExternalApiError } from '../../lib/error/index.js';
import { API_PROVIDERS } from '../../constants.js';
import { logger } from '../logger/index.js';

jest.mock('node-fetch', () => jest.fn());
jest.mock('../logger/index.js', () => {
  return {
    logger: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    }
  };
});

const fetchSuggestions = jest.fn();
const resolveAddress = jest.fn();

const getGBSearcher = () => {
  const service = new GBAddressSearchService();
  service.config.url = 'https://test.com';
  service.config.apiKey = 'test_api_key';
  return service;
};

const addressStub = {
  postcode: 'GU9 7PD',
  postcode_inward: '7PD',
  postcode_outward: 'GU9',
  post_town: 'Farnham',
  dependant_locality: '',
  double_dependant_locality: '',
  thoroughfare: 'Downing Street',
  dependant_thoroughfare: '',
  building_number: '',
  building_name: '24-25',
  sub_building_name: '',
  po_box: '',
  department_name: '',
  organisation_name: 'Downing Street Greek',
  udprn: 10148014,
  postcode_type: 'S',
  su_organisation_indicator: 'Y',
  delivery_point_suffix: '1N',
  line_1: 'Downing Street Greek',
  line_2: '24-25 Downing Street',
  line_3: '',
  premise: '24-25',
  longitude: -0.7996842,
  latitude: 51.2140528,
  eastings: 483934,
  northings: 146779,
  country: 'England',
  traditional_county: 'Surrey',
  administrative_county: 'Surrey',
  postal_county: 'Surrey',
  county: 'Surrey',
  district: 'Waverley',
  ward: 'Farnham Castle',
  uprn: '100062354410',
  id: 'paf_10148014',
  country_iso: 'GBR',
  country_iso_2: 'GB',
  county_code: '',
  language: 'en',
  umprn: '',
  dataset: 'paf',
  name: 'Downing Street Greek, 24-25 Downing Street, Farnham, GU9'
};

describe('search', () => {
  beforeEach(() => {
    fetchSuggestions.mockResolvedValue({
      json: () => Promise.resolve({
        result: {
          hits: [
            {
              id: 'paf_28410534',
              suggestion: 'Downing Street Group Practice, 4 Downing Street, Farnham, GU9',
              udprn: 28410534,
            },
            {
              id: 'paf_10148014',
              suggestion: 'Downing Street Greek, 24-25 Downing Street, Farnham, GU9',
              udprn: 10148014,
            },
          ]
        },
        code: 2000,
      }),
      ok: true,
    });

    resolveAddress.mockResolvedValue({
      json: () => Promise.resolve({
        result: addressStub,
        code: 2000,
      }),
      ok: true,
    });

    fetch.mockImplementation((url) => {
      const urlData = new URL(url);
      if (urlData.pathname === '/autocomplete/addresses') {
        return fetchSuggestions(url);
      }

      return resolveAddress(url);
    });
  });

  afterEach(() => {
    resolveAddress.mockReset();
    fetchSuggestions.mockReset();
  });

  it('should return result for a search query', async () => {
    const service = getGBSearcher();
    const result = await service.search('test');
    expect(result).toEqual([
      {
        'id': 'paf_10148014',
        'name': 'Downing Street Group Practice, 4 Downing Street, Farnham, GU9',
        'line1': 'Downing Street Greek',
        'line2': '24-25 Downing Street',
        'line3': '',
        'city': 'Farnham',
        'zip': 'GU9 7PD',
        'state': 'Surrey',
        'country': 'GB'
      },
      {
        'id': 'paf_10148014',
        'name': 'Downing Street Greek, 24-25 Downing Street, Farnham, GU9',
        'line1': 'Downing Street Greek',
        'line2': '24-25 Downing Street',
        'line3': '',
        'city': 'Farnham',
        'zip': 'GU9 7PD',
        'state': 'Surrey',
        'country': 'GB'
      }
    ]);
  });

  it('should return data only for resolved addresses', async () => {
    resolveAddress.mockReset();
    resolveAddress.mockImplementation((url) => {
      const urlData = new URL(url);

      if (urlData.pathname === '/autocomplete/addresses/paf_28410534/gbr') {
        return Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'test server error'
        });
      }

      return Promise.resolve({
        json: () => Promise.resolve({
          result: addressStub,
          code: 2000,
        }),
        ok: true,
      });
    });

    const service = getGBSearcher();
    const result = await service.search('test');

    expect(logger.error).toBeCalledWith({
      service: GBAddressSearchService.name,
      message: 'test server error',
      address: 'Downing Street Group Practice, 4 Downing Street, Farnham, GU9',
      addressId: 'paf_28410534',
      provider: API_PROVIDERS.IDEAL_POSTCODES,
      code: 500,
    });

    expect(result).toEqual([
      {
        'id': 'paf_10148014',
        'name': 'Downing Street Greek, 24-25 Downing Street, Farnham, GU9',
        'line1': 'Downing Street Greek',
        'line2': '24-25 Downing Street',
        'line3': '',
        'city': 'Farnham',
        'zip': 'GU9 7PD',
        'state': 'Surrey',
        'country': 'GB'
      }
    ]);
  });

  it('should throw an error if api method for suggestions returned an error', async () => {
    fetchSuggestions.mockReset();
    fetchSuggestions.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'test server error'
    });

    const service = getGBSearcher();

    try {
      await service.search('test');
    } catch(err) {
      expect(err).toBeInstanceOf(ExternalApiError);
      expect({
        message: err.message,
        provider: err.provider,
        code: err.code,
        isHTTPError: err.isHTTPError,
      }).toEqual({
        message: 'test server error',
        provider: API_PROVIDERS.IDEAL_POSTCODES,
        code: 500,
        isHTTPError: true
      });

      expect(logger.error).toBeCalledWith(expect.objectContaining({
        service: GBAddressSearchService.name,
        message: 'test server error',
        provider: API_PROVIDERS.IDEAL_POSTCODES,
        code: 500,
      }));
    }
  });
});