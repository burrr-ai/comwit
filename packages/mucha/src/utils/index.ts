import { isEqual as _isEqual } from 'es-toolkit';

export function isEqual(a: any, b: any) {
    return _isEqual(a, b);
}

export type ArrayElement<T extends readonly unknown[]> = T[number];

export type UnionToIntersection<U> =
    (U extends unknown ? (arg: U) => void : never) extends (arg: infer I) => void
        ? I
        : never;

export type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};
