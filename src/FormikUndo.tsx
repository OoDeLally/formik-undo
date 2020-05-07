import { useFormikContext } from 'formik';
import React, { ReactNode, useCallback, useContext, useMemo, useRef } from 'react';
import { useStateAndRef, useValueRef } from './hooks';


interface FormikUndo {
  saveCheckpoint: () => void;
  reset: () => void;
  undo: () => void;
  redo: () => void;
  undoableCount: number;
  redoableCount: number;
}


const reactContext = React.createContext<FormikUndo>(null!);


export const useFormikUndo = (): FormikUndo => {
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
  const {
    values: formikValues, setValues: setFormikValues, initialValues: formikInitialValues
  } = useFormikContext<Values>();
  const formikValuesRef = useValueRef(formikValues);
  const checkPoints = useRef<Values[]>([formikInitialValues]).current;
  const [currentCheckpointIndex, currentCheckpointIndexRef, setCurrentCheckpointIndex] = useStateAndRef(0);
  const lastModifiedValuesRef = useRef<Values | undefined>();

  const undoableCount = currentCheckpointIndex;
  const redoableCount = checkPoints.length - currentCheckpointIndex - 1;

  const saveCheckpoint = useCallback(
    () => {
      if (formikValuesRef.current === lastModifiedValuesRef.current) {
        return; // This change was created by us. Saving aborted.
      }
      checkPoints.splice(
        currentCheckpointIndexRef.current + 1,
        checkPoints.length, // Remove all history after current position.
        formikValuesRef.current,
      );
      setCurrentCheckpointIndex(index => index + 1);
    },
    [formikValuesRef, checkPoints, currentCheckpointIndexRef, setCurrentCheckpointIndex],
  );

  const setNewFormikValue = useCallback(
    (newValues: Values) => {
      lastModifiedValuesRef.current = newValues;
      setFormikValues(newValues);
    },
    [setFormikValues],
  );

  const reset = useCallback(
    () => {
      if (currentCheckpointIndexRef.current === 0) {
        return; // Nothing to undo.
      }
      setCurrentCheckpointIndex(0);
      setNewFormikValue(checkPoints[0]);
    },
    [setNewFormikValue, checkPoints, setCurrentCheckpointIndex, currentCheckpointIndexRef],
  );

  const undo = useCallback(
    () => {
      if (currentCheckpointIndexRef.current === 0) {
        return; // Nothing to undo.
      }
      const checkpoint = checkPoints[currentCheckpointIndexRef.current - 1];
      setNewFormikValue(checkpoint);
      setCurrentCheckpointIndex(index => index - 1);
    },
    [setNewFormikValue, checkPoints, currentCheckpointIndexRef, setCurrentCheckpointIndex],
  );

  const redo = useCallback(
    () => {
      if (currentCheckpointIndexRef.current === checkPoints.length - 1) {
        return; // Nothing to redo.
      }
      const checkpoint = checkPoints[currentCheckpointIndexRef.current + 1];
      setCurrentCheckpointIndex(index => index + 1);
      setNewFormikValue(checkpoint);
    },
    [setNewFormikValue, checkPoints, currentCheckpointIndexRef, setCurrentCheckpointIndex],
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
