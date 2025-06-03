import {
  BuildingOfficeIcon,
  CreditCardIcon,
  GearSixIcon,
  HeadsetIcon,
  LayoutIcon,
  MathOperationsIcon,
  UserCircleIcon,
  UsersIcon,
  WalletIcon,
} from "@phosphor-icons/react/dist/ssr";

export const ConsumerSidebarData = {
  groups: [
    {
      label: "Main Menu",
      items: [
        {
          label: "Dashboard",
          key: "dashboard",
          icon: (
            <LayoutIcon
              className="text-primary h-full w-full"
              weight="duotone"
            />
          ),
        },
        {
          label: "Memberships",
          key: "memberships",
          icon: (
            <UsersIcon
              className="text-primary h-full w-full"
              weight="duotone"
            />
          ),
        },
        {
          label: "Payment History",
          key: "payment-history",
          icon: (
            <CreditCardIcon
              className="text-primary h-full w-full"
              weight="duotone"
            />
          ),
        },
        {
          label: "Support",
          key: "support",
          icon: (
            <HeadsetIcon
              className="text-primary h-full w-full"
              weight="duotone"
            />
          ),
        },
      ],
    },
    {
      label: "Settings",
      items: [
        {
          label: "Profile",
          key: "profile",
          icon: (
            <UserCircleIcon
              className="text-primary h-full w-full"
              weight="duotone"
            />
          ),
        },
      ],
    },
  ],
};
