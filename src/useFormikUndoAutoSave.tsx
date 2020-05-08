import { useFormikContext } from 'formik';
import { useFormikUndo } from './FormikUndo';
import { useDebouncedValue, useEffectAfterFirstChange, useThrottledValue } from './hooks';


export const useFormikUndoAutoSave = <T extends object>(throttleDelay: number, debounceDelay: number) => {
  const { values } = useFormikContext<T>();
  const { saveCheckpoint } = useFormikUndo();
  const throttledValue = useThrottledValue(values, throttleDelay);
  const throttledDebouncedValues = useDebouncedValue(throttledValue, debounceDelay);
  useEffectAfterFirstChange(
    () => {
      saveCheckpoint();
    },
    throttledDebouncedValues,
    [],
  );
};
