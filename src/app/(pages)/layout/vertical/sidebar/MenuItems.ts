import { uniqueId } from "lodash";

interface MenuitemsType {
  [x: string]: any;
  id?: string;
  navlabel?: boolean;
  subheader?: string;
  title?: string;
  icon?: any;
  href?: string;
  children?: MenuitemsType[];
  chip?: string;
  chipColor?: string;
  variant?: string;
  external?: boolean;
}
import {
  IconEngine,
  IconScript,
  IconNotes,
  IconTicket,
  IconApps,
  IconPackage,
  IconCalculator,
  IconCalculatorFilled,
  IconIdBadge,
  IconBox,
  IconTicketOff,
  IconAperture,
  IconClockStar,
  IconClockStop,
  IconBrush,
  IconCircleKey,
  IconCoins,
  IconMovie,
  IconWorld,
  IconWallet,
  IconHistory,
  IconGraph,
  IconCoinFilled,
  IconBuildingBridge,
} from "@tabler/icons-react";

const Menuitems: MenuitemsType[] = [
  {
    navlabel: true,
    subheader: " ",
  },

  {
    id: uniqueId(),
    title: "Dashboard",
    icon: IconApps,
    href: "/",
    chipColor: "secondary",
  },
  {
    id: uniqueId(),
    title: "Tokenomics",
    icon: IconCoins,
    href: "/tokenomics",
    chipColor: "secondary",
  },
  {
    id: uniqueId(),
    title: "Multisig",
    icon: IconWallet,
    href: "/assets/multisig",
    chipColor: "secondary",
  },    
  {
    id: uniqueId(),
    title: "Staking",
    icon: IconClockStar,
    href: "/staking/vtru"
  },
  {
    id: uniqueId(),
    title: "VTRU Bridge",
    icon: IconBuildingBridge,
    href: "/services/bridge/bsc",
    chipColor: "secondary",
  },
  {
    id: uniqueId(),
    title: "VNS",
    icon: IconWorld,
    href: "/vns",
  },
  {
    id: uniqueId(),
    title: "Legacy",
    icon: IconHistory,
    href: "/legacy",
    chipColor: "secondary",
  },
  {
        id: uniqueId(),
        title: "VIBE",
        icon: IconEngine,
        href: "/assets/vibe"
  },
  // {
  //   id: uniqueId(),
  //   title: "VNS",
  //   icon: IconIdBadge,
  //   href: "/vns",
  //   chipColor: "secondary",
  // },
  // {
  //   id:uniqueId(),
  //   title: "Tokens",
  //   icon: IconCoinFilled,
  //   children: [
      // {
      //   id: uniqueId(),
      //   title: "Core",
      //   icon: IconTicket,
      //   href: "/assets/core"
      // }

      

      // {
      //   id: uniqueId(),
      //   title: "VERSE",
      //   icon: IconMovie,
      //   href: "/assets/verse"
      // },
      // {
      //   id: uniqueId(),
      //   title: "AIWARS",
      //   icon: IconAperture,
      //   href: "/assets/aiwars"
      // },
      // {
      //   id: uniqueId(),
      //   title: "Booster",
      //   icon: IconBox,
      //   href: "/assets/booster"
      // },

  //   ]
  // },
  // {
  //   id:uniqueId(),
  //   title: "Calculators",
  //   icon: IconCalculator,
  //   children: [
  //     {
  //       id: uniqueId(),
  //       title: "What-if Calculator",
  //       icon: IconCalculatorFilled,
  //       href: "/whatif",
  //       chipColor: "secondary",
  //     },
  //     {
  //       id: uniqueId(),
  //       title: "Rebase Calculator",
  //       icon: IconCoins,
  //       href: "/rebase",
  //       chipColor: "secondary",
  //     },
  //     {
  //       id: uniqueId(),
  //       title: "VERSE Projector",
  //       icon: IconCalculator,
  //       href: "/verse",
  //       chipColor: "secondary",
  //     },
  //   ]
  // },
  // {
  //   id:uniqueId(),
  //   title: "FAQers",
  //   icon: IconPackage,
  //   children: [
  //     // {
  //     //   id: uniqueId(),
  //     //   title: "General",
  //     //   icon: IconHelp,
  //     //   href: "/faqers/general"
  //     // },
  //     {
  //       id: uniqueId(),
  //       title: "wVTRU",
  //       icon: IconCircleKey,
  //       href: "/faqers/wVTRU"
  //     },
  //     {
  //       id: uniqueId(),
  //       title: "Vault",
  //       icon: IconCircleKey,
  //       href: "/faqers/vault"
  //     }

  //   ]
  // },
  {
    id: uniqueId(),
    title: "Reflect",
    icon: IconAperture,
    href: "/reflect",
    chipColor: "secondary",
  },
  {
    id:uniqueId(),
    title: "Info",
    icon: IconPackage,
    children: [
      {
        id: uniqueId(),
        title: "Vertical Foundation",
        icon: IconWorld,
        href: "https://www.verticalfoundation.net",
        external: true
      },
      {
        id: uniqueId(),
        title: "Vitruveo",
        icon: IconWorld,
        href: "https://www.vitruveo.ai",
        external: true
      },
      {
        id: uniqueId(),
        title: "Smart Contracts",
        icon: IconScript,
        href: "/info/contracts"
      }
    ]
  }
  
];

export default Menuitems;
