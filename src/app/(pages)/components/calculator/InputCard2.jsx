
import React, { useRef } from "react";
import {
  Typography,
  Box,
  CardContent,
} from '@mui/material';



const InputCard = ({ value, item }) => {

  const handleReset = () => {
      // Notify the parent component of the reset value
      if (item.defaultValue != null) {
        item.handleInputChange(item.key, item.defaultValue);
      }
  };

  const handleEdit = (e) => {
      // Notify the parent component of the changed value
      item.handleInputChange(item.key, Number(e.target.value));
  };

  return (
    <Box bgcolor={"info.light"} textAlign="center" style={{width: '24%'}}>
      <CardContent px={1} style={{padding: '20px', marginBottom: '10px', height: '110px'}}>
          

          <Typography
            color={"info.main"}
            variant="h1"
            fontWeight={600}
          >
              <input type="number" value={value} onChange={handleEdit} style={{ textAlign: 'center', padding: '2px', fontSize: '18px', width: '80%', fontFamily: 'monospace'}} /> 
          </Typography>

          <Typography
              color={"info.main"}
              variant="h5"
              fontWeight={600}
              fontSize={14}
              style={{marginTop: '5px'}}
            >
              {item.title.split('\n')[0]}
              {item.title.split('\n').length > 1 ? <br /> : <></>}
              {item.title.split('\n').length > 1 ? item.title.split('\n')[1] : ''} 
          </Typography>

      </CardContent>
    </Box>
      )
  }

export default InputCard;
