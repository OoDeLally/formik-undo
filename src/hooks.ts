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
    [...(otherDeps || []), effectRef, depToMonitor, initialDepValueRef],
  );
};


export const useThrottledValue = <T extends unknown>(delay: number) => {
  const [value, setValue] = useState<T>();
  const latestValueRef = useRef<T>();
  const isIdleRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const getThrottledValue = useCallback(
    (latestValue: T, resetTimer?: boolean): T => {
      if (resetTimer) {
        timerRef.current && clearTimeout(timerRef.current);
        isIdleRef.current = true;
        return latestValue;
      }
      latestValueRef.current = latestValue;
      console.log('isIdleRef.current', isIdleRef.current);
      if (isIdleRef.current) {
        // Idle. Use the latest value and start throttling.
        isIdleRef.current = false;
        console.log('start throttle timer');
        timerRef.current = setTimeout(() => {
          console.log('debounce time out');
          isIdleRef.current = true;
          setValue(latestValueRef.current)
        }, delay);
        return latestValue;
      } else {
        // Not idle, we simply way until the timer times out.
        return value!;
      }
    },
    [delay],
  );
  useEffect(() => {
    return () => {
      timerRef.current && clearTimeout(timerRef.current);
    }
  }, []);
  return getThrottledValue;
};


export const useDebouncedValue = <T extends unknown>(delay: number) => {
  const [, valueRef, setValue] = useStateAndRef<T | undefined>(undefined);
  const latestValueRef = useRef<T>();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const getDebouncedValue = useCallback(
    (latestValue: T, resetTimer?: boolean): T => {
      console.log('resetTimer', resetTimer);
      latestValueRef.current = latestValue;
      timerRef.current && clearTimeout(timerRef.current);
      if (resetTimer) {
        setValue(latestValue);
        return latestValue;
      } else {
        if (latestValue !== valueRef.current) {
          console.log('start debounce timer');
          timerRef.current = setTimeout(() => {
            console.log('debounce time out');
            setValue(latestValueRef.current)
          }, delay);
        }
        return valueRef.current !== undefined ? valueRef.current : latestValue;
      }
    },
    [delay],
  );
  useEffect(() => {
    return () => {
      timerRef.current && clearTimeout(timerRef.current);
    }
  }, []);
  return getDebouncedValue;
};
