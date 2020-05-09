import { useFormikContext, isObject } from 'formik';
import React, { ReactNode, useCallback, useContext, useMemo, useRef } from 'react';
import { useStateAndRef, useValueRef } from './hooks';
import { isPlainObject } from 'lodash';


interface FormikUndo<Values extends object> {
  saveCheckpoint: (values?: Values) => void;
  reset: () => void;
  undo: () => void;
  redo: () => void;
  undoableCount: number;
  redoableCount: number;
}


const reactContext = React.createContext<FormikUndo<any>>(null!);


export const useFormikUndo = <Values extends object>(): FormikUndo<Values> => {
  const formikUndoContext = useContext(reactContext);
  if (!formikUndoContext) {
    throw new Error(
      'FormikUndo context not found. ' +
      'Make sure you call useFormikUndoAutoSave() is inside a FormikUndo context.'
    );
  }
  return formikUndoContext;
};


interface FormikUndoContextProviderProps {
  children?: ReactNode;
}


export const FormikUndoContextProvider = <Values extends object>({
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
  const checkPoints = useRef<Values[]>([formikValues]).current;
  const currentCheckpointIndexRef = useRef(0);
  const lastValuesModifiedByUsRef = useRef<Values | undefined>();

  const currentCheckpoint = checkPoints[currentCheckpointIndexRef.current];
  console.log('formikValues', formikValues);
  console.log('currentCheckpointIndexRef.current', currentCheckpointIndexRef.current);
  console.log('currentCheckpoint', currentCheckpoint);
  const valuesChangedSinceCurrentCheckpoint = formikValues !== currentCheckpoint;
  const undoableCount = currentCheckpointIndexRef.current + (valuesChangedSinceCurrentCheckpoint ? 1 : 0);
  const redoableCount = valuesChangedSinceCurrentCheckpoint
    ? 0
    : checkPoints.length - currentCheckpointIndexRef.current - 1;


  const saveCheckpoint = useCallback(
    (values?: Values) => {
      if (!(values === undefined || isPlainObject(values))) {
        console.error('Expected plain object. Received', values);
        throw new Error(`Expected plain object. Check the console.`);
      }
      console.log('values', values);
      console.log('formikValuesRef.current', formikValuesRef.current);
      const valuesToSave = values || formikValuesRef.current;
      if (valuesToSave === lastValuesModifiedByUsRef.current) {
        return; // This change was created by us. Saving aborted.
      }
      const currentCheckpoint = checkPoints[currentCheckpointIndexRef.current];
      if (valuesToSave === currentCheckpoint) {
        return; // The state of the form has not changed. Nothing to do.
      }
      console.log('valuesToSave', valuesToSave);
      checkPoints.splice(
        currentCheckpointIndexRef.current + 1,
        checkPoints.length, // Remove all checkpoints after current position.
        valuesToSave,
      );
      console.log('checkPoints', checkPoints);
      currentCheckpointIndexRef.current++;
    },
    [formikValuesRef, checkPoints, currentCheckpointIndexRef],
  );

  const revertToCheckpoint = useCallback(
    (checkpointIndex: number) => {
      currentCheckpointIndexRef.current = checkpointIndex;
      const checkpoint = checkPoints[checkpointIndex];
      lastValuesModifiedByUsRef.current = checkpoint;
      setFormikValues(checkpoint);
    },
    [setFormikValues],
  );

  const reset = useCallback(
    () => {
      revertToCheckpoint(0);
    },
    [revertToCheckpoint, checkPoints, currentCheckpointIndexRef],
  );

  const undo = useCallback(
    () => {
      if (currentCheckpointIndexRef.current < 0) {
        console.warn('impossible undo: out of bounds');
        return;
      }
      const currentCheckpoint = checkPoints[currentCheckpointIndexRef.current];
      const valuesChangedSinceCurrentCheckpoint = formikValuesRef.current !== currentCheckpoint;
      if (valuesChangedSinceCurrentCheckpoint) {
        // Values have been changed by user.
        // We just need to revert to the current checkpoint.
        revertToCheckpoint(currentCheckpointIndexRef.current);
      } else {
        // Values haven't been changed. Therefore we need to go back in history.
        revertToCheckpoint(currentCheckpointIndexRef.current - 1);
      }
    },
    [revertToCheckpoint, checkPoints, currentCheckpointIndexRef, formikValuesRef],
  );

  const redo = useCallback(
    () => {
      if (currentCheckpointIndexRef.current === checkPoints.length - 1) {
        console.warn('impossible redo: out of bounds');
        return;
      }
      revertToCheckpoint(currentCheckpointIndexRef.current + 1);
    },
    [revertToCheckpoint, checkPoints, currentCheckpointIndexRef],
  );

  const context = useMemo(
    () => ({ saveCheckpoint, undo, reset, redo, undoableCount, redoableCount }),
    [saveCheckpoint, undo, reset, redo, undoableCount, redoableCount]
  );

  return (
    <reactContext.Provider value={context}>
      {children}
    </reactContext.Provider>
  );
};
