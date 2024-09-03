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
  IconBox,
  IconAperture,
  IconClockDollar,
  IconHelp,
  IconBrush,
  IconCircleKey,
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
    id:uniqueId(),
    title: "Digital Assets",
    icon: IconPackage,
    children: [
      {
        id: uniqueId(),
        title: "Core",
        icon: IconTicket,
        href: "/core"
      },
      {
        id: uniqueId(),
        title: "Artwork",
        icon: IconBrush,
        href: "/artwork"
      },
      {
        id: uniqueId(),
        title: "VIBE",
        icon: IconEngine,
        href: "/vibe"
      },
      {
        id: uniqueId(),
        title: "Vortex",
        icon: IconAperture,
        href: "/vortex"
      },
      {
        id: uniqueId(),
        title: "Booster",
        icon: IconBox,
        href: "/booster"
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
        title: "VIBE",
        icon: IconClockDollar,
        href: "/stake"
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
        title: "Vault",
        icon: IconCircleKey,
        href: "/faqers/vault"
      }

    ]
  },
  {
    id:uniqueId(),
    title: "Information",
    icon: IconPackage,
    children: [
      {
        id: uniqueId(),
        title: "Smart Contracts",
        icon: IconScript,
        href: "/contracts"
      },
      {
        id: uniqueId(),
        title: "About",
        icon: IconNotes,
        href: "/about"
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