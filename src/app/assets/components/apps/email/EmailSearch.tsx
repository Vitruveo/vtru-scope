import React from "react";
import Box from "@mui/material/Box";
import Fab from "@mui/material/Fab";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { IconMenu2, IconSearch } from "@tabler/icons-react";

interface Props {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}

const EmailSearch = ({ onClick }: Props) => {
  const searchTerm = "";

  return (
    <Box display="flex" sx={{ p: 2 }}>
      {/* ------------------------------------------- */}
      {/* Button toggle sidebar when lgdown */}
      {/* ------------------------------------------- */}
      <Fab
        onClick={onClick}
        color="primary"
        size="small"
        sx={{
          mr: 1,
          flexShrink: "0",
          display: { xs: "block", lineHeight: "10px", lg: "none" },
        }}
      >
        <IconMenu2 width="16" />
      </Fab>
      {/* ------------------------------------------- */}
      {/* Search */}
      {/* ------------------------------------------- */}
      <TextField
        id="outlined-basic"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconSearch size={"16"} />
            </InputAdornment>
          ),
        }}
        fullWidth
        size="small"
        value={searchTerm}
        placeholder="Search emails"
        variant="outlined"
        onChange={(e) => {}}
      />
    </Box>
  );
};

export default EmailSearch;
