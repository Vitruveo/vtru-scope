
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
    <Box bgcolor={item.key.indexOf('stake') > -1 ? "info.light" : "secondary.main"} textAlign="center" style={item.key.indexOf('stake') > -1 ? {width: '18.5%'}: {}}>
      <CardContent px={1} style={{padding: '15px', marginBottom: '10px', height: '110px'}}>
          

          <Typography
            color={item.key.indexOf('stake') > -1 ? "info.main" : "grey.900"}
            variant="h1"
            fontWeight={600}
          >
              <input type="number" value={value} onChange={handleEdit} style={{ textAlign: 'center', padding: '2px', fontSize: '18px', width: '80%', fontFamily: 'monospace'}} /> 
              {/* <span onClick={handleReset} style={{cursor: 'pointer', fontSize: '18px'}}>&#9851;</span> */}
          </Typography>

          <Typography
              color={item.key.indexOf('stake') > -1 ? "info.main" : "grey.900"}
              variant="h5"
              fontWeight={600}
              style={{marginTop: '5px'}}
            >
              {item.title} 
          </Typography>

      </CardContent>
    </Box>
      )
  }

export default InputCard;
