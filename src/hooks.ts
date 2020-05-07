import { DependencyList, MutableRefObject, useCallback, useEffect, useRef, useState, SetStateAction } from 'react';

/**
 * Constantly update the value without changing the ref.
 */
export const useValueRef = <T>(currentValue: T): MutableRefObject<T> => {
  const ref = useRef<T>(currentValue);
  ref.current = currentValue;
  return ref;
};


const isFunction = (val: unknown): val is Function =>
  typeof val === 'function';


/**
 * Provide a state that triggers a re-render depending on which dependency is used.
 * `stateValue` and `valueRef.current` provide the same value.
 * However a dependency on `valueRef` will not trigger a re-render when the value changes.
 */
export const useStateAndRef = <T>(initialValue: T) => {
  const [value, setValue] = useState<T>(initialValue);
  const ref = useRef<T>(initialValue);
  const setValueAndRef = useCallback(
    (setStateAction: SetStateAction<T>) => {
      const newValue = isFunction(setStateAction) ? setStateAction(ref.current) : setStateAction;
      setValue(newValue);
      ref.current = newValue;
    },
    [setValue, ref],
  );
  return [value, ref, setValueAndRef] as const;
};


/**
 * Like a normal useEffect(), but skips as long as `depToMonitor` has not changed.
 */
export const useEffectAfterFirstChange =
(effect: React.EffectCallback, depToMonitor: unknown, otherDeps?: DependencyList | undefined): void => {
  const initialDepValueRef = useRef(depToMonitor);
  const effectRef = useValueRef(effect);
  useEffect(
    () => {
      if (depToMonitor !== initialDepValueRef.current) {
        initialDepValueRef.current = {}; // Set it to a unequalable value, so `effectRef` everytime after that.
        return effectRef.current();
      }
    },
    [...otherDeps, effectRef, depToMonitor, initialDepValueRef], // eslint-disable-line react-hooks/exhaustive-deps
  );
};


export const useThrottledValue = <T extends unknown>(latestValue: T, delay: number) => {
  const [value, setValue] = useState<T>(latestValue);
  const isIdleRef = useRef(true);
  const latestKnownValueRef = useValueRef<T>(latestValue);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const restartTimer = useCallback(
    () => {
      isIdleRef.current = false;
      timerRef.current = setTimeout(
        () => {
          isIdleRef.current = true;
        },
        delay,
      );
    },
    [delay],
  );
  useEffectAfterFirstChange(
    () => {
      latestKnownValueRef.current = latestValue;
      if (isIdleRef.current) {
        setValue(latestValue);
        restartTimer();
      }
    },
    latestValue,
    [restartTimer],
  );
  useEffect(
    () => {
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current); // Clear the timer upon unmounting.
        }
      };
    },
    [],
  );
  return isIdleRef.current ? latestKnownValueRef.current : value;
};


export const useDebouncedValue = <T extends unknown>(latestValue: T, delay: number): T => {
  const [value, setValue] = useState<T>(latestValue);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const scheduleNewValue = useCallback(
    (newValue: T) => {
      timerRef.current = setTimeout(
        () => {
          setValue(newValue);
        },
        delay,
      );
    },
    [delay],
  );
  useEffect(
    () => {
      scheduleNewValue(latestValue);
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current); // Clear the timer upon unmounting.
        }
      };
    },
    [latestValue, scheduleNewValue],
  );
  return value;
};
