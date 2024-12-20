
import React, { useRef } from "react";
import {
  Typography,
  Box,
  CardContent,
} from '@mui/material';



const InputCard = ({ value, item }) => {

  const inputRef = useRef(null);

  const handleReset = () => {
    if (inputRef.current) {
      // Reset the input value to defaultValue
      inputRef.current.value = item.defaultValue;

      // Notify the parent component of the reset value
      item.handleInputChange({ target: { value: item.defaultValue } });
    }
  };

  return (
    <Box bgcolor={"secondary.main"} textAlign="center">
      <CardContent px={1} style={{padding: '15px', marginBottom: '10px', height: '110px'}}>
          

          <Typography
            color={"grey.900"}
            variant="h1"
            fontWeight={600}
          >
             <input type="number" disabled={true} ref={inputRef} value={value} onChange={item.handleInputChange} style={{ textAlign: 'center', padding: '2px', fontSize: '18px', width: '80%', fontFamily: 'monospace'}} /> <span onClick={handleReset} style={{cursor: 'pointer', fontSize: '18px'}}>&#9851;</span>
          </Typography>

          <Typography
              color={"grey.900"}
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
