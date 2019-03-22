import { Observable } from 'rxjs';

  /**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * Interface for the events emitted through the NgElementStrategy.
 *
 * @publicApi
 */
export interface NgElementStrategyEvent {
  name: string;
  value: any;
}

/**
 * Underlying strategy used by the NgElement to create/destroy the component and react to input
 * changes.
 *
 * @publicApi
 */
export interface NgElementStrategy {
  events: Array<Observable<NgElementStrategyEvent>>;
  connect(element: HTMLElement, upgradeCallback: () => void): void;
  disconnect(): void;
  getInputValue(propName: string): any;
  setInputValue(propName: string, value: string, attributeChange: boolean): void;
}

/**
 * Factory used to create new strategies for each NgElement instance.
 *
 * @publicApi
 */
export interface NgElementStrategyFactory {
  /** Creates a new instance to be used for an NgElement. */
  create(): NgElementStrategy;
}
