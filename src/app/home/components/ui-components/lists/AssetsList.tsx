import { List, ListItem, ListItemText, ListItemAvatar, Avatar, Typography } from '@mui/material';
import BlankCard from '../../shared/BlankCard';

import { IconPhoto, IconBriefcase, IconBeach } from '@tabler/icons-react';

const FolderList = () => {
  return (
    <>
      <BlankCard>
        <Typography sx={{ margin: '20px 20px', display: 'block' }}>{'Your Vitruveo assets are displayed below.'}</Typography>
        <List>
          <ListItem>
            <ListItemAvatar>
              <Avatar sx={{ width: 100, height: 100, borderRadius: '0', margin: '0 30px 0 0' }}>
                <IconPhoto />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography sx={{ fontWeight: "600", fontSize: '16px' }}>
                  Nexus #23
                </Typography>

              }
              secondary={
                <div>
                  <Typography
                    sx={{ maxWidth: "1000px", fontSize: '12px', marginBottom: '10px' }}
                    variant="body2"
                  >Summary publishing and graphic design, Lorem ipsum is a placeholder text commonly used to demonstrate the visual form</Typography>
                </div>
              }
            />
          </ListItem>
          <ListItem>
            <ListItemAvatar>
              <Avatar sx={{ width: 100, height: 100, borderRadius: '0', margin: '0 30px 0 0' }}>
                <IconBriefcase width={20} height={20} />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography sx={{ fontWeight: "600", fontSize: '16px' }}>
                  Validator #23
                </Typography>

              }
              secondary={
                <div>
                  <Typography
                    sx={{ maxWidth: "1000px", fontSize: '12px', marginBottom: '10px' }}
                    variant="body2"
                  >Summary publishing and graphic design, Lorem ipsum is a placeholder text commonly used to demonstrate the visual form</Typography>
                </div>
              }
            />
          </ListItem>
          <ListItem>
            <ListItemAvatar>
              <Avatar sx={{ width: 100, height: 100, borderRadius: '0', margin: '0 30px 0 0' }}>
                <IconBeach width={20} height={20} />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography sx={{ fontWeight: "600", fontSize: '16px' }}>
                  Asset Name
                </Typography>

              }
              secondary={
                <div>
                  <Typography
                    sx={{ maxWidth: "1000px", fontSize: '12px', marginBottom: '10px' }}
                    variant="body2"
                  >Summary publishing and graphic design, Lorem ipsum is a placeholder text commonly used to demonstrate the visual form</Typography>
                </div>
              }
            />
          </ListItem>
        </List>
      </BlankCard>
    </>
  );
};

export default FolderList;
