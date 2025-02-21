
import React, { useRef } from "react";
import {
  Typography,
  Box,
  CardContent,
} from '@mui/material';



const DenomCard = ({ value, item }) => {

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
    <Box bgcolor={item.key.indexOf('deposit') > -1 ? "info.light" : "secondary.main"} textAlign="center" style={{width: '13.5%'}}>
      <CardContent px={1} style={{padding: '5px', marginBottom: '10px', height: '100px'}}>
          

          <Typography
            color={item.key.indexOf('deposit') > -1 ? "info.main" : "grey.900"}
            variant="h1"
            fontWeight={600}
          >
              <input type="number" value={value} onChange={handleEdit} style={{ textAlign: 'center', padding: '2px', fontSize: '18px', width: '80%', fontFamily: 'monospace'}} /> 
              {/* <span onClick={handleReset} style={{cursor: 'pointer', fontSize: '18px'}}>&#9851;</span> */}
          </Typography>

          <Typography
              color={item.key.indexOf('deposit') > -1 ? "info.main" : "grey.900"}
              variant="h5"
              fontWeight={600}
              style={{marginTop: '5px'}}
            >
              {item.title} 
          </Typography>
          <Typography
              color={item.key.indexOf('deposit') > -1 ? "info.main" : "grey.700"}
              fontWeight={600}
              style={{fontSize: '16px'}}
            >
            x {item.defaultValue}
          </Typography>
          

      </CardContent>
    </Box>
      )
  }

export default DenomCard;
