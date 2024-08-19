import http from 'http';
import debugFactory from 'debug';
import app from '../src/app.js';
import { logger } from './services/logger/index.js';

const debug = debugFactory('countries-api:server');

const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

const server = http.createServer(app);

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }

  if (port >= 0) {
    return port;
  }

  return false;
}

function onError(error) {
  if (error.syscall !== 'listen') {
    logger.error({
      message: error.message,
      segment: 'global'
    });
    throw error;
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  switch (error.code) {
    case 'EACCES':
      logger.error({
        message: bind + ' requires elevated privileges',
        segment: 'global'
      });
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error({
        message: bind + ' is already in use',
        segment: 'global'
      });
      process.exit(1);
      break;
    default:
      logger.error({
        message: error.message,
        segment: 'global'
      });
      throw error;
  }
}

function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
