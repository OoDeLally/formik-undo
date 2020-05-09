import { useFormikContext } from 'formik';
import React, { ReactNode, useCallback, useContext, useMemo, useRef } from 'react';
import { useStateAndRef, useValueRef } from './hooks';


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
  const formikContext = useFormikContext<Values>();
  if (!formikContext) {
    throw new Error(
      'Formik context not found. Make sure that: \n' +
      '  1- you use <FormikUndoContextProvider> inside a <Formik> context.\n' +
      '  2- Your app and FormikUndoContextProvider are using the same Formik module instance.'
    );
  }
  const {
    values: formikValues, setValues: setFormikValues, initialValues: formikInitialValues
  } = formikContext;
  const formikValuesRef = useValueRef(formikValues);
  const checkPoints = useRef<Values[]>([formikInitialValues]).current;
  const [currentCheckpointIndex, currentCheckpointIndexRef, setCurrentCheckpointIndex] = useStateAndRef(0);
  const lastValuesModifiedByUsRef = useRef<Values | undefined>();

  const undoableCount = currentCheckpointIndex;
  const redoableCount = checkPoints.length - currentCheckpointIndex - 1;

  const saveCheckpoint = useCallback(
    (values?: Values) => {
      const valuesToSave = values || formikValuesRef.current;
      if (valuesToSave === lastValuesModifiedByUsRef.current) {
        return; // This change was created by us. Saving aborted.
      }
      const currentCheckpoint = checkPoints[currentCheckpointIndexRef.current];
      if (valuesToSave === currentCheckpoint) {
        return; // The state of the form has not changed. Nothing to do.
      }
      checkPoints.splice(
        currentCheckpointIndexRef.current + 1,
        checkPoints.length, // Remove all checkpoints after current position.
        valuesToSave,
      );
      setCurrentCheckpointIndex(index => index + 1);
    },
    [formikValuesRef, checkPoints, currentCheckpointIndexRef, setCurrentCheckpointIndex],
  );

  const setNewFormikValue = useCallback(
    (newValues: Values) => {
      lastValuesModifiedByUsRef.current = newValues;
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
