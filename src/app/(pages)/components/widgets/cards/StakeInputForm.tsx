import { Grid, InputAdornment, Button } from '@mui/material';
import CustomFormLabel from '../../forms/theme-elements/CustomFormLabel';
import CustomNumberField from '../../forms/theme-elements/CustomNumberField';
import CustomOutlinedInput from '../../forms/theme-elements/CustomOutlinedInput';
import React, { useEffect, useState, useRef } from "react";

const StakeInputForm = (props:any) => {
  
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
  const vibeLabelStyle = {color: '#0FFF50', fontSize: '16px', display: 'block', lineHeight: '40px', align: 'center', marginTop: 0};  const ratioStyle = {marginLeft: '40px'};
  const periodStyle = {display: 'inline-block', width: '180px', fontSize: '18px', marginBottom: '10px'};

  const display = (index:any) => { return `${Number(vibeValues[index].vtru.toFixed(0)).toLocaleString()} VTRU = ${Number(vibeValues[index].vibe.toFixed(0)).toLocaleString()} VIBE`}
  return (
    <div>
      {/* ------------------------------------------------------------------------------------------------ */}
      {/* Basic Layout */}
      {/* ------------------------------------------------------------------------------------------------ */}
      <Grid container>
        <Grid item xs={12} sm={12} md={6} lg={3}  style={rowStyle}>
          <span style={periodStyle}>5 Years (150/VIBE):</span>
          <CustomNumberField id="bl-5y" placeholder="0" onChange={(value:any) => inputHandler(5, value)}/>
          <h3 style={vibeLabelStyle}>{display(5)}</h3>
        </Grid>

        <Grid item xs={12} sm={12} md={6} lg={3} style={rowStyle}>
          <span style={periodStyle}>4 Years (200/VIBE):</span>
          <CustomNumberField id="bl-4y" placeholder="0" onChange={(value:any) =>  inputHandler(4, value)} />
          <h3 style={vibeLabelStyle}>{display(4)}</h3>
        </Grid>

        <Grid item xs={12} sm={12} md={6} lg={3}  style={rowStyle}>
          <span style={periodStyle}>3 Years (250/VIBE):</span>
          <CustomNumberField id="bl-3y" placeholder="0"  onChange={(value:any) =>  inputHandler(3, value)} />
          <h3 style={vibeLabelStyle}>{display(3)}</h3>
        </Grid>

        <Grid item xs={12} sm={12} md={6} lg={3}  style={rowStyle}>
          <span style={periodStyle}>2 Years (300/VIBE):</span>
          <CustomNumberField id="bl-2y" placeholder="0"  onChange={(value:any) =>  inputHandler(2, value)} />
          <h3 style={vibeLabelStyle}>{display(2)}</h3>
        </Grid>

      </Grid>
    </div>
  );
};

export default StakeInputForm;
