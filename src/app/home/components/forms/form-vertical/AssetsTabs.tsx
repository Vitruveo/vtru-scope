import React from 'react';
import { Box, Button, Grid, IconButton, InputAdornment, MenuItem, Stack, Tab, Typography } from '@mui/material';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';

// components
import BlankCard from '../../shared/BlankCard';
import CustomFormLabel from '../theme-elements/CustomFormLabel';
import CustomSelect from '../theme-elements/CustomSelect';
import CustomTextField from '../theme-elements/CustomTextField';
import CustomOutlinedInput from '../theme-elements/CustomOutlinedInput';
import { IconEye, IconEyeOff } from '@tabler/icons-react';

const countries = [
  {
    value: 'india',
    label: 'India',
  },
  {
    value: 'uk',
    label: 'United Kingdom',
  },
  {
    value: 'srilanka',
    label: 'Srilanka',
  },
];

const lang = [
  {
    value: 'en',
    label: 'English',
  },
  {
    value: 'fr',
    label: 'French',
  },
];

const FormTabs = () => {
  const [value, setValue] = React.useState('1');

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  //   country
  const [country, setCountry] = React.useState('');

  const handleChange2 = (event: any) => {
    setCountry(event.target.value);
  };

  //   language
  const [language, setLanguage] = React.useState('en');

  const handleChange3 = (event: any) => {
    setLanguage(event.target.value);
  };

  //   password
  //
  const [showPassword, setShowPassword] = React.useState(false);

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  //   confirm password
  //
  const [showPassword2, setShowPassword2] = React.useState(false);

  const handleClickShowPassword2 = () => setShowPassword2((show) => !show);

  const handleMouseDownPassword2 = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  return (
    <div>
      {/* ------------------------------------------------------------------------------------------------ */}
      {/* Basic Layout */}
      {/* ------------------------------------------------------------------------------------------------ */}
      <BlankCard>
        <TabContext value={value}>
          <Box sx={{ borderBottom: 1, borderColor: (theme: any) => theme.palette.divider }}>
            <TabList onChange={handleChange} aria-label="lab API tabs example">
              <Tab label="Coins (Vesting)" value="1" />
              <Tab label="Perks" value="2" disabled/>
              <Tab label="Revenue Share" value="3" disabled/>
              <Tab label="Governance" value="4" disabled/>
            </TabList>
          </Box>
          <TabPanel value="1">
            <Typography variant="p" sx={{ margin: '20px 20px', display: 'block' }}>{'Vesting and coin information.'}</Typography>
            <Button variant="outlined" size='large'>Claim</Button>

          </TabPanel>
          <TabPanel value="2">
         
          </TabPanel>
          <TabPanel value="3">
          
          </TabPanel>
          <TabPanel value="4">
          
          </TabPanel>
        </TabContext>
      </BlankCard>
    </div>
  );
};

export default FormTabs;
