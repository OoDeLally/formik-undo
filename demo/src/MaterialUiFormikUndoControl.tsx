import { IconButton } from '@material-ui/core';
import RedoIcon from '@material-ui/icons/Redo';
import ResetIcon from '@material-ui/icons/Replay';
import UndoIcon from '@material-ui/icons/Undo';
import { FormikUndoControl, FormikUndoControlProps } from 'formik-undo';
import React, { useMemo } from 'react';


type ButtonKind = 'reset' | 'undo' | 'redo';


const defaultButtonIcons: Record<ButtonKind, React.ComponentType> = {
  reset: ResetIcon,
  undo: UndoIcon,
  redo: RedoIcon,
};


export const MaterialFormikUndoControl = ({ buttonIcons, ...props }: FormikUndoControlProps) => {
  const icons = useMemo(() => ({ ...defaultButtonIcons, ...buttonIcons }), [buttonIcons]);
  return (
    <FormikUndoControl buttonIcons={icons} buttonComponent={IconButton} {...props} />
  );
};
