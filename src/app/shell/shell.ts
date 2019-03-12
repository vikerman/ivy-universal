import { Component } from '@angular/core';

@Component({
  template: `
    <h2 class="header">{{title}}</h2>
    <div class="navbar">
      <a class="navlink" href='/'>Home</a>
      <a class="navlink" href='/2?test=true'>Test Route 1</a>
      <a class="navlink" href='/3?test=true&x=20'>Test Route 2</a>
      <a class="navlink" href='/about'>About</a>
    </div>
    <pages-router></pages-router>
  `,
})
export class ShellComponent {
  title = 'ivy';
}
