import { useFormikContext } from 'formik';
import { pickBy, some } from 'lodash';
import { useRef } from 'react';
import { useFormikUndo } from './FormikUndo';
import { useDebouncer, useEffectAfterFirstChange, useThrottler } from './hooks';


interface AutoSaveConfig {
  throttleDelay: number;
  debounceDelay: number;
  enabled: boolean;
  saveOnFieldChange: boolean;
}

type AutoSaveOptions = Partial<AutoSaveConfig>;

const defaultOptions: AutoSaveConfig = {
  throttleDelay: 2000,
  debounceDelay: 500,
  enabled: true,
  saveOnFieldChange: true,
};


export const useFormikUndoAutoSave = <T extends Record<any, any>>(options: AutoSaveOptions = {}) => {
  const { throttleDelay, debounceDelay, enabled, saveOnFieldChange } = {...defaultOptions, ...options };
  const { values } = useFormikContext<T>();
  const previousValuesRef = useRef<T>(values);
  const previousModifiedFieldsRef = useRef<(keyof T)[]>([]);
  const { saveCheckpoint } = useFormikUndo();
  const [throttledValue, submitValueToThrottler] = useThrottler<T>(values, throttleDelay);
  const [debouncedValue, submitValueToDebouncer] = useDebouncer<T>(values, debounceDelay);


  // let resetTimer = false;
  // if (wereFormikValuesChanged && saveOnFieldChange) {
  //   const modifiedValues = pickBy(values, (val, key) => val !== previousValuesRef.current[key]) as Partial<T>;
  //   const modifiedFields = Object.keys(modifiedValues) as (keyof T)[];
  //   const aDifferentSetOfFieldsWasModified =
  //     modifiedFields.length !== previousModifiedFieldsRef.current.length ||
  //     some(previousModifiedFieldsRef.current, field => !modifiedFields.includes(field))

  //   if (aDifferentSetOfFieldsWasModified) {
  //     resetTimer = true;
  //     previousModifiedFieldsRef.current = modifiedFields;
  //   }
  // }

  // console.log('values', values);
  // const valuesToMonitor = getDebouncedValue(values, resetTimer);
  // console.log('valuesToMonitor', valuesToMonitor);
  // // const valuesToMonitor = getDebouncedValue(getThrottledValue(values, resetTimer), resetTimer);


  useEffectAfterFirstChange(
    () => {
      if (!enabled) {
        return;
      }



      const valueToSave = previousValuesRef.current;
      console.log('valueToSave', valueToSave);
      saveCheckpoint(valueToSave);
      previousValuesRef.current = values;
    },
    values,
    [enabled],
  );
};
