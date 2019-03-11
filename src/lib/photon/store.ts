/**
 * A simple store that can store values and let's you subscribe to changes
 * to specific keys.
 */
export class Store {
  private keyValue = new Map<string, {}>();
  private subscribers = new Map<string, Array<(newVal: {}) => void>>();

  setItem(key: string, val: {}) {
    this.keyValue.set(key, val);
    this.notify(key, val);
  }

  getItem(key: string): {} {
    return this.keyValue.get(key);
  }

  subscribe(key: string, cb: (newVal: {}) => void) {
    let subscribersList = this.subscribers.get(key);
    if (!subscribersList) {
      subscribersList = [];
      this.subscribers.set(key, subscribersList);
    }
    subscribersList.push(cb);
  }

  private notify(key: string, newVal: {}) {
    let subscribersList = this.subscribers.get(key);
    if (subscribersList) {
      for (const subscriber of subscribersList) {
        subscriber(newVal);
      }
    }  
  }
}