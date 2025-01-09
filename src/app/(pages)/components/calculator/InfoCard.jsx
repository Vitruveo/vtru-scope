
import React, { useRef } from "react";
import {
  Typography,
  Box,
  CardContent,
} from '@mui/material';

const formatCurrency = (amount) => {
  amount = amount ?? 0;
    return Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
}

const InfoCard = ({ value, title }) => {


  return (
    <Box bgcolor={"secondary.main"} textAlign="center" style={{width: '18.5%'}}>
      <CardContent px={1}>
          

          <Typography
            color={"grey.900"}
            variant="h3"
            fontWeight={600}
          >
              {formatCurrency(value)}
          </Typography>

          <Typography
              color={"grey.900"}
              variant="h2"
              fontWeight={600}
              fontSize={14}
              style={{marginTop: '5px'}}
            >
              {title.split('\n')[0]}
              {title.split('\n').length > 1 ? <br /> : <></>}
              {title.split('\n').length > 1 ? title.split('\n')[1] : ''} 
          </Typography>

      </CardContent>
    </Box>
      )
  }

export default InfoCard;
