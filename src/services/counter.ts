import { Injectable } from "@angular/core";

@Injectable({providedIn: 'root'})
export class Counter {
  private count = 0;

  increment() {
    this.count++;
  }

  current() {
    return this.count;
  }
}
