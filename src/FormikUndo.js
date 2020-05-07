var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
import { useFormikContext } from 'formik';
import React, { useCallback, useContext, useMemo, useRef } from 'react';
import { useStateAndRef, useValueRef } from './hooks';
var reactContext = React.createContext(null);
export var useFormikUndo = function () {
    var formikUndoContext = useContext(reactContext);
    if (!formikUndoContext) {
        throw new Error('FormikUndo context not found. ' +
            'Make sure you call useFormikUndoAutoSave() is inside a FormikUndo context.');
    }
    return formikUndoContext;
};
export var FormikUndoContextProvider = function (_a) {
    var children = _a.children;
    var formikContext = useFormikContext();
    if (!formikContext) {
        throw new Error('Formik context not found. ' +
            'Make sure you use <FormikUndoContextProvider/> inside a Formik context.');
    }
    var formikValues = formikContext.values, setFormikValues = formikContext.setValues, formikInitialValues = formikContext.initialValues;
    var formikValuesRef = useValueRef(formikValues);
    var checkPoints = useRef([formikInitialValues]).current;
    var _b = __read(useStateAndRef(0), 3), currentCheckpointIndex = _b[0], currentCheckpointIndexRef = _b[1], setCurrentCheckpointIndex = _b[2];
    var lastModifiedValuesRef = useRef();
    var undoableCount = currentCheckpointIndex;
    var redoableCount = checkPoints.length - currentCheckpointIndex - 1;
    var saveCheckpoint = useCallback(function () {
        if (formikValuesRef.current === lastModifiedValuesRef.current) {
            return; // This change was created by us. Saving aborted.
        }
        checkPoints.splice(currentCheckpointIndexRef.current + 1, checkPoints.length, // Remove all checkpoints after current position.
        formikValuesRef.current);
        setCurrentCheckpointIndex(function (index) { return index + 1; });
    }, [formikValuesRef, checkPoints, currentCheckpointIndexRef, setCurrentCheckpointIndex]);
    var setNewFormikValue = useCallback(function (newValues) {
        lastModifiedValuesRef.current = newValues;
        setFormikValues(newValues);
    }, [setFormikValues]);
    var reset = useCallback(function () {
        if (currentCheckpointIndexRef.current === 0) {
            return; // Nothing to undo.
        }
        setCurrentCheckpointIndex(0);
        setNewFormikValue(checkPoints[0]);
    }, [setNewFormikValue, checkPoints, setCurrentCheckpointIndex, currentCheckpointIndexRef]);
    var undo = useCallback(function () {
        if (currentCheckpointIndexRef.current === 0) {
            return; // Nothing to undo.
        }
        var checkpoint = checkPoints[currentCheckpointIndexRef.current - 1];
        setNewFormikValue(checkpoint);
        setCurrentCheckpointIndex(function (index) { return index - 1; });
    }, [setNewFormikValue, checkPoints, currentCheckpointIndexRef, setCurrentCheckpointIndex]);
    var redo = useCallback(function () {
        if (currentCheckpointIndexRef.current === checkPoints.length - 1) {
            return; // Nothing to redo.
        }
        var checkpoint = checkPoints[currentCheckpointIndexRef.current + 1];
        setCurrentCheckpointIndex(function (index) { return index + 1; });
        setNewFormikValue(checkpoint);
    }, [setNewFormikValue, checkPoints, currentCheckpointIndexRef, setCurrentCheckpointIndex]);
    var context = useMemo(function () { return ({ saveCheckpoint: saveCheckpoint, undo: undo, reset: reset, redo: redo, undoableCount: undoableCount, redoableCount: redoableCount }); }, [saveCheckpoint, undo, reset, redo, undoableCount, redoableCount]);
    return (React.createElement(reactContext.Provider, { value: context }, children));
};
