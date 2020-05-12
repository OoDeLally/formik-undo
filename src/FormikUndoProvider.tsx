import { useFormikContext, FormikValues } from 'formik';
import React, { ReactNode, useCallback, useContext, useMemo, useRef } from 'react';
import { useValueRef } from './hooks';
import { AutoSaveOptions } from './types';


interface FormikUndoContext<Values extends FormikValues> {
  saveCheckpoint: (values?: Values) => void;
  addCheckpointEquivalent: (targetValue: Values, equivalentValue: Values) => void;
  reset: () => void;
  undo: () => void;
  redo: () => void;
  undoableCount: number;
  redoableCount: number;
  didCreateCurrentValues: boolean;
}


const reactContext = React.createContext<FormikUndoContext<any>>(null!);


export const useFormikUndo = <Values extends FormikValues>(): FormikUndoContext<Values> => {
  const formikUndoContext = useContext(reactContext);
  if (!formikUndoContext) {
    throw new Error(
      'FormikUndo context not found. ' +
      'Make sure you call useFormikUndo() inside a FormikUndo context.'
    );
  }
  return formikUndoContext;
};


/**
 * Test equality field by field (i.e. 1-deep equality).
 */
export const areFormikValuesEqual = <Values extends FormikValues>(a: Values | undefined, b: Values | undefined) => {
  if (a === undefined) {
    return b === undefined;
  }
  if (b === undefined) {
    return a === undefined;
  }
  const aKeys = Object.keys(a).filter(key => a[key] !== undefined);
  const bKeys = Object.keys(b).filter(key => b[key] !== undefined);
  if (aKeys.length !== bKeys.length) {
    return false;
  }
  for (const aKey of aKeys) {
    if (a[aKey] !== b[aKey]) {
      return false;
    }
  }
  return true;
};



interface FormikUndoContextProviderProps {
  autoSave?: boolean | AutoSaveOptions;
  children?: ReactNode;
}


export const FormikUndoContextProvider = <Values extends FormikValues>({
  autoSave: autoSaveOptions, children
}: FormikUndoContextProviderProps) => {
  const formikContext = useFormikContext<Values>();
  if (!formikContext) {
    throw new Error(
      'Formik context not found. Make sure that: \n' +
      '  1- you use <FormikUndoContextProvider> inside a <Formik> context.\n' +
      '  2- Your app and FormikUndoContextProvider are using the same Formik module instance.'
    );
  }
  const {
    values: formikValues, setValues: setFormikValues
  } = formikContext;
  const formikValuesRef = useValueRef(formikValues);
  const checkpoints = useRef<Values[]>([formikValues]).current;
  const checkpointEquivalences = useRef<Map<Values, Values[]>>(new Map()).current;
  const currentCheckpointIndexRef = useRef(0);
  const lastValuesModifiedByUsRef = useRef<Values | undefined>();

  const currentCheckpointIndex = currentCheckpointIndexRef.current;
  const currentCheckpoint = checkpoints[currentCheckpointIndex];

  const doValuesMatchCheckpoint = useCallback(
    (values: Values, checkpoint: Values) => {
      if (areFormikValuesEqual(values, checkpoint)) {
        return true;
      }
      const equivalences = checkpointEquivalences.get(checkpoint);
      return equivalences && equivalences.find(equivalence => areFormikValuesEqual(equivalence, values));
    },
    [],
  );

  const valuesChangedSinceCurrentCheckpoint = !doValuesMatchCheckpoint(formikValues, currentCheckpoint);
  if (valuesChangedSinceCurrentCheckpoint) {
    // If values have been manually changed, we discard all history past current checkpoint.
    checkpoints.splice(currentCheckpointIndex + 1, checkpoints.length);
  }
  const undoableCount = currentCheckpointIndexRef.current + (valuesChangedSinceCurrentCheckpoint ? 1 : 0);
  const redoableCount = valuesChangedSinceCurrentCheckpoint
    ? 0
    : checkpoints.length - currentCheckpointIndexRef.current - 1;
  const didCreateCurrentValues = areFormikValuesEqual(formikValues, lastValuesModifiedByUsRef.current);



  const saveCheckpoint = useCallback(
    (values?: Values) => {
      const valuesToSave = values || formikValuesRef.current;
      if (areFormikValuesEqual(valuesToSave, lastValuesModifiedByUsRef.current)) {
        return; // This change was created by us. Saving aborted.
      }
      const currentCheckpoint = checkpoints[currentCheckpointIndexRef.current];
      if (doValuesMatchCheckpoint(valuesToSave, currentCheckpoint)) {
        return; // The state of the form has not changed. Nothing to do.
      }
      // console.log('SAVING', JSON.stringify((valuesToSave as any).content));
      // console.log('SAVING',valuesToSave);
      checkpoints.push(valuesToSave);
      currentCheckpointIndexRef.current++;
    },
    [formikValuesRef, checkpoints, currentCheckpointIndexRef],
  );

  const addCheckpointEquivalent = useCallback(
    (targetValue: Values, equivalentValue: Values) => {
      if (!checkpointEquivalences.has(targetValue)) {
        checkpointEquivalences.set(targetValue, []);
      }
      checkpointEquivalences.get(targetValue).push(equivalentValue);
    },
    [checkpoints],
  );

  const jumpToCheckpoint = useCallback(
    (checkpointIndex: number) => {
      currentCheckpointIndexRef.current = checkpointIndex;
      const checkpoint = checkpoints[checkpointIndex];
      if (checkpoint === undefined) {
        throw new Error(`jumpToCheckpoint(${checkpointIndex}): out of bounds`);
      }
      lastValuesModifiedByUsRef.current = checkpoint;
      setFormikValues(checkpoint);
    },
    [setFormikValues, checkpoints],
  );

  const doeFormikValuesMatchCurrentCheckpoint = useCallback(
    () => {
      const currentCheckpoint = checkpoints[currentCheckpointIndexRef.current];
      return doValuesMatchCheckpoint(formikValuesRef.current, currentCheckpoint);
    },
    [checkpoints, formikValuesRef],
  );


  const reset = useCallback(
    () => {
      if (!doeFormikValuesMatchCurrentCheckpoint()) {
        // Values have been changed by user.
        checkpoints.push(formikValuesRef.current); // save the current value (since we may redo later).
      }
      jumpToCheckpoint(0);
    },
    [jumpToCheckpoint, checkpoints, formikValuesRef, doeFormikValuesMatchCurrentCheckpoint],
  );

  const undo = useCallback(
    () => {
      // console.log('undo');
      if (doeFormikValuesMatchCurrentCheckpoint()) {
        // Values haven't been changed since current checkpoint. Therefore we need to go back in history.
        jumpToCheckpoint(currentCheckpointIndexRef.current - 1);
      } else {
        // Values have been changed by user.
        checkpoints.push(formikValuesRef.current); // save the current value (in case we need to redo later).
        jumpToCheckpoint(currentCheckpointIndexRef.current);
      }
    },
    [jumpToCheckpoint, checkpoints, formikValuesRef, doeFormikValuesMatchCurrentCheckpoint],
  );

  const redo = useCallback(
    () => {
      jumpToCheckpoint(currentCheckpointIndexRef.current + 1);
    },
    [jumpToCheckpoint, currentCheckpointIndexRef],
  );

  const context = useMemo(
    () => ({ saveCheckpoint, undo, reset, redo, undoableCount, redoableCount, addCheckpointEquivalent, didCreateCurrentValues }),
    [saveCheckpoint, undo, reset, redo, undoableCount, redoableCount, addCheckpointEquivalent, didCreateCurrentValues],
  );

  return (
    <reactContext.Provider value={context}>
      {children}
    </reactContext.Provider>
  );
};
