import { FormikValues } from 'formik';
import { FormikValuesDiff } from './getFormikValuesDiff';


export type SaveRequest<T extends FormikValues> = {
  value: T;
  now?: boolean; // Save immediately. Don't throttle.
  equivalent?: T;
}


export abstract class CheckpointPicker<T extends FormikValues> {

  abstract pick(
    previousValues: T,
    previousValuesDiff: FormikValuesDiff,
    newValues: T,
    valuesDiff: FormikValuesDiff,
  ): SaveRequest<T> | undefined;

}
