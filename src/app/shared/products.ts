import { PartialInputs, fetchInitialData } from '../../lib/runtime';

export interface Product {
  name: string;
  price: number;
  description: string;
}

export async function getProducts<T>(context: PartialInputs<T>) {
  const data = await fetchInitialData(context, `/assets/products.json`);
  return {products: JSON.parse(data) as Product[]};
}
