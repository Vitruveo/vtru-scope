import React from "react";
import { Typography, Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";

type PageHeadingProps = {
  title: string;
  sx?: any;
};

const PageHeading: React.FC<PageHeadingProps> = ({ title, sx }: PageHeadingProps) => {
  // Access the theme object from Material-UI
  const theme = useTheme();

  // Get the text color from the theme
  const textColor = theme.palette.text.primary;

  return (
    <Box
      sx={{
        bgcolor: "#EFEAF7", // Light gray background
        color: textColor, // Text color
        padding: "20px", // Padding top and bottom
        textAlign: "left", // Center align text
        borderRadius: '10px',
        margin: "5px",
        ...sx, // Additional styles from props
      }}
    >
      <Typography variant="h4">{title}</Typography>
    </Box>
  );
};

export default PageHeading;
