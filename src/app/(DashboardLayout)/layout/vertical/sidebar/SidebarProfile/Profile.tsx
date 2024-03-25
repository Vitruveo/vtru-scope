import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useSelector } from '@/store/hooks';
import { IconPower } from '@tabler/icons-react';
import { AppState } from '@/store/store';
import Link from 'next/link';

export const Profile = () => {
  const customizer = useSelector((state: AppState) => state.customizer);
  const lgUp = useMediaQuery((theme: any) => theme.breakpoints.up('lg'));
  const hideMenu = lgUp ? customizer.isCollapse && !customizer.isSidebarHover : '';

  return (
    <Box
      display={'flex'}
      alignItems="center"
      gap={2}
      sx={{ m: 3, p: 1 }}
    >
      {!hideMenu ? (
        <>

          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center"}} px={0}>
            <Typography>v0.66 beta</Typography>
            <img src="/images/logo.png" style={{marginLeft: '10px', width: '120px'}} />
          </Box>
        </>
      ) : (
        ''
      )}
    </Box>
  );
};
