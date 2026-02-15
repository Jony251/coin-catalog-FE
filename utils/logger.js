import { runtimeConfig } from '../config/runtime';

const isDevRuntime = typeof __DEV__ !== 'undefined' ? __DEV__ : !runtimeConfig.isProduction;
const shouldLogVerbose = isDevRuntime || runtimeConfig.enableVerboseLogging;

function toLogArgs(scope, args) {
  return [`[${scope}]`, ...args];
}

export const logger = {
  debug(scope, ...args) {
    if (!shouldLogVerbose) return;
    console.log(...toLogArgs(scope, args));
  },

  info(scope, ...args) {
    if (!shouldLogVerbose) return;
    console.info(...toLogArgs(scope, args));
  },

  warn(scope, ...args) {
    console.warn(...toLogArgs(scope, args));
  },

  error(scope, ...args) {
    console.error(...toLogArgs(scope, args));
  },
};

