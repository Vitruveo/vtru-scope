import {
  Grid,
} from '@mui/material';


const VtruNFTCard = ({ nft }) => {

  if (!Object.hasOwn(nft, 'previewUrl')) return <></>;
  return (
        <Grid item   
        xs={12}
        lg={3}
        md={3}
        sm={4} 
        display="flex" key={nft[0]}>
              <a href={`${nft.storeUrl}`} target="_new"><img src={`${nft.previewUrl.indexOf('.mp4') > -1 ? '/images/blank.png' : nft.previewUrl }`} alt={`${nft.name}`} style={{width: '100%' }} id={`img-${nft.key}`} /></a>
        </Grid>
      )
  }

export default VtruNFTCard;
