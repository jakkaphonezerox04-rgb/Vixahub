/**
 * Disable console methods in production
 * This prevents users from seeing debug information in F12 Developer Tools
 */

export function disableConsoleInProduction() {
  // Only disable in production
  if (process.env.NODE_ENV === 'production') {
    // Override console methods to prevent logging
    console.log = () => {}
    console.info = () => {}
    console.warn = () => {}
    console.error = () => {}
    console.debug = () => {}
    console.trace = () => {}
    console.table = () => {}
    console.group = () => {}
    console.groupEnd = () => {}
    console.groupCollapsed = () => {}
    console.time = () => {}
    console.timeEnd = () => {}
    console.count = () => {}
    console.countReset = () => {}
    console.clear = () => {}
    console.dir = () => {}
    console.dirxml = () => {}
    console.assert = () => {}
    
    // Override console methods that return values
    console.timeLog = () => {}
    
    // Disable console in window object as well
    if (typeof window !== 'undefined') {
      window.console = {
        log: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
        trace: () => {},
        table: () => {},
        group: () => {},
        groupEnd: () => {},
        groupCollapsed: () => {},
        time: () => {},
        timeEnd: () => {},
        timeLog: () => {},
        count: () => {},
        countReset: () => {},
        clear: () => {},
        dir: () => {},
        dirxml: () => {},
        assert: () => {}
      } as Console
    }
  }
}

/**
 * Disable console methods completely (for all environments)
 * Use this if you want to disable console logs in development too
 */
export function disableConsoleCompletely() {
  // Override console methods to prevent logging
  console.log = () => {}
  console.info = () => {}
  console.warn = () => {}
  console.error = () => {}
  console.debug = () => {}
  console.trace = () => {}
  console.table = () => {}
  console.group = () => {}
  console.groupEnd = () => {}
  console.groupCollapsed = () => {}
  console.time = () => {}
  console.timeEnd = () => {}
  console.count = () => {}
  console.countReset = () => {}
  console.clear = () => {}
  console.dir = () => {}
  console.dirxml = () => {}
  console.assert = () => {}
  
  // Override console methods that return values
  console.timeLog = () => {}
  
  // Disable console in window object as well
  if (typeof window !== 'undefined') {
    window.console = {
      log: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
      debug: () => {},
      trace: () => {},
      table: () => {},
      group: () => {},
      groupEnd: () => {},
      groupCollapsed: () => {},
      time: () => {},
      timeEnd: () => {},
      timeLog: () => {},
      count: () => {},
      countReset: () => {},
      clear: () => {},
      dir: () => {},
      dirxml: () => {},
      assert: () => {}
    } as Console
  }
}

/**
 * Enable console methods (for debugging purposes)
 */
export function enableConsole() {
  // This function doesn't do anything as we can't restore the original console
  // The console methods are permanently overridden
  console.log('Console has been re-enabled (this message should not appear if disabled)')
}


