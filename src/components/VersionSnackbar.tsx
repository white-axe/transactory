import React from 'react';
import {
  Snackbar,
  Typography,
} from '@mui/material';

const Component: React.FC<{
  className?: string;
}> = ({
  className = '',
}) => {
  return <>
    {process.env.REACT_APP_GIT_STATUS?.trim().length !== 0 ? null :
      <Snackbar open={true} anchorOrigin={{vertical: 'bottom', horizontal: 'right'}} className={'transactory-VersionSnackbar ' + className}>
        <Typography variant="overline">
          Version:
          <br />
          {process.env.REACT_APP_GIT_HASH?.trim()}
        </Typography>
      </Snackbar>
    }
  </>;
};

export default Component;
