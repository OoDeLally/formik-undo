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
import React from 'react';
import { useFormikUndo } from './FormikUndo';
var defaultTitles = {
    reset: 'Reset',
    undo: 'Undo',
    redo: 'Redo',
};
var defaultIcon = {
    reset: '↺',
    undo: '↶',
    redo: '↷',
};
var rootStyle = {
    display: 'flex',
};
export var FormikUndoControl = function (_a) {
    var disabled = _a.disabled, showReset = _a.showReset, showRedo = _a.showRedo, buttonTitles = _a.buttonTitles, buttonClasses = _a.buttonClasses, className = _a.className, buttonIcons = _a.buttonIcons, buttonComponent = _a.buttonComponent;
    var _b = useFormikUndo(), reset = _b.reset, undo = _b.undo, redo = _b.redo, undoableCount = _b.undoableCount, redoableCount = _b.redoableCount;
    var handleClickByKind = { reset: reset, undo: undo, redo: redo };
    var disabledByKind = {
        reset: undoableCount === 0,
        undo: undoableCount === 0,
        redo: redoableCount === 0,
    };
    var kindsToShow = __spread((showReset === false ? [] : ['reset']), [
        'undo'
    ], (showRedo === false ? [] : ['redo']));
    var ButtonComponent = buttonComponent || 'button';
    return (React.createElement("div", { className: className, style: rootStyle }, kindsToShow.map(function (kind) {
        var title = buttonTitles === null || buttonTitles === void 0 ? void 0 : buttonTitles[kind];
        var Icon = (buttonIcons === null || buttonIcons === void 0 ? void 0 : buttonIcons[kind]) || defaultIcon[kind];
        return (React.createElement(ButtonComponent, { key: kind, onClick: handleClickByKind[kind], disabled: disabled || disabledByKind[kind], title: title === null ? undefined : (title || defaultTitles[kind]), className: buttonClasses === null || buttonClasses === void 0 ? void 0 : buttonClasses[kind] },
            React.createElement(Icon, null)));
    })));
};
