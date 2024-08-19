class Logger {
  constructor(transport) {
    this.transport = transport;
  }

  info(logData) {
    this.transport.log({
      ...logData,
      level: 'info',
    });
  }

  error(logData) {
    this.transport.error({
      ...logData,
      level: 'error',
      stack: logData.stack || new Error().stack,
    });
  }

  warn(logData) {
    this.transport.warn({
      ...logData,
      level: 'warn',
    });
  }
}

export const logger = new Logger(console);