/**
 * Disable console logs completely
 * This script runs before any other JavaScript to ensure console is disabled from the start
 */
(function() {
  'use strict';
  
  // Store original console methods (in case we need to restore them)
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
    trace: console.trace,
    table: console.table,
    group: console.group,
    groupEnd: console.groupEnd,
    groupCollapsed: console.groupCollapsed,
    time: console.time,
    timeEnd: console.timeEnd,
    timeLog: console.timeLog,
    count: console.count,
    countReset: console.countReset,
    clear: console.clear,
    dir: console.dir,
    dirxml: console.dirxml,
    assert: console.assert
  };
  
  // Override all console methods
  function disableConsole() {
    console.log = function() {};
    console.info = function() {};
    console.warn = function() {};
    console.error = function() {};
    console.debug = function() {};
    console.trace = function() {};
    console.table = function() {};
    console.group = function() {};
    console.groupEnd = function() {};
    console.groupCollapsed = function() {};
    console.time = function() {};
    console.timeEnd = function() {};
    console.timeLog = function() {};
    console.count = function() {};
    console.countReset = function() {};
    console.clear = function() {};
    console.dir = function() {};
    console.dirxml = function() {};
    console.assert = function() {};
  }
  
  // Disable console immediately
  disableConsole();
  
  // Also disable console on window load
  if (typeof window !== 'undefined') {
    window.addEventListener('load', disableConsole);
    window.addEventListener('DOMContentLoaded', disableConsole);
  }
  
  // Override console in window object as well
  if (typeof window !== 'undefined') {
    window.console = {
      log: function() {},
      info: function() {},
      warn: function() {},
      error: function() {},
      debug: function() {},
      trace: function() {},
      table: function() {},
      group: function() {},
      groupEnd: function() {},
      groupCollapsed: function() {},
      time: function() {},
      timeEnd: function() {},
      timeLog: function() {},
      count: function() {},
      countReset: function() {},
      clear: function() {},
      dir: function() {},
      dirxml: function() {},
      assert: function() {}
    };
  }
  
  // Make original console available globally for debugging (only in development)
  if (typeof window !== 'undefined' && process && process.env && process.env.NODE_ENV === 'development') {
    window.originalConsole = originalConsole;
  }
})();


