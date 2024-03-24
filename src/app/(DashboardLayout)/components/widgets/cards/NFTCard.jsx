import React, { useEffect, useState, useRef } from "react";
import Link  from 'next/link';
import {
  CardContent,
  Grid,
  Divider,
  CardMedia,
  Stack,
  Tooltip,
  Chip,
  Box,
  Button,
  Typography,
} from '@mui/material';
import BlankCard from '../../shared/BlankCard';
import CustomCheckbox from '../../forms/theme-elements/CustomCheckbox';


const NFTCard = ({ nft }) => {
  const loadedImages = [];
  const [title, setTitle] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  
  const getData = async (id) => {
    return new Promise(async (resolve, reject) => {
      try {
        const resp = await fetch(`https://booster-api.vitruveo.xyz/api/metadata/${id}.json`);
        const json = await resp.json();
        resolve(json.data);
      } catch (error) {
        reject(error);
      }
    });
  };


  async function fetchImage(tokenId) {
    if (loadedImages.indexOf(tokenId) > -1) return;
    const img = document.getElementById(`img-${tokenId}`);
    delete img.onLoad;
    const data = await getData(tokenId);
    setTitle(data.name);
    img.src = data.isBoosted ? data.reveal : data.image; //'https://bafybeid7e5qviupagzyx7xeohq662nhptgc6lavj7zv2b745b7klr2phki.ipfs.nftstorage.link/pre/booster/b.gif';
    loadedImages.push(tokenId);
  }

  return (
        <Grid item   
        xs={12}
        lg={4}
        md={4}
        sm={6} 
        display="flex" key={nft[0]}>
          <BlankCard className="hoverCard">
            <>
              <img src={'/images/booster.gif'} alt="img" style={{width: '100%' }} id={`img-${nft.tokenId}`} onLoad={(e) => { fetchImage(`${nft.tokenId}`); }} onError={(e) => {e.target.src=`/images/booster.gif`;}} />
              <CardContent>
                      <Chip label={ title } size="medium" mr={2}></Chip>
              </CardContent>
            </>
          </BlankCard>
        </Grid>
      )
  }

export default NFTCard;
