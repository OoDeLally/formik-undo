import { useFormikContext } from 'formik';
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


export const useFormikUndoAutoSave = <T extends Record<any, any>>(options: AutoSaveOptions = {}) => {
  const { throttleDelay, enabled, saveOnFieldChange } = { ...defaultOptions, ...options };
  const { values } = useFormikContext<T>();
  // console.log('values', values);
  const previousValuesRef = useRef<T>(values);
  const previousModifiedFieldsRef = useRef<(keyof T)[]>([]);
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
        return;
      }

      if (areFormikValuesEqual(values, previousValuesRef.current)) {
        return;
      }

      if (saveOnFieldChange) {
        // FIXME
        throw new Error('not implemented');
      } else {
        // console.log('submitValueToThrottler', values);
        submitValueToThrottler(() => previousValuesRef.current);
      }
      previousValuesRef.current = values;
    },
    values,
    [enabled, didCreateCurrentValuesRef, submitValueToThrottler],
  );
};
