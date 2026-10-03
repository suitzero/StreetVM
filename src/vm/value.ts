export interface Value<T> {
  current(): T;
  quality(): number;
  refine(): { value: Value<T>; cost: number };
}
