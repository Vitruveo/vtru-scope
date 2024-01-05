import * as React from 'react';
import Stack from '@mui/material/Stack';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertProps } from '@mui/material/Alert';

export interface CustomizedSnackbarState {
  type: '' | 'success' | 'info' | 'warning' | 'error';
  open: boolean;
  message: string;
}

interface CustomizedSnackbarProps extends CustomizedSnackbarState {
  setOpentate: React.Dispatch<React.SetStateAction<CustomizedSnackbarState>>;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function CustomizedSnackbar({ type, open, message, setOpentate }: CustomizedSnackbarProps) {
  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpentate({ open: false, type: '', message: '' });
  };

  return (
    <Stack spacing={2} sx={{ width: '100%' }}>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={open}
        autoHideDuration={4000}
        onClose={handleClose}>
        {!type || !type.length ? (
          <div />
        ) : (
          <Alert onClose={handleClose} severity={type} sx={{ width: '100%', color: 'white' }}>
            {message}
          </Alert>
        )}
      </Snackbar>
    </Stack>
  );
}
