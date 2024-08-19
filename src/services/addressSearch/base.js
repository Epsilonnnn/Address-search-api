import { logger } from '../logger/index.js';
import { ExternalApiError, InternalError } from '../../lib/error/index.js';

export class AddressSearchService {
  constructor() {
    this.config = {};
  }

  async _request() {
    throw new InternalError('Method _request is not implemented');
  }

  async _parse(resp) {
    return resp;
  }

  async search(query) {
    try {
      const resp = await this._request(query);
      return this._parse(resp);
    } catch(err) {
      if (err instanceof ExternalApiError) {
        logger.error({
          provider: err.provider,
          message: err.message,
          service: this.constructor.name,
          code: err.code,
          stack: err.stack
        });

        throw err;
      }

      logger.error({
        message: err.message,
        service: this.constructor.name,
        stack: err.stack
      });

      throw (err instanceof InternalError ? err : new InternalError(err.message));
    }
  }
}