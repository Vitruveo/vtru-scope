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
  IconBox,
  IconAperture,
  IconClockStar,
  IconClockStop,
  IconBrush,
  IconCircleKey,
  IconCoins,
  IconMovie,
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
    title: "VERSE Projector",
    icon: IconCalculator,
    href: "/verse",
    chipColor: "secondary",
  },
  {
    id: uniqueId(),
    title: "What-if Calculator",
    icon: IconCalculatorFilled,
    href: "/whatif",
    chipColor: "secondary",
  },
  {
    id: uniqueId(),
    title: "Rebase Calculator",
    icon: IconCoins,
    href: "/rebase",
    chipColor: "secondary",
  },
  {
    id:uniqueId(),
    title: "Digital Assets",
    icon: IconPackage,
    children: [
      {
        id: uniqueId(),
        title: "Core",
        icon: IconTicket,
        href: "/assets/core"
      },
      {
        id: uniqueId(),
        title: "Artwork",
        icon: IconBrush,
        href: "/assets/artwork"
      },
      {
        id: uniqueId(),
        title: "VIBE",
        icon: IconEngine,
        href: "/assets/vibe"
      },
      {
        id: uniqueId(),
        title: "VERSE",
        icon: IconMovie,
        href: "/assets/verse"
      },
      {
        id: uniqueId(),
        title: "Vortex",
        icon: IconAperture,
        href: "/assets/vortex"
      },
      {
        id: uniqueId(),
        title: "Booster",
        icon: IconBox,
        href: "/assets/booster"
      },

    ]
  },
  {
    id:uniqueId(),
    title: "Staking",
    icon: IconPackage,
    children: [
      {
        id: uniqueId(),
        title: "VTRU",
        icon: IconClockStar,
        href: "/staking/vtru"
      },
      {
        id: uniqueId(),
        title: "VTRU (Vesting)",
        icon: IconClockStop,
        href: "/staking/vtruvest"
      }
    ]
  },
  {
    id:uniqueId(),
    title: "FAQers",
    icon: IconPackage,
    children: [
      // {
      //   id: uniqueId(),
      //   title: "General",
      //   icon: IconHelp,
      //   href: "/faqers/general"
      // },
      {
        id: uniqueId(),
        title: "wVTRU",
        icon: IconCircleKey,
        href: "/faqers/wVTRU"
      },
      {
        id: uniqueId(),
        title: "Vault",
        icon: IconCircleKey,
        href: "/faqers/vault"
      }

    ]
  },
  {
    id:uniqueId(),
    title: "Info",
    icon: IconPackage,
    children: [
      {
        id: uniqueId(),
        title: "Smart Contracts",
        icon: IconScript,
        href: "/info/contracts"
      },
      {
        id: uniqueId(),
        title: "About",
        icon: IconNotes,
        href: "/info/about"
      }
    ]
  }
  // {
  //   id: uniqueId(),
  //   title: "Creators",
  //   icon: IconPalette,
  //   href: "/creators"
  // },
  
];

export default Menuitems;

/*

{
    id: uniqueId(),
    title: "Ecommerce",
    icon: IconBasket,
    href: "/apps/ecommerce/",
    children: [
      {
        id: uniqueId(),
        title: "Shop",
        icon: IconPoint,
        href: "/apps/ecommerce/shop",
      },
      {
        id: uniqueId(),
        title: "Detail",
        icon: IconPoint,
        href: "/apps/ecommerce/detail/1",
      },
      {
        id: uniqueId(),
        title: "List",
        icon: IconPoint,
        href: "/apps/ecommerce/list",
      },
      {
        id: uniqueId(),
        title: "Checkout",
        icon: IconPoint,
        href: "/apps/ecommerce/checkout",
      },
    ],
  },
*/