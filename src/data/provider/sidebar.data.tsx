import {
  BuildingOfficeIcon,
  CreditCardIcon,
  GearSixIcon,
  LayoutIcon,
  MathOperationsIcon,
  UsersIcon,
  WalletIcon,
  IdentificationCardIcon,
} from "@phosphor-icons/react/dist/ssr";

export const ProviderSidebarData = {
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
          label: "Members",
          key: "members",
          icon: (
            <UsersIcon
              className="text-primary h-full w-full"
              weight="duotone"
            />
          ),
        },
        {
          label: "Fee Management",
          key: "fee-management",
          icon: (
            <MathOperationsIcon
              className="text-primary h-full w-full"
              weight="duotone"
            />
          ),
        },
        {
          label: "Payments",
          key: "payments",
          icon: (
            <CreditCardIcon
              className="text-primary h-full w-full"
              weight="duotone"
            />
          ),
        },
        {
          label: "Wallet",
          key: "wallet",
          icon: (
            <WalletIcon
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
          label: "KYC Verification",
          key: "kyc",
          icon: (
            <IdentificationCardIcon
              className="text-primary h-full w-full"
              weight="duotone"
            />
          ),
        },
        {
          label: "Institution Profile",
          key: "profile",
          icon: (
            <BuildingOfficeIcon
              className="text-primary h-full w-full"
              weight="duotone"
            />
          ),
        },
        {
          label: "Settings",
          key: "settings",
          icon: (
            <GearSixIcon
              className="text-primary h-full w-full"
              weight="duotone"
            />
          ),
        },
      ],
    },
  ],
};
