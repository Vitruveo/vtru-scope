import { uniqueId } from "lodash";
import SliderDefault from "@/app/home/components/sliders/default";

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
  IconPackage,
  IconChartDonut3,
  IconChartArea,
  IconChartBar,
  IconAperture,
  IconPoint,
} from "@tabler/icons-react";

const Menuitems: MenuitemsType[] = [
  // {
  //   navlabel: true,
  //   subheader: "Charts",
  // },

  {
    id: uniqueId(),
    title: "Assets",
    // icon: IconChartDonut3,
    href: "/home",
    // children: [
    //   {
    //     title: "Earnings this month",
    //     subtitle: "This month sales",
    //     id: uniqueId(),
    //     component: SliderDefault,
    //     props: {
    //       chartKey: "earningsThisMonth",
    //     },
    //     href: "",
    //   },
    //   {
    //     title: "Expense this month",
    //     subtitle: "This month's expenses",
    //     id: uniqueId(),
    //     component: SliderDefault,
    //     props: {
    //       chartKey: "expenseThisMonth",
    //     },
    //     href: "",
    //   },
    // ],
  },
  {
    id: uniqueId(),
    title: "Nexus",
    // icon: IconChartDonut3,
    href: "/",
    // children: [
    //   {
    //     title: "Earnings this month",
    //     subtitle: "This month sales",
    //     id: uniqueId(),
    //     component: SliderDefault,
    //     props: {
    //       chartKey: "earningsThisMonth",
    //     },
    //     href: "",
    //   },
    //   {
    //     title: "Expense this month",
    //     subtitle: "This month's expenses",
    //     id: uniqueId(),
    //     component: SliderDefault,
    //     props: {
    //       chartKey: "expenseThisMonth",
    //     },
    //     href: "",
    //   },
    // ],
  },
  {
    id: uniqueId(),
    title: "Validator",
    // icon: IconChartDonut3,
    href: "/",
    // children: [
    //   {
    //     title: "Earnings this month",
    //     subtitle: "This month sales",
    //     id: uniqueId(),
    //     component: SliderDefault,
    //     props: {
    //       chartKey: "earningsThisMonth",
    //     },
    //     href: "",
    //   },
    //   {
    //     title: "Expense this month",
    //     subtitle: "This month's expenses",
    //     id: uniqueId(),
    //     component: SliderDefault,
    //     props: {
    //       chartKey: "expenseThisMonth",
    //     },
    //     href: "",
    //   },
    // ],
  },

  // {
  //   id: uniqueId(),
  //   title: "Revenue Updates",
  //   icon: IconChartDonut3,
  //   href: "/apps/blog/",
  //   children: [
  //     {
  //       title: "Earnings this month",
  //       subtitle: "This month sales",
  //       id: uniqueId(),
  //       component: SliderDefault,
  //       props: {
  //         chartKey: "earningsThisMonth",
  //       },
  //       href: "",
  //     },
  //     {
  //       title: "Expense this month",
  //       subtitle: "This month's expenses",
  //       id: uniqueId(),
  //       component: SliderDefault,
  //       props: {
  //         chartKey: "expenseThisMonth",
  //       },
  //       href: "",
  //     },
  //   ],
  // },

  // {
  //   id: uniqueId(),
  //   title: "Expenses Details",
  //   icon: IconChartBar,
  //   children: [
  //     {
  //       title: "Salary",
  //       subtitle: "Employee salaries",
  //       id: uniqueId(),
  //       component: SliderDefault,
  //       props: {
  //         chartKey: "salary",
  //       },
  //       href: "",
  //     },
  //     {
  //       title: "Marketing",
  //       subtitle: "Marketing investments",
  //       id: uniqueId(),
  //       component: SliderDefault,
  //       props: {
  //         chartKey: "marketing",
  //       },
  //       href: "",
  //     },
  //     {
  //       title: "Others",
  //       subtitle: "Others Expenses",
  //       id: uniqueId(),
  //       component: SliderDefault,
  //       props: {
  //         chartKey: "others",
  //       },
  //       href: "",
  //     },
  //   ],
  // },

  // {
  //   id: uniqueId(),
  //   title: "Weekly Stats",
  //   icon: IconChartArea,
  //   children: [
  //     {
  //       title: "Top Sales",
  //       subtitle: "See the top-performing products",
  //       id: uniqueId(),
  //       component: SliderDefault,
  //       props: {
  //         chartKey: "topSales",
  //       },
  //     },
  //     {
  //       title: "Best Seller",
  //       subtitle: "Discover the best-selling products",
  //       id: uniqueId(),
  //       component: SliderDefault,
  //       props: {
  //         chartKey: "bestSeller",
  //       },
  //     },
  //     {
  //       title: "Most Commented",
  //       subtitle: "Explore the most commented products",
  //       id: uniqueId(),
  //       component: SliderDefault,
  //       props: {
  //         chartKey: "mostCommented",
  //       },
  //     },
  //   ],
  // },
];

export default Menuitems;
