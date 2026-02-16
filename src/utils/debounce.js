/**
 * Debounce and Throttle Utilities
 * 
 * Provides debounce and throttle functions to limit the rate at which
 * functions are called, useful for events like resize, scroll, or input.
 */

export class Debounce {
  /**
   * Create a debounced function
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @param {Object} options - Debounce options
   * @returns {Function} Debounced function
   */
  static debounce(func, wait = 300, options = {}) {
    let timeoutId = null;
    let lastArgs = null;
    let lastThis = null;
    let lastCallTime = 0;
    let result;
    
    const {
      leading = false,
      trailing = true,
      maxWait = null
    } = options;
    
    // Invoke the function
    const invokeFunc = (time) => {
      const args = lastArgs;
      const context = lastThis;
      
      lastArgs = lastThis = null;
      lastCallTime = time;
      result = func.apply(context, args);
      return result;
    };
    
    // Start the timer for trailing edge
    const startTimer = (pendingFunc, waitTime) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(pendingFunc, waitTime);
    };
    
    // Check if we should invoke the function
    const shouldInvoke = (time) => {
      const timeSinceLastCall = time - lastCallTime;
      const timeSinceLastInvoke = time - (lastCallTime || 0);
      
      // Either this is the first call, or enough time has passed
      return lastCallTime === 0 || timeSinceLastCall >= wait;
    };
    
    // Leading edge invocation
    const leadingEdge = (time) => {
      lastCallTime = time;
      
      // Start timer for trailing edge
      if (trailing) {
        startTimer(timerExpired, wait);
      }
      
      // Invoke on leading edge if enabled
      return leading ? invokeFunc(time) : result;
    };
    
    // Calculate remaining wait time
    const remainingWait = (time) => {
      const timeSinceLastCall = time - lastCallTime;
      const timeSinceLastInvoke = time - (lastCallTime || 0);
      const timeWaiting = wait - timeSinceLastCall;
      
      return maxWait === null
        ? timeWaiting
        : Math.min(timeWaiting, maxWait - timeSinceLastInvoke);
    };
    
    // Determine if we should invoke based on timing
    const shouldInvokeOnTimerExpired = (time) => {
      const timeSinceLastCall = time - lastCallTime;
      const timeSinceLastInvoke = time - (lastCallTime || 0);
      
      return (lastCallTime !== 0 && timeSinceLastCall >= wait) ||
             (maxWait !== null && timeSinceLastInvoke >= maxWait);
    };
    
    // Timer expired handler
    const timerExpired = () => {
      const time = Date.now();
      
      if (shouldInvokeOnTimerExpired(time)) {
        return trailingEdge(time);
      }
      
      // Restart the timer
      startTimer(timerExpired, remainingWait(time));
    };
    
    // Trailing edge invocation
    const trailingEdge = (time) => {
      timeoutId = null;
      
      // Only invoke if we have `lastArgs` which means `func` has been
      // debounced at least once
      if (trailing && lastArgs) {
        return invokeFunc(time);
      }
      
      lastArgs = lastThis = null;
      return result;
    };
    
    // Cancel the debounced call
    const cancel = () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      lastCallTime = 0;
      lastArgs = lastThis = timeoutId = null;
    };
    
    // Flush the debounced call (invoke immediately)
    const flush = () => {
      return timeoutId === null ? result : trailingEdge(Date.now());
    };
    
    // Check if there's a pending debounced call
    const pending = () => {
      return timeoutId !== null;
    };
    
    // The debounced function
    const debounced = function(...args) {
      const time = Date.now();
      const isInvoking = shouldInvoke(time);
      
      lastArgs = args;
      lastThis = this;
      
      if (isInvoking) {
        if (timeoutId === null) {
          return leadingEdge(time);
        }
        
        if (maxWait !== null) {
          // Handle invocations in maxWait period
          clearTimeout(timeoutId);
          timeoutId = setTimeout(timerExpired, wait);
          return invokeFunc(time);
        }
      }
      
      if (timeoutId === null) {
        startTimer(timerExpired, wait);
      }
      
      return result;
    };
    
    // Attach cancel and flush methods
    debounced.cancel = cancel;
    debounced.flush = flush;
    debounced.pending = pending;
    
    return debounced;
  }
  
  /**
   * Create a throttled function
   * @param {Function} func - Function to throttle
   * @param {number} wait - Wait time in milliseconds
   * @param {Object} options - Throttle options
   * @returns {Function} Throttled function
   */
  static throttle(func, wait = 300, options = {}) {
    const {
      leading = true,
      trailing = true
    } = options;
    
    return this.debounce(func, wait, {
      leading,
      trailing,
      maxWait: wait
    });
  }
  
  /**
   * Create a debounced function that returns a promise
   * @param {Function} func - Function to debounce (can be async)
   * @param {number} wait - Wait time in milliseconds
   * @param {Object} options - Debounce options
   * @returns {Function} Debounced function that returns a promise
   */
  static debounceAsync(func, wait = 300, options = {}) {
    let timeoutId = null;
    let lastArgs = null;
    let lastThis = null;
    let lastCallTime = 0;
    let resolveQueue = [];
    let rejectQueue = [];
    
    const {
      leading = false,
      trailing = true,
      maxWait = null
    } = options;
    
    // Invoke the function and resolve all promises
    const invokeFunc = async (time) => {
      const args = lastArgs;
      const context = lastThis;
      const resolves = resolveQueue;
      const rejects = rejectQueue;
      
      lastArgs = lastThis = null;
      resolveQueue = [];
      rejectQueue = [];
      lastCallTime = time;
      
      try {
        const result = await func.apply(context, args);
        resolves.forEach(resolve => resolve(result));
      } catch (error) {
        rejects.forEach(reject => reject(error));
      }
    };
    
    // Start the timer for trailing edge
    const startTimer = (pendingFunc, waitTime) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(pendingFunc, waitTime);
    };
    
    // Check if we should invoke the function
    const shouldInvoke = (time) => {
      const timeSinceLastCall = time - lastCallTime;
      const timeSinceLastInvoke = time - (lastCallTime || 0);
      
      return lastCallTime === 0 || timeSinceLastCall >= wait;
    };
    
    // Leading edge invocation
    const leadingEdge = (time) => {
      lastCallTime = time;
      
      if (trailing) {
        startTimer(timerExpired, wait);
      }
      
      if (leading) {
        return invokeFunc(time);
      }
    };
    
    // Calculate remaining wait time
    const remainingWait = (time) => {
      const timeSinceLastCall = time - lastCallTime;
      const timeSinceLastInvoke = time - (lastCallTime || 0);
      const timeWaiting = wait - timeSinceLastCall;
      
      return maxWait === null
        ? timeWaiting
        : Math.min(timeWaiting, maxWait - timeSinceLastInvoke);
    };
    
    // Determine if we should invoke based on timing
    const shouldInvokeOnTimerExpired = (time) => {
      const timeSinceLastCall = time - lastCallTime;
      const timeSinceLastInvoke = time - (lastCallTime || 0);
      
      return (lastCallTime !== 0 && timeSinceLastCall >= wait) ||
             (maxWait !== null && timeSinceLastInvoke >= maxWait);
    };
    
    // Timer expired handler
    const timerExpired = () => {
      const time = Date.now();
      
      if (shouldInvokeOnTimerExpired(time)) {
        return trailingEdge(time);
      }
      
      startTimer(timerExpired, remainingWait(time));
    };
    
    // Trailing edge invocation
    const trailingEdge = (time) => {
      timeoutId = null;
      
      if (trailing && lastArgs) {
        return invokeFunc(time);
      }
    };
    
    // Cancel the debounced call
    const cancel = () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      
      // Reject all pending promises
      rejectQueue.forEach(reject => reject(new Error('Debounced function cancelled')));
      
      lastCallTime = 0;
      lastArgs = lastThis = timeoutId = null;
      resolveQueue = [];
      rejectQueue = [];
    };
    
    // Flush the debounced call (invoke immediately)
    const flush = () => {
      if (timeoutId === null) {
        return Promise.resolve();
      }
      
      return new Promise((resolve, reject) => {
        resolveQueue.push(resolve);
        rejectQueue.push(reject);
        trailingEdge(Date.now());
      });
    };
    
    // Check if there's a pending debounced call
    const pending = () => {
      return timeoutId !== null;
    };
    
    // The debounced function
    const debounced = function(...args) {
      return new Promise((resolve, reject) => {
        const time = Date.now();
        const isInvoking = shouldInvoke(time);
        
        lastArgs = args;
        lastThis = this;
        resolveQueue.push(resolve);
        rejectQueue.push(reject);
        
        if (isInvoking) {
          if (timeoutId === null) {
            leadingEdge(time)?.then(resolve, reject);
            return;
          }
          
          if (maxWait !== null) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(timerExpired, wait);
            invokeFunc(time)?.then(resolve, reject);
            return;
          }
        }
        
        if (timeoutId === null) {
          startTimer(timerExpired, wait);
        }
      });
    };
    
    // Attach cancel and flush methods
    debounced.cancel = cancel;
    debounced.flush = flush;
    debounced.pending = pending;
    
    return debounced;
  }
  
  /**
   * Create a throttled function that returns a promise
   * @param {Function} func - Function to throttle (can be async)
   * @param {number} wait - Wait time in milliseconds
   * @param {Object} options - Throttle options
   * @returns {Function} Throttled function that returns a promise
   */
  static throttleAsync(func, wait = 300, options = {}) {
    const {
      leading = true,
      trailing = true
    } = options;
    
    return this.debounceAsync(func, wait, {
      leading,
      trailing,
      maxWait: wait
    });
  }
}

// Convenience functions
export const debounce = (func, wait, options) => 
  Debounce.debounce(func, wait, options);

export const throttle = (func, wait, options) => 
  Debounce.throttle(func, wait, options);

export const debounceAsync = (func, wait, options) => 
  Debounce.debounceAsync(func, wait, options);

export const throttleAsync = (func, wait, options) => 
  Debounce.throttleAsync(func, wait, options);

// Example usage patterns
/*
// Regular debounce
const search = debounce((query) => {
  console.log('Searching:', query);
}, 300);

// Async debounce  
const saveData = debounceAsync(async (data) => {
  const response = await fetch('/api/save', { method: 'POST', body: data });
  return response.json();
}, 1000);

// Throttle scroll handler
const handleScroll = throttle(() => {
  console.log('Scrolling...');
}, 100);

// Using with options
const logResize = debounce(() => {
  console.log('Window resized');
}, 250, { leading: true, trailing: true });

// Cancel a debounced call
const debouncedFn = debounce(() => console.log('Hello'), 1000);
debouncedFn();
debouncedFn.cancel(); // Cancel before it executes

// Flush a debounced call
debouncedFn();
setTimeout(() => debouncedFn.flush(), 500); // Execute immediately
*/