import {
  CardContent,
  Grid,
  Chip
} from '@mui/material';
import BlankCard from '../../shared/BlankCard';

const codes = [
  0x16A0, 0x16A2, 0x16A6, 0x16A8, 0x16B1, 0x16B2, 0x16B7, 0x16B9, 0x16BA, 0x16BE,
  0x16BF, 0x16C3, 0x16C7, 0x16C8, 0x16CB, 0x16CC, 0x16CD, 0x16CF, 0x16D6, 0x16D7,
  0x16DA, 0x16DD, 0x16DF, 0x16DE
];

const names = [
  "Fehu", "Uruz", "Thurisaz", "Ansuz", "Raidho", "Kenaz", "Gebo", "Wunjo", "Hagalaz",
  "Nauthiz", "Isa", "Jera", "Eihwaz", "Perthro", "Algiz", "Sowilo", "Tiwaz", "Berkano",
  "Ehwaz", "Mannaz", "Laguz", "Ingwaz", "Othala", "Dagaz"
];

const descriptions = [
  "Wealth, cattle, prosperity", "Strength, power, physical health", "Thor, protection, conflict",
  "Odin, wisdom, communication", "Journey, movement, travel", "Torch, knowledge, enlightenment",
  "Gift, generosity, partnership", "Joy, pleasure, harmony", "Hail, disruption, change",
  "Need, necessity, constraint", "Ice, stillness, patience", "Year, harvest, reward",
  "Yew tree, resilience, strength", "Mystery, fate, chance", "Elk, protection, defense",
  "Sun, success, vitality", "Tyr, honor, justice", "Birch, growth, fertility",
  "Horse, trust, teamwork", "Man, humanity, self", "Water, intuition, flow",
  "Fertility, peace, harmony", "Heritage, inheritance, home", "Day, breakthrough, clarity"
];

const glyphs = [
  "ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᚲ", "ᚷ", "ᚹ", "ᚺ", "ᚾ", "ᛁ", "ᛃ", "ᛇ", "ᛈ", "ᛉ", "ᛊ", "ᛏ", "ᛒ",
  "ᛖ", "ᛗ", "ᛚ", "ᛜ", "ᛟ", "ᛞ"
];


const VortexNFTCard = ({ nft }) => {

  const index = names.indexOf(nft.glyphName);

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
          <img src={`/images/vortex/${nft.rarity}.png`} alt={`${nft.name}`} style={{width: '100%' }} id={`img-${nft.key}`} />
          <div style={{position:'absolute', top: '20px', right: '10px', marginLeft: '-150px', fontSize: '60px', color: '#fff'}}>{`${glyphs[index]}`}</div>
        </div>
          <CardContent>
              <Chip label={`${nft.rarity}`} size="large" color="primary" ></Chip>
              &nbsp;&nbsp;
              <Chip label={`${nft.glyphName}`} size="large" color="primary"></Chip>
          </CardContent>
        </>
      </BlankCard>
    </Grid>
      )
  }

export default VortexNFTCard;
