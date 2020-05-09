import { useFormikContext } from 'formik';
import { chain } from 'lodash';
import { useRef } from 'react';
import { areFormikValuesEqual, useFormikUndo } from './FormikUndo';
import { useEffectAfterFirstChange, useThrottler, useValueRef } from './hooks';


interface AutoSaveConfig {
  throttleDelay: number;
  enabled: boolean;
  saveOnFieldChange: boolean;
}

type AutoSaveOptions = Partial<AutoSaveConfig>;

const defaultOptions: AutoSaveConfig = {
  throttleDelay: 2000,
  enabled: true,
  saveOnFieldChange: true,
};


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


export const useFormikUndoAutoSave = <T extends Record<any, any>>(options: AutoSaveOptions = {}) => {
  const { throttleDelay, enabled, saveOnFieldChange } = { ...defaultOptions, ...options };
  const { values } = useFormikContext<T>();
  // console.log('values', values);
  const previousValuesRef = useRef<T>(values);
  const previouslyModifiedFieldsRef = useRef<(keyof T)[]>([]);
  const { saveCheckpoint, didCreateCurrentValues } = useFormikUndo();
  const didCreateCurrentValuesRef = useValueRef(didCreateCurrentValues);
  const [throttledValue, submitValueToThrottler] = useThrottler<T>(values, throttleDelay);

  useEffectAfterFirstChange(
    () => {
      saveCheckpoint(throttledValue);
    },
    throttledValue,
    [saveCheckpoint],
  );

  useEffectAfterFirstChange(
    () => {
      if (!enabled) {
        return;
      }

      if (didCreateCurrentValuesRef.current) {
        return; // This value was created by formik-undo and we should not autosave it.
      }

      const previousValues = previousValuesRef.current;
      const previouslyModifiedFields = previouslyModifiedFieldsRef.current;

      if (areFormikValuesEqual(values, previousValues)) {
        return; // Nothing actually changed, even though the containing object may be different.
      }

      if (saveOnFieldChange) {
        const modifiedFieldsKeys = chain([...Object.keys(values), ...Object.keys(previousValues)])
          .uniq()
          .filter(key => values[key] !== previousValues[key])
          .value() as (keyof T)[];
        const areModifiedFieldsDifferentFromLastTime = !areStringArrayElementsEqual(
          modifiedFieldsKeys as string[],
          previouslyModifiedFields as string[]
        );
        if (areModifiedFieldsDifferentFromLastTime) {
          previouslyModifiedFieldsRef.current = modifiedFieldsKeys;
          // The user started modifying other fields. We force-save the last value of the previously-monitored fields.
          const valuesBeforeChangingField = previousValuesRef.current;
          submitValueToThrottler(() => valuesBeforeChangingField, true);
        } else {
          // Otherwise we just do as usual.
          submitValueToThrottler(() => previousValuesRef.current);
        }
      } else {
        submitValueToThrottler(() => previousValuesRef.current);
      }
      previousValuesRef.current = values;
    },
    values,
    [enabled, didCreateCurrentValuesRef, submitValueToThrottler],
  );
};
