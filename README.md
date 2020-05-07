# Formik Undo

Provide the ability to undo / redo modifications in a Formik form.


![screenshot](https://github.com/OoDeLally/formik-undo/blob/master/demo/formik-undo.gif)



## Setup

```bash
npm install --save formik-undo
```


```ts
import { ClipboardListField } from 'formik-undo';

const createRows = (value) => {
  return [
    value,
    `ObjectId("${value})"`,
  ];
}

export const UserEdit = (props) => (
  <Edit {...props}>
    <SimpleForm>
      ...
      <ClipboardListField source="id" iconPosition="left" createRows={createRows} />
      ...
    </SimpleForm>
  </Edit>
);

```

## Props


| Name           | Type                        |  Optional  | Default   | Description                                     |
| ---------------|-----------------------------|------------|-----------|-------------------------------------------------|
| `source`       | string                      |            |           | Value path, lodash `get()` style.               |
| `createRows`   | `(value: any) => string[]`  |            |           | Create the possible forms from the given value. |
| `iconPosition` | `"left"` `"right"` `"none"` |  Optional  | `"right"` | Icon position in relation to the field.         |



## Run the demo

```bash

git clone https://github.com/OoDeLally/formik-undo.git
cd formik-undo
npm install
npm run demo-install
npm run demo
```
