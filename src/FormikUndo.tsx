import React, { ReactNode, useMemo } from 'react';
import { FormikUndoContextProvider } from './FormikUndoProvider';
import { AutoSaveOptions } from './types';
import { useFormikUndoAutoSave } from './useFormikUndoAutoSave';




const AutoSave = ({ options, children }: { options?: FormikUndoContextProviderProps['autoSave'], children: ReactNode }) => {
  const usedOptions = useMemo(
    () => options === true
    ? undefined // Use default options
    : options === false
      ? { enabled: false }
      : options,
    [options],
  );
  useFormikUndoAutoSave(usedOptions);
  return <>{children}</>;
};



interface FormikUndoContextProviderProps {
  autoSave?: boolean | AutoSaveOptions;
  children?: ReactNode;
}


export const FormikUndo = ({
  autoSave: autoSaveOptions, children
}: FormikUndoContextProviderProps) => {

  return (
    <FormikUndoContextProvider>
      <AutoSave options={autoSaveOptions}>
        {children}
      </AutoSave>
    </FormikUndoContextProvider>
  );
};
