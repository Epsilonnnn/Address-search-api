import { USAddressSearchService } from './us.js';
import { ExternalApiError } from '../../lib/error/index.js';
import { API_PROVIDERS } from '../../constants.js';
import { logger } from '../logger/index.js';

const mockClientSend = jest.fn();

jest.mock('../logger/index.js', () => {
  return {
    logger: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    }
  };
});

jest.mock('smartystreets-javascript-sdk', () => {
  return {
    core: {
      StaticCredentials: class StaticCredentials {},
      ClientBuilder: class ClientBuilder {
        withLicenses() {
          return {
            buildUsAutocompleteProClient: () => {
              return {
                send: mockClientSend,
              };
            }
          };
        }
      }
    },
    usAutocompletePro: {
      Lookup: class Lookup {}
    }
  };
});

describe('search', () => {
  it('should return result for a search query', async () => {
    mockClientSend.mockResolvedValue({
      result: [
        {
          streetLine: '4770 Lincoln Ave',
          secondary: '',
          city: 'Oakland',
          state: 'CA',
          zipcode: '94602',
          entries: 0
        },
        {
          streetLine: '4770 Lincoln Blvd',
          secondary: '',
          city: 'Marina del Rey',
          state: 'CA',
          zipcode: '90292',
          entries: 0
        }
      ],
      search: '4770 Lincoln',
      selected: undefined,
      maxResults: undefined,
      includeOnlyCities: [],
      includeOnlyStates: [],
      includeOnlyZIPCodes: [],
      excludeStates: [],
      preferCities: [],
      preferStates: [],
      preferZIPCodes: [],
      preferRatio: undefined,
      preferGeolocation: undefined,
      source: undefined
    });

    const service = new USAddressSearchService();
    const result = await service.search('test');
    expect(result).toEqual([
      {
        id: '',
        name: '4770 Lincoln Ave Oakland, CA 94602',
        line1: '4770 Lincoln Ave',
        line2: '',
        line3: '',
        city: 'Oakland',
        zip: '94602',
        state: 'CA',
        country: 'US'
      },
      {
        id: '',
        name: '4770 Lincoln Blvd Marina del Rey, CA 90292',
        line1: '4770 Lincoln Blvd',
        line2: '',
        line3: '',
        city: 'Marina del Rey',
        zip: '90292',
        state: 'CA',
        country: 'US'
      },
    ]);
  });

  it('should throw an error and log it if api method for suggestions returned an error', async () => {
    mockClientSend.mockRejectedValue({
      error: 'test error',
      statusCode: 500,
    });

    const service = new USAddressSearchService();

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
        message: 'test error',
        provider: API_PROVIDERS.SMARTY,
        code: 500,
        isHTTPError: true
      });

      expect(logger.error).toBeCalledWith(expect.objectContaining({
        service: USAddressSearchService.name,
        message: 'test error',
        provider: API_PROVIDERS.SMARTY,
        code: 500,
      }));
    }
  });
});