import { CheckpointPicker, SaveRequest } from './CheckpointPicker';
import { FormikValues } from 'formik';
import { FormikValuesDiff, fastArrayUniqueMerge } from './getFormikValuesDiff';


/**
 * This middleware prevents saving in the middle of editing a word.
 */

export class EditedFieldChangedCheckpointPicker<T extends FormikValues> extends CheckpointPicker<T> {

  constructor() {
    super();
  }

  pick(
    previousValues: T,
    previousValuesDiff: FormikValuesDiff,
    newValues: T,
    valuesDiff: FormikValuesDiff,
  ): SaveRequest<T> | undefined {

    const previouslyModifiedPaths = Object.keys(previousValuesDiff);
    const newlyodifiedPaths = Object.keys(valuesDiff);

    const allKeys = fastArrayUniqueMerge(previouslyModifiedPaths, newlyodifiedPaths);

    const areModifiedFieldsDifferentFromLastTime = newlyodifiedPaths.length !== allKeys.length;

    if (areModifiedFieldsDifferentFromLastTime) {
      return { value: previousValues, now: true };
    }
  }


}
