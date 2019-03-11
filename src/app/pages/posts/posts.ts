import { Component } from '@angular/core';

export interface Post {
  title: string;
  url: string;
  body: string;
}

@Component({
  template:`
<div *ngFor="let post of posts">
  <a [href]="{{post.url}}">{{post.title}}</a>
</div>
  `,
})
export class Posts {
  @Data(() => '/assets/posts.json')
  posts: Post[];
}
