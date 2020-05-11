import { useFormikContext, FormikValues } from 'formik';
import { useMemo, useRef } from 'react';
import { CheckpointPicker, SaveRequest } from './CheckpointPicker';
import { EditedFieldChangedCheckpointPicker } from './EditedFieldChangedCheckpointPicker';
import { areFormikValuesEqual, useFormikUndo } from './FormikUndoProvider';
import { useEffectAfterFirstChange, useThrottler, useValueRef } from './hooks';
import { WordEditingCheckpointPicker } from './WordEditingCheckpointPicker';
import { AutoSaveOptions } from './types';



const defaultOptions: AutoSaveOptions = {
  throttleDelay: 2000,
  enabled: true,
  saveOnFieldChange: true,
  preventWordCutting: true,
};


export const getModifiedFieldsKeys = <T extends FormikValues>(arrayA: T, arrayB: T) => {
  const set = new Set([...Object.keys(arrayA), ...Object.keys(arrayB)]);
  return Array.from(set.values()).filter(key => arrayA[key] !== arrayB[key]);
};


export const useFormikUndoAutoSave = <T extends FormikValues>(options: Partial<AutoSaveOptions> = {}) => {
  const { throttleDelay, enabled, saveOnFieldChange, preventWordCutting } = { ...defaultOptions, ...options };
  const { values: newFormikValues } = useFormikContext<T>();
  const previousFormikValuesRef = useRef<T>(newFormikValues);
  const previouslyModifiedFieldsRef = useRef<(keyof T)[]>([]);
  const { saveCheckpoint, addCheckpointEquivalent, didCreateCurrentValues } = useFormikUndo();
  const didCreateCurrentValuesRef = useValueRef(didCreateCurrentValues);
  const [throttledValue, submitValueToThrottler] = useThrottler<T>(newFormikValues, throttleDelay);

  const checkpointPickers = useMemo<CheckpointPicker<T>[]>(
    () => {
      const pickers: CheckpointPicker<T>[] = [];
      pickers.push(new WordEditingCheckpointPicker({ preventWordCutting }));
      if (saveOnFieldChange) {
        pickers.push(new EditedFieldChangedCheckpointPicker());
      }
      return pickers;
    },
    [preventWordCutting],
  );

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

      const previousFormikValues = previousFormikValuesRef.current;
      const previouslyModifiedFields = previouslyModifiedFieldsRef.current;

      if (areFormikValuesEqual(newFormikValues, previousFormikValues)) {
        return; // Nothing actually changed, even though the containing object may be different.
      }

      previousFormikValuesRef.current = newFormikValues;

      const modifiedFieldsKeys = getModifiedFieldsKeys(previousFormikValues, newFormikValues);
      previouslyModifiedFieldsRef.current = modifiedFieldsKeys;

      // We do not want to save the same value several times.
      // Therefore we need to only keep one request per formik value.
      // We store all requets in a map, and the winner per-value will be selected later.
      const allRequestsMap = new Map<T, SaveRequest<T>[]>();
      allRequestsMap.set(previousFormikValues, []);
      allRequestsMap.set(newFormikValues, []);
      for (const picker of checkpointPickers) {
        const request = picker.pick(previousFormikValues, previouslyModifiedFields, newFormikValues, modifiedFieldsKeys);
        if (!request) {
          continue;
        }
        // The picker may have decided to save the previous or the current value.
        if (!(request.value === previousFormikValues || request.value === newFormikValues)) {
          throw new Error('Picker are only allowed to return one of the two provided values');
        }
        if (request.equivalent) {
          addCheckpointEquivalent(request.value, request.equivalent);
        }
        allRequestsMap.get(request.value).push(request);
      }

      // For each formik values, choose the best one.
      const chosenRequests: SaveRequest<T>[] = [];
      allRequestsMap.forEach((requests, values) => {
        // requests with `now` take precedence.
        if (requests.length === 0) {
          return;
        }
        const saveNowRequest = requests.find(({ now }) => now);
        if (saveNowRequest) {
          chosenRequests.push(saveNowRequest);
        } else {
          chosenRequests.push(requests[0]); // They are all equal, so we take any.
        }
      });

      const [saveNowRequests, saveWithThrottleRequests] = chosenRequests.reduce(
        (arrays, request) => {
          const [saveNowRequests, saveWithThrottleRequests] = arrays;
          if (request.now) {
            saveNowRequests.push(request);
          } else {
            saveWithThrottleRequests.push(request);
          }
          return arrays;
        },
        [[], []] as [SaveRequest<T>[], SaveRequest<T>[]],
      );

      if (saveNowRequests.length === 1) {
        const valueToSave = saveNowRequests[0].value;
        submitValueToThrottler(() => valueToSave, true);
      } else if (saveNowRequests.length === 2) {
        // Picker are only allowed to return one of the two provided values.
        // Therefore we know `saveNowRequests` contains exactly `previousFormikValues` and `newFormikValues`.
        // We save them in chronological order.
        submitValueToThrottler(() => previousFormikValues, true);
        submitValueToThrottler(() => newFormikValues, true);
      }

      if (saveWithThrottleRequests.length === 1) {
        const valueToSave = saveWithThrottleRequests[0].value;
        submitValueToThrottler(() => valueToSave);
      } else if (saveWithThrottleRequests.length === 2) {
        // Picker are only allowed to return one of the two provided values.
        // Therefore we know `saveWithThrottleRequests` contains exactly `previousFormikValues` and `newFormikValues`.
        // We submit the latest one, `newFormikValues`.
        submitValueToThrottler(() => newFormikValues);
      }

    },
    newFormikValues,
    [enabled, didCreateCurrentValuesRef, submitValueToThrottler],
  );
};
