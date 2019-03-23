
interface Subscription {
  unsubscribe(): void;
  add(subscription: Subscription): void;
}

type Callback<T> = (val: T) => void;

export class EventEmitterLite<T> {
  private listeners: Array<Callback<T>> = [];

  emit(val: T): void {
    for (const listener of this.listeners) {
      listener(val);
    }
  }

  subscribe(listener: Callback<T>) {
    this.listeners.push(listener);
    let childSubscriptions: Array<Subscription> = [];
    return {
      unsubscribe: () => {
        let i = this.listeners.indexOf(listener);
        if (i >= 0) {
          this.listeners.splice(i, 1);
        }
        for (const c of childSubscriptions) {
          c.unsubscribe();
        }
      },
      add(subscription: Subscription) {
        childSubscriptions.push(subscription);
      }
    }
  }
}
