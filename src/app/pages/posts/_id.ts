import { Component } from '@angular/core';

import {Post} from './posts';

type Context<T> = { [K in keyof T]: T[K] extends Function ? never : T[K] };

@Component({
  template:`
<div>
  <h2>{{post.title}}</h2>
  <p>{{post.body}}</p>
</div>
  `,
})
export class PostComponent {
  @RequestParam
  params: Map<string, string>;

  @Data((context: Context<PostComponent>) => `/assets/post/${context.params.get('id')}.json`)
  posts: Post;
}
