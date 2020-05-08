import { createStyles, CssBaseline, makeStyles, Paper, TextField, Theme } from '@material-ui/core';
import { Field, Form, Formik } from 'formik'; // Using formik-undo's  formik module one folder up.
import { FormikUndoContextProvider, FormikUndoControl, useFormikUndoAutoSave } from 'formik-undo';
import React from 'react';
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
      margin: theme.spacing(2),
      padding: theme.spacing(2),
    },
    undoControlBar: {
      display: 'flex',
      marginBottom: theme.spacing(4),
    },
    undoControlBarTitle: {
      display: 'block',
      width: '20em',
    },
  }),
);



const MyForm = () => {
  const classes = useStyles();
  useFormikUndoAutoSave(1000, 1000);
  return (
    <Form>
      <div className={classes.undoControlBar}>
        <div className={classes.undoControlBarTitle}>Material UI</div>
        <MaterialFormikUndoControl />
      </div>
      <div className={classes.undoControlBar}>
        <div className={classes.undoControlBarTitle}>Vanilla elements</div>
        <FormikUndoControl />
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
    <>
      <CssBaseline />
      <Paper className={classes.root}>
        <Formik
          initialValues={initialValues}
          onSubmit={handleSubmit}
        >
          <FormikUndoContextProvider>
            <MyForm />
          </FormikUndoContextProvider>
        </Formik>
      </Paper>
    </>
  );
};

export default App;
