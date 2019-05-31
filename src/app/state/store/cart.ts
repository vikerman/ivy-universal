import { Action, StoreModule } from '../../../lib/store';
import { Product } from '../../shared/product';
import { ADD_TO_CART } from '../actions/cart';

export interface CartState {
  items: Product[];
}

export class Cart implements StoreModule<CartState> {
  initialState = {items: []};

  @Action(ADD_TO_CART)
  addToCart(state: CartState, product: Product): CartState {
    state.items.push(product);
    return state;
  }
}
