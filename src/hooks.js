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
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
import { useCallback, useEffect, useRef, useState } from 'react';
/**
 * Constantly update the value without changing the ref.
 */
export var useValueRef = function (currentValue) {
    var ref = useRef(currentValue);
    ref.current = currentValue;
    return ref;
};
var isFunction = function (val) {
    return typeof val === 'function';
};
/**
 * Provide a state that triggers a re-render depending on which dependency is used.
 * `stateValue` and `valueRef.current` provide the same value.
 * However a dependency on `valueRef` will not trigger a re-render when the value changes.
 */
export var useStateAndRef = function (initialValue) {
    var _a = __read(useState(initialValue), 2), value = _a[0], setValue = _a[1];
    var ref = useRef(initialValue);
    var setValueAndRef = useCallback(function (setStateAction) {
        var newValue = isFunction(setStateAction) ? setStateAction(ref.current) : setStateAction;
        setValue(newValue);
        ref.current = newValue;
    }, [setValue, ref]);
    return [value, ref, setValueAndRef];
};
/**
 * Like a normal useEffect(), but skips as long as `depToMonitor` has not changed.
 */
export var useEffectAfterFirstChange = function (effect, depToMonitor, otherDeps) {
    var initialDepValueRef = useRef(depToMonitor);
    var effectRef = useValueRef(effect);
    useEffect(function () {
        if (depToMonitor !== initialDepValueRef.current) {
            initialDepValueRef.current = {}; // Set it to a unequalable value, so `effectRef` everytime after that.
            return effectRef.current();
        }
    }, __spread((otherDeps || []), [effectRef, depToMonitor, initialDepValueRef]));
};
export var useThrottledValue = function (latestValue, delay) {
    var _a = __read(useState(latestValue), 2), value = _a[0], setValue = _a[1];
    var isIdleRef = useRef(true);
    var latestKnownValueRef = useValueRef(latestValue);
    var timerRef = useRef();
    var restartTimer = useCallback(function () {
        isIdleRef.current = false;
        timerRef.current = setTimeout(function () {
            isIdleRef.current = true;
        }, delay);
    }, [delay]);
    useEffectAfterFirstChange(function () {
        latestKnownValueRef.current = latestValue;
        if (isIdleRef.current) {
            setValue(latestValue);
            restartTimer();
        }
    }, latestValue, [restartTimer]);
    useEffect(function () {
        return function () {
            if (timerRef.current) {
                clearTimeout(timerRef.current); // Clear the timer upon unmounting.
            }
        };
    }, []);
    return isIdleRef.current ? latestKnownValueRef.current : value;
};
export var useDebouncedValue = function (latestValue, delay) {
    var _a = __read(useState(latestValue), 2), value = _a[0], setValue = _a[1];
    var timerRef = useRef();
    var scheduleNewValue = useCallback(function (newValue) {
        timerRef.current = setTimeout(function () {
            setValue(newValue);
        }, delay);
    }, [delay]);
    useEffect(function () {
        scheduleNewValue(latestValue);
        return function () {
            if (timerRef.current) {
                clearTimeout(timerRef.current); // Clear the timer upon unmounting.
            }
        };
    }, [latestValue, scheduleNewValue]);
    return value;
};
