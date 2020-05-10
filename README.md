# Formik Undo

Provide the ability to undo / redo modifications in a Formik form.

Uses Typescript and React hooks.


![screenshot](https://github.com/OoDeLally/formik-undo/blob/master/demo/formik-undo.gif)


Online Demo: https://codesandbox.io/s/github/OoDeLally/formik-undo-demo


## Setup

```bash
npm install --save formik-undo
```


```tsx
import { FormikUndoContextProvider } from 'formik-undo';

const App = () => {
  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
    >
      <FormikUndoContextProvider>
        <MyForm />
      </FormikUndoContextProvider>
    </Formik>
  );
};
```


## Usage

```tsx
import { useFormikUndo } from 'formik-undo';

const MyComponent = () => {
  const { reset, undo, redo, saveCheckpoint } = useFormikUndo();
  // Do stuff
  return (
    <div>
      ...
    </div>
  );
};
```

| Name                       | Type         | Description                                                    |
| ---------------------------|--------------|----------------------------------------------------------------|
| `reset`                    | `() => void` | Reset the form to the initial values.                          |
| `undo`                     | `() => void` | Undo to previous checkpoint.                                   |
| `redo`                     | `() => void` | Redo to next checkpoint.                                       |
| `saveCheckpoint`           | `() => void` | Save a checkpoint to the history.                              |
| `undoableCount`            | `number`     | Number of possible undo actions.                               |
| `redoableCount`            | `number`     | Number of possible redo actions.                               |
| `didCreateCurrentValues`   | `boolean`    | Whether the latest form's values were set by us (advanced).    |



## AutoSave

By default, `formik-undo` does *not* save automatically. Since forms come in all shapes, it is your responsibility to decide when to save, by using the `saveCheckpoint()` function at appropriate times.

However for convenience a `useFormikUndoAutoSave()` hook is provided and will do an ok-job. It does _not_ take in account the semantic of the data (PRs are welcome!).


```tsx
import { useFormikUndoAutoSave } from 'formik-undo';

const autoSaveOptions = {
  throttleDelay: 10000,
};

const MyForm = () => {
  useFormikUndoAutoSave(autoSaveOptions);
  return (
    <Form>
      ...
    </Form>
  )
};
```

`useFormikUndoAutoSave(options)` options are the following:

| Name                 | Type       | Default | Description                                                                    |
| ---------------------|------------|---------|--------------------------------------------------------------------------------|
| `enabled`            | `boolean`  | `true`  | If false, this hook does nothing.                                              |
| `throttleDelay`      | `number`   | 2000    | Frequency of autosaving in millisecond.<br>If `0`, save at every modification. |
| `saveOnFieldChange`  | `boolean`  | `true`  | If ``true``, save a checkpoint everytime the modified field is different from the previously modified. This is useful to save the final value of a input after the user moves to another input.<br>If `false`, only the whole formik `values` object is considered and different fields changes may be aggregated from one checkpoint to another. |



## Undo Control buttons

A control bar with default buttons is provided (as seen on the screenshot above).

```tsx
import { FormikUndoControl } from 'formik-undo';

const MyForm = () => {
  return (
    <Form>
      <FormikUndoControl />
      <input name="foo" />
      <input name="bar" />
    </Form>
  )
};
```

`<FormikUndoControl>` accepts props:

| Name                       | Type                                                    | Default                       | Description                                   |
| ---------------------------|---------------------------------------------------------|-------------------------------|-----------------------------------------------|
| `showReset`                | `boolean`                                               | `true`                        | Show the `reset` button.                      |
| `showRedo`                 | `boolean`                                               | `true`                        | Show the `redo` button.                       |
| `disabled`                 | `boolean`                                               | `false`                       | Disable every control.                        |
| `className`                | `string`                                                |                               | Add extra classes to the control container.   |
| `buttonTitles`             | `Record<('reset' \| 'undo' \| 'redo'), string \| null>` | `"Reset"`, `"Undo"`, `"Redo"` | Override the `title` attribute of the button. |
| `buttonClasses`            | `Record<('reset' \| 'undo' \| 'redo'), string>`         | `{}`                          | Add extra classes to some of the buttons.     |
| `buttonIcons`              | `Record<('reset' \| 'undo' \| 'redo'), ComponentType>`  |  `"↺"`, `"↶"`, `"↷"`          | Override the buttons' content.                |
| `buttonComponent`          | `ComponentType`                                         | <button>                      | Override the buttons' component.              |



`formik-undo` has minimal dependencies.

If you use `Material-UI`, you can use a wrapper that prettifies the `FormikUndoControl`:

https://github.com/OoDeLally/formik-undo/blob/master/helpers/MaterialUiFormikUndoControl.tsx

(Add the file into your project).
