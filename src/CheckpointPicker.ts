import { FormikValues } from 'formik';


export type SaveRequest<T extends FormikValues> = {
  value: T;
  now?: boolean; // Save immediately. Don't throttle.
  equivalent?: T;
}


export abstract class CheckpointPicker<T extends FormikValues> {

  abstract pick(
    previousValues: T,
    previouslyModifiedFieldsKeys: (keyof T)[],
    newValues: T,
    modifiedFieldsKeys: (keyof T)[],
  ): SaveRequest<T> | undefined;

}
