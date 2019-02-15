import * as c from './c';
import("./b").then(
    (mod) => {
        console.log(`hello ${mod.b} ${c.thing}`);
    }
);
