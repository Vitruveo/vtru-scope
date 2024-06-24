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
  IconAward,
  IconBoxMultiple,
  IconPoint,
  IconAlertCircle,
  IconNotes,
  IconCalendar,
  IconMail,
  IconTicket,
  IconEdit,
  IconGitMerge,
  IconCurrencyDollar,
  IconApps,
  IconFileDescription,
  IconFileDots,
  IconFiles,
  IconBan,
  IconStar,
  IconPalette,
  IconMoodSmile,
  IconBorderAll,
  IconBorderHorizontal,
  IconBorderInner,
  IconBorderVertical,
  IconBorderTop,
  IconUserCircle,
  IconPackage,
  IconMessage2,
  IconBasket,
  IconChartLine,
  IconChartArcs,
  IconChartCandle,
  IconChartArea,
  IconChartDots,
  IconChartDonut3,
  IconChartRadar,
  IconLogin,
  IconUserPlus,
  IconRotate,
  IconBox,
  IconShoppingCart,
  IconAperture,
  IconLayout,
  IconSettings,
  IconHelp,
  IconZoomCode,
  IconBoxAlignBottom,
  IconBoxAlignLeft,
  IconBorderStyle2,
  IconAppWindow,
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
    title: "Core NFTs",
    icon: IconTicket,
    href: "/core"
  },
  {
    id: uniqueId(),
    title: "VTRU Suite NFTs",
    icon: IconStar,
    href: "/vtrusuite"
  },
  {
    id: uniqueId(),
    title: "Vortex NFTs",
    icon: IconAperture,
    href: "/vortex"
  },
  {
    id: uniqueId(),
    title: "Booster NFTs",
    icon: IconBox,
    href: "/booster"
  },
  // {
  //   id: uniqueId(),
  //   title: "Creators",
  //   icon: IconPalette,
  //   href: "/creators"
  // },
  {
    id: uniqueId(),
    title: "About",
    icon: IconNotes,
    href: "/about"
  },
];

export default Menuitems;
