import { FormikValues } from 'formik';

export type FormikValuesDiff = Record<string, [unknown, unknown]>;


/**
 * Compute the diff between the two formik values `a`and `b`.
 * {
 *    ["path.to.key"]: [oldValue, newValue],
 *    ["path.to.other.key"]: [oldValue, newValue],
 *    ...
 * }
 */


 // Same as `typeof`, without the `null` bug.
const getTypeOf = (val: unknown): string =>
  val === null ? 'null' : typeof val;


// Mutate the same output object to save time.
const computeDiff = (a: unknown, b: unknown, output: FormikValuesDiff, path: string): void => {
  if (a === b) {
    return;
  }
  const typeA = getTypeOf(a);
  const typeB = getTypeOf(b);
  if (typeA !== typeB) {
    output[path] = [a, b];
    return;
  }
  if (typeA === 'object') { // Object and Arrays
    const keys = fastArrayUniqueMerge(Object.keys(a), Object.keys(b));
    for (const key of keys) {
      if (key.indexOf('.') >= 0) {
        throw new Error('Object key cannot contain the dot (`.`) character because it is used to express path');
      }
      computeDiff((a as any)[key], (b as any)[key], output, `${path}.${key}`);
    }
    return;
  }
  // Other types
  output[path] = [a, b];
  return;
};


export const fastArrayUniqueMerge = (a: string[], b: string[]): string[] => {
  const set = new Set<string>(a);
  for (const elt of b) {
    set.add(elt);
  }
  return Array.from(set);
};



export const getFormikValuesDiff = (a: FormikValues, b: FormikValues): FormikValuesDiff => {
  const output: FormikValuesDiff = {};
  const keys = fastArrayUniqueMerge(Object.keys(a), Object.keys(b));
  for (const key of keys) {
    computeDiff(a[key], b[key], output, key);
  }
  return output;
};



// const a = {
//   foo: 'foo',
//   checked: true,
//   active: false,
//   arr: [
//     {
//       yoo: 'ypp',
//       yoo2: 'ypp',
//       a: [1, 2, 'hohohoh'],
//     },
//     true,
//     'fooooooo',
//   ]
// };

// const b = {
//   foo: 'foo1',
//   checked: false,
//   active: false,
//   arr: [
//     {
//       yoo: 'ypp!',
//       'yoo2': 'ypp',
//       a: [1, 2, 'hohohoh', 'yo'],
//     },
//     false,
//     'fooooooo',
//   ]
// };

// const diff = getFormikValuesDiff(a, b);

// console.log('diff', JSON.stringify(diff, null, 2));
