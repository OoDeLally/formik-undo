import { useFormikContext } from 'formik';
import { useRef } from 'react';
import { areFormikValuesEqual, useFormikUndo } from './FormikUndo';
import { useEffectAfterFirstChange, useThrottler, useValueRef } from './hooks';


export interface AutoSaveOptions {
  throttleDelay: number;
  enabled: boolean;
  saveOnFieldChange: boolean;
}


const defaultOptions: AutoSaveOptions = {
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


const getModifiedFieldsKeys = <T extends Record<any, unknown>>(arrayA: T, arrayB: T) => {
  const set = new Set([...Object.keys(arrayA), ...Object.keys(arrayB)]);
  return Array.from(set.values()).filter(key => arrayA[key] !== arrayB[key]);
};


export const useFormikUndoAutoSave = <T extends Record<any, any>>(options: Partial<AutoSaveOptions> = {}) => {
  const { throttleDelay, enabled, saveOnFieldChange } = { ...defaultOptions, ...options };
  const { values } = useFormikContext<T>();
  const previousValuesRef = useRef<T>(values);
  const previouslyModifiedFieldsRef = useRef<(keyof T)[]>([]);
  const { saveCheckpoint, didCreateCurrentValues } = useFormikUndo();
  const didCreateCurrentValuesRef = useValueRef(didCreateCurrentValues);
  const [throttledValue, submitValueToThrottler] = useThrottler<T>(values, throttleDelay);

  useEffectAfterFirstChange(
    () => {
      if (!enabled) {
        return;
      }
      saveCheckpoint(throttledValue);
    },
    throttledValue,
    [saveCheckpoint, enabled],
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
        const modifiedFieldsKeys = getModifiedFieldsKeys(values, previousValues);
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
