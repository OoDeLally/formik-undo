import { CheckpointPicker, SaveRequest } from './CheckpointPicker';
import { FormikValues } from 'formik';
import { FormikValuesDiff } from './getFormikValuesDiff';


const splitToWords = (str: string) => str.split(/\s+/g);



interface ConstructorOptions {
  preventWordCutting: boolean;
}


/**
 * This middleware prevents saving in the middle of editing a word.
 */

export class WordEditingCheckpointPicker<T extends FormikValues> extends CheckpointPicker<T> {

  private readonly preventWordCutting: boolean;

  constructor({ preventWordCutting }: ConstructorOptions) {
    super();
    this.preventWordCutting = preventWordCutting;
  }

  pick(
    previousValues: T,
    previousValuesDiff: FormikValuesDiff,
    newValues: T,
    valuesDiff: FormikValuesDiff,
  ): SaveRequest<T> | undefined {


    // console.log('modifiedFieldsKeys', modifiedFieldsKeys);
    const modifiedPaths = Object.keys(valuesDiff);

    if (modifiedPaths.length !== 1) {
      return; // Does not look like word editing. We should not prevent it.
    }

    const modifiedPath = modifiedPaths[0];
    const valueDiff = valuesDiff[modifiedPath]

    const previousValue = valueDiff[0];
    if (typeof previousValue !== 'string') {
      return; // Does not look like word editing. We should not prevent it.
    }

    const newValue = valueDiff[1];
    if (typeof newValue !== 'string') {
      return; // Does not look like word editing. We should not prevent it.
    }

    if (!this.preventWordCutting) {
      return { value: newValues };
    }

    // console.log('previousValue     ', JSON.stringify(previousValue));
    // console.log('newValue          ', JSON.stringify(newValue));

    if ((new RegExp(`${previousValue}[\\s\\-]+`)).test(newValue)) {
      // User just added some space. Not worth saving, but we dont want FormikUndo to consider that this is a new state.
      // Therefore we state that the newValue is equivalent to the value we want to save.
      return { value: previousValues, equivalent: newValues };
    }

    // Note: Comparing the number of words may be optimized, since we should not really need to create the array of words.
    const previousValueWords = splitToWords(previousValue);
    const newValueWords = splitToWords(newValue);

    if (previousValueWords.length === newValueWords.length) {
      return; // No words have been removed added, this state is not interesting.
    }

    return { value: previousValues }; // Word count has changed
  }


}
