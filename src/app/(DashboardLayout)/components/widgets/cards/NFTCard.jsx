import {
  Grid,
} from '@mui/material';


const NFTCard = ({ nft }) => {

  return (
        <Grid item   
        xs={12}
        lg={4}
        md={4}
        sm={6} 
        display="flex" key={nft[0]}>
              <a href={`${nft.storeUrl}`} target="_new"><img src={`${nft.previewUrl.indexOf('.mp4') > -1 ? 'images/blank.png' : nft.previewUrl }`} alt={`${nft.name}`} style={{width: '100%' }} id={`img-${nft.key}`} /></a>
        </Grid>
      )
  }

export default NFTCard;
