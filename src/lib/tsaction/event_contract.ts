/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

interface EventData {
  host: Element;
  event: Event;
  ns: string;
  action: string;
}

function getAnchorParent(target: Node): HTMLElement | null {
  for (let node = target; node != document.body; node = node.parentNode) {
    if ((node.nodeType === Node.ELEMENT_NODE) && ((node as HTMLElement).localName === 'a')) {
      return node as HTMLElement;
    }
  }
  return null;
}

/**
 * A very simplified version of https://github.com/google/jsaction.
 * (And hence also a lot smaller).
 * 
 * All it does is buffer, wake up lazy loaded Angular Elements and replay
 * events. It is not a full event delegation library like jsaction but uses some
 * of the ideas like using attributes from there. Once an Angular Element boots
 * up Angular is in charge of all event handling and tsaction is no longer
 * involved.
 */
export class EventContract {
  // Event buffer list bucketed by the host element is applies to. 
  private buffer = new Map<Element, EventData[]>();

  // List of host Elements that have already booted up and don't need
  // event buffering.
  private booted = new Set<Element>();

  // Router callback to use when anchor links are clicked.
  private routerCallback: (url: string) => void;

  // Currently replayed event.
  private replayedEvent: Event | null = null;

  constructor(private container: HTMLElement, private types: string[]) { }

  /**
   * Return handler matching the event or null if not found.
   * @param event Event to handle
   * @param handler TsAction handler string (Ex. 'click:namspace.handler')
   */
  private getMatchingHandler(event: Event, handler: string) {
    let type = 'click';
    let parts = handler.split(':');
    if (parts.length > 1) {
      type = parts.shift();
    }
    if (event.type === type) {
      const ns_action = parts.shift();
      let ns = 'ng';
      let action = '';
      parts = ns_action.split('.');
      if (parts.length == 2) {
        ns = parts[0];
        action = parts[1];
        return { ns, action };
      }
    }
    return null;
  }

  /**
   * Get the Element with a `tsaction` attribute that matcthes the event type. 
   */
  private getMatchingTsActionElement(event: Event): EventData | null {
    let el = event.target as Element;
    let match: { ns: string, action: string } | null = null;
    while (el != null && el != this.container) {
      if (!match) {
        const attr = el.getAttribute('tsaction');
        if (attr) {
          const handlers = attr.split(';');
          for (const handler of handlers) {
            match = this.getMatchingHandler(event, handler);
            if (match) {
              break;
            }
          }
        }
      } else {
        // A matching handler has been found. Move up to find the host element.
        if (el.localName === match.ns) {
          if (this.booted.has(el)) {
            // This is an Element that's already been booted. Don't
            // buffer the event.
            return null;
          } else {
            return { host: el, event, ...match };
          }
        }
      }
      el = el.parentElement;
    }
    return null;
  }

  private processRouterLinkClick(anchor: HTMLElement, event: Event) {
    // Get the target link and check whether it's absolute.
    const targetLink = anchor.getAttribute('href');
    // TODO: Replace with a proper check.
    const isAbsolute = targetLink.startsWith('http://') || targetLink.startsWith('https://');
    if (this.routerCallback && !!targetLink && !isAbsolute) {
      // Router is active. So do a client side route change.
      event.preventDefault();

      this.routerCallback(targetLink);
    }
    // else router is not active or URL is absolute. Just do a normal server side navigation.
  }

  private bufferEvent(event: Event) {
    const eventData = this.getMatchingTsActionElement(event);
    if (eventData) {
      const existing = this.buffer.get(eventData.host);
      if (existing) {
        const appendEvent = (existing: EventData[], newData: EventData) => {
          // If it's a 'click' dedup it. Otherwise append.
          // TODO : Make this policy configurable preboot style.
          if (newData.event.type === 'click') {
            // Find exisiting click event with the same handler.
            let found = false;
            for (const data of existing) {
              if (data.event.type === 'click' && data.action === newData.action) {
                found = true;
                break;
              }
            }
            if (!found) {
              existing.push(newData);
            }
          } else {
            existing.push(newData);
          }
        };
        appendEvent(existing, eventData);
      } else {
        this.buffer.set(eventData.host, [eventData]);
      }
      // Let the host know that it is go time!!
      eventData.host.setAttribute('_boot', '');
    }
  }

  private processEvent(event: Event) {
    if (event === this.replayedEvent) {
      // Don't process replayed event again.
      return;
    }
    const anchor = getAnchorParent(event.target as Node);
    if (anchor != null) {
      this.processRouterLinkClick(anchor, event);
    }
    else {
      this.bufferEvent(event);
    }
  }

  /**
   * Start listening to events in the container.
   */
  listen() {
    for (const type of this.types) {
      this.container.addEventListener(type, this.processEvent.bind(this));
    }
  }

  /**
   * Add custom event listeners.
   * Called when a component that emits this event becomes active.
   */
  listenToCustomEvent(type: string) {
    if (this.types.indexOf(type) == -1) {
      this.container.addEventListener(type, this.processEvent.bind(this));
      this.types.push(type);
    }
  }

  /**
   * Replay all events in order stored for the given host element.
   */
  replay(el: Element) {
    // No event data was present for this host element.
    const data = this.buffer.get(el);
    if (!data) {
      return;
    }
    // Replay the events in order.
    for (const eventData of data) {
      this.replayedEvent = eventData.event;
      eventData.event.target.dispatchEvent(eventData.event);
      this.replayedEvent = null;
    }
    // Remove the stored events for that element.
    this.buffer.delete(el);
  }

  /**
   * Mark a host Element as having booted up. Don't buffer any more events for
   * it.
   */
  boot(el: Element) {
    this.booted.add(el);
  }

  /**
   * Set a callback for router click links.
   */
  setRouterCallback(callback: (url: string) => void) {
    this.routerCallback = callback;
  }
}
