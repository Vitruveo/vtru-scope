"use client";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import React from "react";

// components
import Breadcrumb from "@/app/home/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "../../components/container/PageContainer";
import CustomFormLabel from "../../components/forms/theme-elements/CustomFormLabel";
import CustomSelect from "../../components/forms/theme-elements/CustomSelect";
import CustomTextField from "../../components/forms/theme-elements/CustomTextField";
import BlankCard from "../../components/shared/BlankCard";

// images
import { Stack } from "@mui/system";

const BCrumb = [
  {
    to: "/home",
    title: "Home",
  },
  {
    title: "Profile",
  },
];

// locations
const locations = [
  {
    value: "us",
    label: "United States",
  },
  {
    value: "uk",
    label: "United Kingdom",
  },
  {
    value: "india",
    label: "India",
  },
  {
    value: "russia",
    label: "Russia",
  },
];

const languages = [
  {
    value: "english",
    label: "English (default)",
  },
];

export default function ProfileSettings() {
  const [location, setLocation] = React.useState("india");

  const handleChange1 = (event: any) => {
    setLocation(event.target.value);
  };

  const [language, setLanguage] = React.useState("english");

  const handleChange2 = (event: any) => {
    setLanguage(event.target.value);
  };

  return (
    <PageContainer
      title="Profile Settings"
      description="this is Account Settings"
    >
      <Breadcrumb title="Profile Settings" items={BCrumb} />
      <Grid container spacing={3}>
        {/* Change Profile */}
        <Grid item xs={12} lg={6}>
          <BlankCard>
            <CardContent>
              <Typography variant="h5" mb={1}>
                Change Profile
              </Typography>
              <Typography color="textSecondary" mb={3}>
                Change your profile picture from here
              </Typography>
              <Box textAlign="center" display="flex" justifyContent="center">
                <Box>
                  <Avatar
                    src={"/images/profile/user-1.jpg"}
                    alt={"user1"}
                    sx={{
                      width: 120,
                      height: 120,
                      margin: "0 auto",
                    }}
                  />
                  <Stack
                    direction="row"
                    justifyContent="center"
                    spacing={2}
                    my={3}
                  >
                    <Button
                      variant="contained"
                      color="primary"
                      component="label"
                    >
                      Upload
                      <input hidden accept="image/*" multiple type="file" />
                    </Button>
                    <Button variant="outlined" color="error">
                      Reset
                    </Button>
                  </Stack>
                  <Typography variant="subtitle1" color="textSecondary" mb={4}>
                    Allowed JPG, GIF or PNG. Max size of 800K
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </BlankCard>
        </Grid>

        {/* Edit Details */}
        <Grid item xs={12}>
          <BlankCard>
            <CardContent>
              <Typography variant="h5" mb={1}>
                Regional
              </Typography>
              <Typography color="textSecondary" mb={3}>
                To change your personal detail, edit and save from here
              </Typography>
              <form>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <CustomFormLabel
                      sx={{
                        mt: 0,
                      }}
                      htmlFor="text-name"
                    >
                      Your Name
                    </CustomFormLabel>
                    <CustomTextField
                      id="text-name"
                      value="Mathew Anderson"
                      variant="outlined"
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {/* 2 */}
                    <CustomFormLabel
                      sx={{
                        mt: 0,
                      }}
                      htmlFor="text-store-name"
                    >
                      Role
                    </CustomFormLabel>
                    <CustomTextField
                      id="text-store-name"
                      value="Asset Curator"
                      variant="outlined"
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {/* 3 */}
                    <CustomFormLabel
                      sx={{
                        mt: 0,
                      }}
                      htmlFor="text-location"
                    >
                      Location
                    </CustomFormLabel>
                    <CustomSelect
                      fullWidth
                      id="text-location"
                      variant="outlined"
                      value={location}
                      onChange={handleChange1}
                    >
                      {locations.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </CustomSelect>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {/* 4 */}
                    <CustomFormLabel
                      sx={{
                        mt: 0,
                      }}
                      htmlFor="text-language"
                    >
                      Language
                    </CustomFormLabel>
                    <CustomSelect
                      fullWidth
                      id="text-language"
                      variant="outlined"
                      value={language}
                      onChange={handleChange2}
                    >
                      {languages.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </CustomSelect>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {/* 5 */}
                    <CustomFormLabel
                      sx={{
                        mt: 0,
                      }}
                      htmlFor="text-email"
                    >
                      Email
                    </CustomFormLabel>
                    <CustomTextField
                      id="text-email"
                      value="info@modernize.com"
                      variant="outlined"
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {/* 6 */}
                    <CustomFormLabel
                      sx={{
                        mt: 0,
                      }}
                      htmlFor="text-phone"
                    >
                      Phone
                    </CustomFormLabel>
                    <CustomTextField
                      id="text-phone"
                      value="+91 12345 65478"
                      variant="outlined"
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </BlankCard>
          <Stack
            direction="row"
            spacing={2}
            sx={{ justifyContent: "end" }}
            mt={3}
          >
            <Button size="large" variant="contained" color="primary">
              Save
            </Button>
            <Button size="large" variant="text" color="error">
              Cancel
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
