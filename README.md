# Formik Undo

Provide the ability to undo / redo modifications in a Formik form.

Uses Typescript and React hooks.


![screenshot](https://github.com/OoDeLally/formik-undo/blob/master/extras/formik-undo.gif)


Online Demo: https://codesandbox.io/s/github/OoDeLally/formik-undo-demo


## Setup

```bash
npm install --save formik-undo
```


```tsx
import { FormikUndo } from 'formik-undo';

const autoSaveOptions = {
  throttleDelay: 10000,
};

const App = () => {
  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
    >
      <FormikUndo autoSave={autoSaveOptions}>
        <MyForm />
      </FormikUndo>
    </Formik>
  );
};
```

Provider's props are as follow:

| Name                         | Type                           | Default | Description                                                                    |
| -----------------------------|--------------------------------|---------|--------------------------------------------------------------------------------|
| `autoSave`                   | `boolean`  \| `{ ...options }` | `true`  | If `false`, does not autosave<br>If `true`, autosave with the default options<br>If `object` autosave with the provided options. |
| `autoSave.throttleDelay`     | `number`                       | 2000    | Frequency of autosaving in millisecond.<br>If `0`, save at every modification. |
| `autoSave.saveOnFieldChange` | `boolean`                      | `true`  | If ``true``, save a checkpoint everytime the modified field is different from the previously modified. This is useful to save the final value of a input after the user moves to another input.<br>If `false`, only the whole formik `values` object is considered and different fields changes may be aggregated from one checkpoint to another. |
| `autoSave.preventWordCutting`| `boolean`                      | `true`  | If ``true``, when editing a string value, don't save in the middle a a word (experimental).  |


Autosave does _not_ take in account the semantic of the data (PRs are welcome!).



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

| Name                         | Type                          | Description                                                    |
| ---------------------------  |-------------------------------|----------------------------------------------------------------|
| `reset`                      | `() => void`                  | Reset the form to the initial values.                          |
| `undo`                       | `() => void`                  | Undo to previous checkpoint.                                   |
| `redo`                       | `() => void`                  | Redo to next checkpoint.                                       |
| `saveCheckpoint`             | `() => void`                  | Save a checkpoint to the history.                              |
| `addCheckpointEquivalent`    | `(targetValue: Values, equivalentValue: Values) => void` | Declare that a certain value is equivalent to another, and therefore does not constitute a change worth saving (advanced).  |
| `undoableCount`              | `number`                      | Number of possible undo actions.                               |
| `redoableCount`              | `number`                      | Number of possible redo actions.                               |
| `didCreateCurrentValues`     | `boolean`                     | Whether the latest form's values were set by us (advanced).    |



## Control bar

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

https://github.com/OoDeLally/formik-undo/blob/master/extras/MaterialUiFormikUndoControl.tsx

(Add the file into your project).
