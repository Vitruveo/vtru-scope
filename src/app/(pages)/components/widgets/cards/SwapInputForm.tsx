import { Grid, InputAdornment, Button } from '@mui/material';
import CustomFormLabel from '../../forms/theme-elements/CustomFormLabel';
import CustomNumberField from '../../forms/theme-elements/CustomNumberField';
import CustomOutlinedInput from '../../forms/theme-elements/CustomOutlinedInput';
import React, { useEffect, useState, useRef } from "react";

const SwapInputForm = (props:any) => {
  
  const [vibeValues, setVibeValues] = useState([ 
                                                { vtru: 0, vibe: 0},   
                                                { vtru: 0, vibe: 0},   
                                                { vtru: 0, vibe: 0},   
                                                { vtru: 0, vibe: 0},   
                                                { vtru: 0, vibe: 0},   
                                                { vtru: 0, vibe: 0},   
                                              ]);
  const inputHandler = (index:any, value:any) => {    
    const displayInfo = props.onChange(props.locked, Number(index), Number(value), vibeValues[index]);
    vibeValues[index] = displayInfo;
    setVibeValues(vibeValues => [...vibeValues]);
  }

  const rowStyle = {marginBottom: '20px'};
  const vibeLabelStyle = {color: '#0FFF50', fontSize: '16px', display: 'block', lineHeight: '40px', marginLeft: '110px', marginTop: 0};  const ratioStyle = {marginLeft: '40px'};
  const periodStyle = {display: 'inline-block', width: '110px', fontSize: '18px'};

  const display = (index:any) => { return `${Number(vibeValues[index].vtru.toFixed(0)).toLocaleString()} VTRU = ${Number(vibeValues[index].vibe.toFixed(0)).toLocaleString()} VIBE`}
  return (
    <div>
      {/* ------------------------------------------------------------------------------------------------ */}
      {/* Basic Layout */}
      {/* ------------------------------------------------------------------------------------------------ */}
      <Grid container>
        
        <Grid item xs={12}>
          <h3 style={{color: 'grey'}}>Coming Soon</h3>
          {/* <span style={periodStyle}>Swap:</span>
          <CustomNumberField id="bl-1y" placeholder="0" onChange={(value:any) =>  inputHandler(0, value)}  /> */}
        </Grid>
      </Grid>
    </div>
  );
};

export default SwapInputForm;
