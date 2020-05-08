import { createStyles, CssBaseline, makeStyles, Paper, TextField, Theme, Button, Checkbox, FormControlLabel } from '@material-ui/core';
import { Field, Form, Formik } from 'formik'; // Using formik-undo's  formik module one folder up.
import { FormikUndoContextProvider, FormikUndoControl, useFormikUndoAutoSave, useFormikUndo } from 'formik-undo';
import React, { useState } from 'react';
import { MaterialFormikUndoControl } from './MaterialUiFormikUndoControl';



interface Article {
  title: string;
  content: string;
}


const initialValues = {
  title: 'My New Article',
  content: 'This is my brand new article',
};


export const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
    },
    main: {
      margin: theme.spacing(2),
      padding: theme.spacing(2),
      flex: '1',
    },
    sidebar: {
      margin: theme.spacing(2),
      padding: theme.spacing(2),
      flex: 0,
    },
    autoSaveControl: {
      display: 'flex',
      flexDirection: 'row',
      marginBottom: theme.spacing(4),
    },
    autoSaveControlField: {
      width: '5em',
    },
    undoableCounter: {
      width: '5em',
    },
    undoControlBar: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: theme.spacing(4),
    },
    undoControlBarTitle: {
      display: 'block',
      width: '20em',
    },
    vanillaControlBar: {
      margin: theme.spacing(1),
    }
  }),
);


const SaveCheckpointButton = () => {
  const { saveCheckpoint } = useFormikUndo();
  return (
    <Button
      variant="contained"
      size="small"
      onClick={saveCheckpoint}
      title="Create a checkpoint now in the undo history"
    >
      Manual Save
    </Button>
  );
};


const UndoableCounter = () => {
  const classes = useStyles();
  const { undoableCount } = useFormikUndo();
  return (
    <TextField
      className={classes.undoableCounter}
      type="number"
      disabled={true}
      label="Undoable Count"
      size="small"
      value={undoableCount}
    />
  );
};


const AutoSaveControl = () => {
  const classes = useStyles();
  const [enabled, setEnabled] = useState(true);
  const [throttleDelay, setThrottleDelay] = useState(2000);
  const [debounceDelay, setDebounceDelay] = useState(500);
  useFormikUndoAutoSave({ enabled, throttleDelay, debounceDelay });
  return (
    <div className={classes.autoSaveControl}>
      <FormControlLabel
        control={
          <Checkbox checked={enabled} onChange={(e, checked) => setEnabled(checked)} />
        }
        label="AutoSave"
      />
      <TextField
        className={classes.autoSaveControlField}
        type="number"
        label="Throttle"
        size="small"
        value={throttleDelay}
        onChange={
          (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => setThrottleDelay(+e.target.value)
        }
      />
    </div>
  );
};


const Sidebar = () => {
  const classes = useStyles();
  return (
    <>
      <AutoSaveControl />
      <SaveCheckpointButton />
      <UndoableCounter/>
    </>
  )
};



const MyForm = () => {
  const classes = useStyles();
  return (
    <Form>
      <div className={classes.undoControlBar}>
        <MaterialFormikUndoControl />
        <div>(or Vanilla elements</div>
        <FormikUndoControl className={classes.vanillaControlBar} />
        <div>)</div>
      </div>
      <Field as={TextField} name="title" />
      <Field as={TextField} name="content" />
    </Form>
  )
};


const App = () => {
  const classes = useStyles();

  const handleSubmit = (article: Article) => {
    //...
  };

  return (
    <div className={classes.root}>
      <CssBaseline />
        <Formik
          initialValues={initialValues}
          onSubmit={handleSubmit}
        >
          <FormikUndoContextProvider>
            <Paper className={classes.main}>
              <MyForm />
            </Paper>
            <Paper className={classes.sidebar}>
              <Sidebar />
            </Paper>
          </FormikUndoContextProvider>
        </Formik>
    </div>
  );
};

export default App;
