import { useFormikContext } from 'formik';
import { useRef, useEffect } from 'react';
import { useFormikUndo, areFormikValuesEqual } from './FormikUndo';
import { useDebouncer, useEffectAfterFirstChange, useThrottler } from './hooks';
import { pickBy, some } from 'lodash';


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
  const { throttleDelay, debounceDelay, enabled, saveOnFieldChange } = { ...defaultOptions, ...options };
  const { values } = useFormikContext<T>();
  // console.log('values', values);
  const previousValuesRef = useRef<T>(values);
  const previousModifiedFieldsRef = useRef<(keyof T)[]>([]);
  const { saveCheckpoint } = useFormikUndo();
  const [throttledValue, submitValueToThrottler] = useThrottler<T>(values, throttleDelay);
  const [debouncedValue, submitValueToDebouncer] = useDebouncer<T>(values, debounceDelay);

  useEffect(() => {
    if (debounceDelay >= throttleDelay) {
      console.warn(`Debounce delay (${debounceDelay}ms) should be smaller than throttle delay (${throttleDelay}ms)`);
    }
  }, [throttleDelay, debounceDelay]);


  useEffectAfterFirstChange(
    () => {
      // console.log('submitValueToDebouncer', throttledValue);
      submitValueToDebouncer(throttledValue);
    },
    throttledValue,
    [submitValueToDebouncer],
  );

  useEffectAfterFirstChange(
    () => {
      console.log('saveCheckpoint', debouncedValue);
      saveCheckpoint(debouncedValue);
    },
    debouncedValue,
    [saveCheckpoint],
  );

  useEffectAfterFirstChange(
    () => {
      if (!enabled) {
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
        submitValueToThrottler(values);
      }

      previousValuesRef.current = values;
    },
    values,
    [enabled],
  );
};
