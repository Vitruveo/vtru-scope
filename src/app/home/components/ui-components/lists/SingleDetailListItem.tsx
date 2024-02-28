import React from 'react';
import { Typography, ListItemText, ListItem } from '@mui/material'

interface SingleDetailListItemProps {
    imageSrc: string;
    heading: string;
    descriptions: string[];
    headingFontSize?: string;
    descriptionFontSize?: string;
}

const SingleDetailListItem: React.FC<SingleDetailListItemProps> = ({
    imageSrc,
    heading,
    descriptions,
    headingFontSize,
    descriptionFontSize,
}) => {
    return (
        <>
            <ListItem sx={{ alignItems: 'self-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', }}>
                    <img src={imageSrc} alt="Image" style={{ width: '250px', height: '250px', marginRight: '10px' }} />
                </div>
                <div>
                    <Typography variant="h6" style={{ fontSize: headingFontSize || '20px', marginBottom: '20px', marginTop: '10px' }}>
                        {heading}
                    </Typography>
                    <ListItemText
                        secondary={
                            <div>
                                {descriptions.map((description, index) => (
                                    <Typography
                                        key={index}
                                        variant="body2"
                                        style={{ fontSize: descriptionFontSize || '16px', marginBottom: '10px' }}
                                    >
                                        {description}
                                    </Typography>
                                ))}
                            </div>
                        }
                    />

                </div>
            </ListItem>
        </>
    );
};

export default SingleDetailListItem;
