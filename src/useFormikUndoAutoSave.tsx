import { useFormikContext } from 'formik';
import { useFormikUndo } from './FormikUndo';
import { useDebouncedValue, useEffectAfterFirstChange, useThrottledValue } from './hooks';


interface AutoSaveConfig {
  throttleDelay: number;
  debounceDelay: number;
  enabled: boolean;
}

type AutoSaveOptions = Partial<AutoSaveConfig>;

const defaultOptions: AutoSaveConfig = {
  throttleDelay: 2000,
  debounceDelay: 500,
  enabled: true,
};


export const useFormikUndoAutoSave = <T extends object>(options: AutoSaveOptions = {}) => {
  const { throttleDelay, debounceDelay, enabled } = {...defaultOptions, ...options };
  const { values } = useFormikContext<T>();
  const { saveCheckpoint } = useFormikUndo();
  const throttledValue = useThrottledValue(values, throttleDelay);
  const throttledDebouncedValues = useDebouncedValue(throttledValue, debounceDelay);
  useEffectAfterFirstChange(
    () => {
      if (!enabled) {
        return;
      }
      saveCheckpoint();
    },
    throttledDebouncedValues,
    [enabled],
  );
};
