/* eslint-disable react/display-name */
import React from 'react';
import { useFormikUndo } from './FormikUndoProvider';


type ButtonKind = 'reset' | 'undo' | 'redo';


export interface FormikUndoControlProps {
  showReset?: boolean;
  showRedo?: boolean;
  disabled?: boolean;
  buttonTitles?: Partial<Record<ButtonKind, string | null>>;
  buttonClasses?: Partial<Record<ButtonKind, string>>;
  className?: string;
  buttonIcons?: Partial<Record<ButtonKind, React.ComponentType>>;
  buttonComponent?: React.ComponentType;
}


const defaultTitles: Record<ButtonKind, string> = {
  reset: 'Reset',
  undo: 'Undo',
  redo: 'Redo',
};

const defaultIcon: Record<ButtonKind, React.ComponentType> = {
  reset: () => <>↺</>,
  undo: () => <>↶</>,
  redo: () => <>↷</>,
};


const DefaultButton = (props: any) => {
  return (
    <button type="button" {...props} />
  );
};


const rootStyle = {
  display: 'flex',
};


export const FormikUndoControl = ({
  disabled, showReset, showRedo, buttonTitles, buttonClasses, className, buttonIcons, buttonComponent
}: FormikUndoControlProps) => {

  const { reset, undo, redo, undoableCount, redoableCount } = useFormikUndo();

  const handleClickByKind = { reset, undo, redo };

  const disabledByKind = {
    reset: undoableCount === 0,
    undo: undoableCount === 0,
    redo: redoableCount === 0,
  };

  const kindsToShow: ButtonKind[] = [
    ...(showReset === false ? [] : ['reset' as ButtonKind]),
    'undo',
    ...(showRedo === false ? [] : ['redo' as ButtonKind]),
  ];

  const ButtonComponent: React.ComponentType<any> = buttonComponent || DefaultButton;

  return (
    <div className={className} style={rootStyle}>
      {
        kindsToShow.map(kind => {
          const title = buttonTitles?.[kind];
          const Icon = buttonIcons?.[kind] || defaultIcon[kind] as React.ComponentType;
          return (
            <ButtonComponent
              key={kind}
              onClick={handleClickByKind[kind]}
              disabled={disabled || disabledByKind[kind]}
              title={title === null ? undefined : (title || defaultTitles[kind])}
              className={buttonClasses?.[kind]}
            >
              <Icon />
            </ButtonComponent>
          );
        })
      }
    </div>
  );
};
