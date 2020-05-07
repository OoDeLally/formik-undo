import { createStyles, CssBaseline, makeStyles, Paper, TextField, Theme } from '@material-ui/core';
import { Field, Form, Formik, useFormikContext } from 'formik';
import { FormikUndoContextProvider, FormikUndoControl } from 'formik-undo';
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
  }),
);



const MyForm = () => {
  const { values } = useFormikContext<Article>();
  console.log('values', values);
  return (
    <Form>
      <FormikUndoContextProvider>
        {/* <MaterialFormikUndoControl /> */}
        {/* <FormikUndoControl /> */}
        <Field as={TextField} name="title" />
        <Field as={TextField} name="content" />
      </FormikUndoContextProvider>
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
          <MyForm />
        </Formik>
      </Paper>
    </>
  );
};

export default App;
