import { useFormikContext } from 'formik';
import { pickBy, some } from 'lodash';
import { useRef } from 'react';
import { useFormikUndo } from './FormikUndo';
import { useDebouncedValue, useEffectAfterFirstChange, useThrottledValue } from './hooks';


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

  const wereFormikValuesChanged = values !== previousValuesRef.current;

  let valueToMonitorSource: 'direct' | 'timed';

  if (wereFormikValuesChanged && saveOnFieldChange) {
    const modifiedValues = pickBy(values, (val, key) => val !== previousValuesRef.current[key]) as Partial<T>;
    const modifiedFields = Object.keys(modifiedValues) as (keyof T)[];
    const aDifferentSetOfFieldsWasModified =
      modifiedFields.length !== previousModifiedFieldsRef.current.length ||
      some(previousModifiedFieldsRef.current, field => !modifiedFields.includes(field))

    if (aDifferentSetOfFieldsWasModified) {
      // FIXME: actually save the last state of `values`???
      valueToMonitorSource = 'direct';
      previousModifiedFieldsRef.current = modifiedFields;
    } else {
      valueToMonitorSource = 'timed';
    }
  } else {
    valueToMonitorSource = 'timed';
  }

  const resetTimers = valueToMonitorSource === 'direct';
  const throttledValues = useThrottledValue(values, throttleDelay, resetTimers);
  const throttledDebouncedValues = useDebouncedValue(throttledValues, debounceDelay, resetTimers);

  const valueToMonitor = valueToMonitorSource === 'direct' ? values : throttledDebouncedValues;

  previousValuesRef.current = values;

  useEffectAfterFirstChange(
    () => {
      if (!enabled) {
        return;
      }
      saveCheckpoint();
    },
    valueToMonitor,
    [enabled],
  );
};
