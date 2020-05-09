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
      ref.current = newValue;
      setValue(newValue);
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


export const useThrottler = <T extends unknown>(initialValue: T, delay: number) => {
  const [, valueRef, setValue] = useStateAndRef<T>(initialValue);
  const newestValueRef = useRef<T>(initialValue);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const restartTimer = useCallback(
    () => {
      timerRef.current = setTimeout(() => {
        if (newestValueRef.current !== valueRef.current) {
          restartTimer();
          setValue(newestValueRef.current);
        } else {
          timerRef.current = null;
        }
      }, delay);
    },
    [delay],
  );
  const submitNewValue = useCallback(
    (newValue: T, resetTimer?: boolean) => {
      if (newValue === valueRef.current) {
        return;
      }
      newestValueRef.current = newValue;
      if (delay === 0 || resetTimer || timerRef.current === null) {
        restartTimer();
        setValue(newValue);
      }
    },
    [delay],
  );
  useEffect(() => {
    return () => {
      timerRef.current && clearTimeout(timerRef.current);
    }
  }, []);
  return [valueRef.current, submitNewValue] as const;
};


export const useDebouncer = <T extends unknown>(initialValue: T, delay: number) => {
  const [, valueRef, setValue] = useStateAndRef<T>(initialValue);
  const newestValueRef = useRef<T>(initialValue);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const submitNewValue = useCallback(
    (newValue: T, resetTimer?: boolean) => {
      if (newValue === valueRef.current) {
        return;
      }
      newestValueRef.current = newValue;
      timerRef.current && clearTimeout(timerRef.current);
      if (delay === 0 || resetTimer) {
        setValue(newValue);
      } else {
        timerRef.current = setTimeout(() => {
          setValue(newestValueRef.current)
        }, delay);
      }
    },
    [delay],
  );
  useEffect(() => {
    return () => {
      timerRef.current && clearTimeout(timerRef.current);
    }
  }, []);
  return [valueRef.current, submitNewValue] as const;
};
