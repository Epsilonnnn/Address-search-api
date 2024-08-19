export class InternalError extends Error {}

export class ExternalApiError extends Error {
  constructor(message, info) {
    super(message);

    this.provider = info.provider;
    this.code = info.code;
    this.isHTTPError = Boolean(info.isHTTPError);
  }
}