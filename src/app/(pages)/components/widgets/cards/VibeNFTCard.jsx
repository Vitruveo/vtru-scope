import {
  CardContent,
  Grid,
  Chip
} from '@mui/material';
import BlankCard from '../../shared/BlankCard';



const VibeNFTCard = ({ nft }) => {

  return (
    <Grid item   
    xs={12}
    lg={4}
    md={4}
    sm={6} 
    display="flex" key={nft[0]}>
      <BlankCard className="hoverCard">
        <>
        <div>
          <img src={`${nft.image}`} alt={`${nft.denomination}`} style={{width: '100%' }} id={`img-${nft.key}`} />
        </div>
          <CardContent>
              <Chip label={`${nft.id}`} size="large" color="primary"></Chip>
              &nbsp;&nbsp;&nbsp;&nbsp;
              <Chip label={`Claimed: ${(nft.claimed/10**18).toFixed(4)}`} size="large" color="primary" ></Chip>
          </CardContent>
        </>
      </BlankCard>
    </Grid>
      )
  }

export default VibeNFTCard;
