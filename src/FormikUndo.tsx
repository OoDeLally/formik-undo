import { useFormikContext } from 'formik';
import { isEqual, isPlainObject, some } from 'lodash';
import React, { ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useValueRef } from './hooks';

type FormikValues = Record<any, any>;


interface FormikUndo<Values extends FormikValues> {
  saveCheckpoint: (values?: Values) => void;
  checkpoints: Values[]; // DEBUG
  currentCheckpointIndex: number; // DEBUG
  reset: () => void;
  undo: () => void;
  redo: () => void;
  undoableCount: number;
  redoableCount: number;
}


const reactContext = React.createContext<FormikUndo<any>>(null!);


export const useFormikUndo = <Values extends FormikValues>(): FormikUndo<Values> => {
  const formikUndoContext = useContext(reactContext);
  if (!formikUndoContext) {
    throw new Error(
      'FormikUndo context not found. ' +
      'Make sure you call useFormikUndoAutoSave() is inside a FormikUndo context.'
    );
  }
  return formikUndoContext;
};


/**
 * Test equality field by field (i.e. 1-deep equality).
 */
const areFormikValuesEqual = <Values extends FormikValues>(a?: Values, b?: Values) => {
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
  children?: ReactNode;
}


export const FormikUndoContextProvider = <Values extends FormikValues>({
  children
}: FormikUndoContextProviderProps) => {
  console.log('');
  console.log('');
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
  const currentCheckpointIndexRef = useRef(0);
  const [debugCurrentCheckpointIndex, setDebugCurrentCheckpointIndex] = useState<number>(0);
  const lastValuesModifiedByUsRef = useRef<Values | undefined>();
  const [debugCheckpoints, setDebugCheckpoints] = useState<Values[]>(checkpoints);

  const currentCheckpointIndex = currentCheckpointIndexRef.current;
  const currentCheckpoint = checkpoints[currentCheckpointIndex];
  console.log('formikValues', formikValues);
  console.log('currentCheckpointIndex', currentCheckpointIndex);
  console.log('currentCheckpoint', currentCheckpoint);
  const valuesChangedSinceCurrentCheckpoint = !areFormikValuesEqual(formikValues, currentCheckpoint);
  if (valuesChangedSinceCurrentCheckpoint) {
    // If values have been manually changed, we discard all history past current checkpoint.
    checkpoints.splice(currentCheckpointIndex + 1, checkpoints.length);
  }
  const undoableCount = currentCheckpointIndexRef.current + (valuesChangedSinceCurrentCheckpoint ? 1 : 0);
  const redoableCount = valuesChangedSinceCurrentCheckpoint
    ? 0
    : checkpoints.length - currentCheckpointIndexRef.current - 1;


  const saveCheckpoint = useCallback(
    (values?: Values) => {
      if (!(values === undefined || isPlainObject(values))) {
        console.error('Expected plain object. Received', values);
        throw new Error(`Expected plain object. Check the console.`);
      }
      console.log('values', values);
      console.log('formikValuesRef.current', formikValuesRef.current);
      const valuesToSave = values || formikValuesRef.current;
      if (areFormikValuesEqual(valuesToSave, lastValuesModifiedByUsRef.current)) {
        console.log('This change was created by us. Saving aborted.');
        return; // This change was created by us. Saving aborted.
      }
      const currentCheckpoint = checkpoints[currentCheckpointIndexRef.current];
      if (areFormikValuesEqual(valuesToSave, currentCheckpoint)) {
        console.log('valuesToSave', valuesToSave);
        console.log('currentCheckpoint', currentCheckpoint);
        console.log('The state of the form has not changed. Nothing to do.')
        return; // The state of the form has not changed. Nothing to do.
      }
      console.log('valuesToSave', valuesToSave);
      checkpoints.push(valuesToSave);
      setDebugCheckpoints([...checkpoints]);
      console.log('checkPoints', checkpoints);
      currentCheckpointIndexRef.current++;
      setDebugCurrentCheckpointIndex(val => val + 1);
    },
    [formikValuesRef, checkpoints, currentCheckpointIndexRef],
  );

  const revertToCheckpoint = useCallback(
    (checkpointIndex: number) => {
      currentCheckpointIndexRef.current = checkpointIndex;
      const checkpoint = checkpoints[checkpointIndex];
      lastValuesModifiedByUsRef.current = checkpoint;
      setDebugCurrentCheckpointIndex(checkpointIndex);
      setFormikValues(checkpoint);
    },
    [setFormikValues],
  );

  const undoTo = useCallback(
    (targetCheckpointIndex: number) => {
      if (targetCheckpointIndex < 0) {
        console.warn(`impossible undo: targetCheckpointIndex ${targetCheckpointIndex} out of bounds`);
        return;
      }
      const currentCheckpoint = checkpoints[currentCheckpointIndexRef.current];
      const valuesChangedSinceTargetCheckpoint = !areFormikValuesEqual(formikValuesRef.current, currentCheckpoint);
      if (valuesChangedSinceTargetCheckpoint) {
        // Values have been changed by user.
        checkpoints.push(formikValuesRef.current); // save the current value (in case we need to redo later).
        setDebugCheckpoints([...checkpoints]);
        revertToCheckpoint(targetCheckpointIndex); // And revert to the current checkpoint.
      } else {
        // Values haven't been changed since current checkpoint. Therefore we need to go back in history.
        revertToCheckpoint(targetCheckpointIndex);
      }
    },
    [revertToCheckpoint, checkpoints, formikValuesRef],
  );

  const reset = useCallback(
    () => {
      undoTo(0);
    },
    [undoTo],
  );

  const undoOnce = useCallback(
    () => {
      undoTo(currentCheckpointIndexRef.current - 1);
    },
    [undoTo, currentCheckpointIndexRef],
  );

  const redo = useCallback(
    () => {
      if (currentCheckpointIndexRef.current === checkpoints.length - 1) {
        console.warn(`impossible redo: targetCheckpointIndex ${currentCheckpointIndexRef.current} out of bounds`);
        return;
      }
      revertToCheckpoint(currentCheckpointIndexRef.current + 1);
    },
    [revertToCheckpoint, checkpoints, currentCheckpointIndexRef],
  );


  const mutatedCheckpointsIfChanged = !isEqual(checkpoints, debugCheckpoints)
    ? [...checkpoints]
    : checkpoints;

  console.log('mutatedCheckpointsIfChanged', mutatedCheckpointsIfChanged);
  useEffect(() => {
    setDebugCheckpoints(mutatedCheckpointsIfChanged);
  }, [mutatedCheckpointsIfChanged]);

  const context = useMemo(
    () => ({ saveCheckpoint, undo: undoOnce, reset, redo, undoableCount, redoableCount, checkpoints: debugCheckpoints, currentCheckpointIndex: debugCurrentCheckpointIndex }),
    [saveCheckpoint, undoOnce, reset, redo, undoableCount, redoableCount, debugCheckpoints, debugCurrentCheckpointIndex ]
  );

  return (
    <reactContext.Provider value={context}>
      {children}
    </reactContext.Provider>
  );
};
