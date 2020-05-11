import { CheckpointPicker, SaveRequest } from './CheckpointPicker';
import { FormikValues } from 'formik';


const areStringArrayElementsEqual = (arrayA: string[], arrayB: string[]) => {
  // Ignore the order.
  if (arrayA.length !== arrayB.length) {
    return false;
  }
  const sortedArrayA = arrayA.sort();
  const sortedArrayB = arrayB.sort();
  for (const index in sortedArrayA) {
    if (sortedArrayA[index] !== sortedArrayB[index]) {
      return false;
    }
  }
  return true;
};


/**
 * This middleware prevents saving in the middle of editing a word.
 */

export class EditedFieldChangedCheckpointPicker<T extends FormikValues> extends CheckpointPicker<T> {

  constructor() {
    super();
  }

  pick(
    previousValues: T,
    previouslyModifiedFieldsKeys: (keyof T)[],
    newValues: T,
    modifiedFieldsKeys: (keyof T)[],
  ): SaveRequest<T> | undefined {

    const areModifiedFieldsDifferentFromLastTime = !areStringArrayElementsEqual(
      modifiedFieldsKeys as string[],
      previouslyModifiedFieldsKeys as string[],
    );
    if (areModifiedFieldsDifferentFromLastTime) {
      return { value: previousValues, now: true };
    }
  }


}
