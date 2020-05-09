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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...(otherDeps || []), effectRef, depToMonitor, initialDepValueRef],
  );
};


export const useThrottler = <T extends unknown>(intialValue: T, delay: number) => {
  const [value, valueRef, setValue] = useStateAndRef<T>(intialValue);
  const newestValueGetterRef = useRef<() => T>();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const restartTimer = useCallback(
    () => {
      timerRef.current = setTimeout(() => {
        const newValue = newestValueGetterRef.current!();
        if (newValue !== valueRef.current) {
          restartTimer();
          setValue(newValue);
        } else {
          // Stop throttling.
          timerRef.current = null;
        }
      }, delay);
    },
    [delay, valueRef, setValue],
  );
  const submitNewValue = useCallback(
    (getValue: () => T, resetTimer?: boolean) => {
      newestValueGetterRef.current = getValue;
      if (delay === 0 || resetTimer || timerRef.current === null) {
        restartTimer();
        setValue(getValue());
      }
    },
    [delay, restartTimer, setValue],
  );
  useEffect(() => {
    return () => {
      timerRef.current && clearTimeout(timerRef.current);
    };
  }, []);
  return [value, submitNewValue] as const;
};
