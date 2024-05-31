import {
  Grid,
} from '@mui/material';


const NFTCard = ({ nft }) => {
  const loadedImages = [];


  async function fetchImage() {
    try {
      if (loadedImages.indexOf(nft.image) > -1) return; 
      if (nft.image) {
        const img = document.getElementById(`img-${nft.key}`);
        delete img.onLoad;    
        img.src = nft.image; 
        loadedImages.push(nft.image);    
      }
    } catch(e) {
       console.log(e)
    }
  }

  return (
        <Grid item   
        xs={12}
        lg={4}
        md={4}
        sm={6} 
        display="flex" key={nft[0]}>
              <a href={`${nft.external_url}`} target="_new"><img src={'/images/blank.png'} alt={`${nft.name}`} style={{width: '100%' }} id={`img-${nft.key}`} onLoad={(e) => { fetchImage(); }} onError={(e) => {e.target.src=`/images/blank.png`;}} /></a>
        </Grid>
      )
  }

export default NFTCard;
