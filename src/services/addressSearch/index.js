import { GBAddressSearchService } from './gb.js';
import { USAddressSearchService } from './us.js';

const addressSearchServiceByCountry = {
  GB: GBAddressSearchService,
  US: USAddressSearchService,
};

export default (country) => {
  const Service = addressSearchServiceByCountry[country.toUpperCase()];

  if (!Service) {
    return null;
  }

  return new Service();
};