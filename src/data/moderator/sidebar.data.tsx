import {
  BuildingOfficeIcon,
  CreditCardIcon,
  DetectiveIcon,
  GavelIcon,
  LayoutIcon,
  QuestionIcon,
  UserCircleIcon,
  UserListIcon,
  UsersIcon,
} from "@phosphor-icons/react/dist/ssr";

export const ModeratorSidebarData = {
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
          label: "Organisations",
          key: "organisations",
          icon: (
            <BuildingOfficeIcon
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
          label: "Users",
          key: "users",
          icon: (
            <UserListIcon
              className="text-primary h-full w-full"
              weight="duotone"
            />
          ),
        },
        {
          label: "Payment Logs",
          key: "payment-logs",
          icon: (
            <CreditCardIcon
              className="text-primary h-full w-full"
              weight="duotone"
            />
          ),
        },
        {
          label: "Policies",
          key: "policies",
          icon: (
            <GavelIcon
              className="text-primary h-full w-full"
              weight="duotone"
            />
          ),
        },
        {
          label: "Queries",
          key: "queries",
          icon: (
            <QuestionIcon
              className="text-primary h-full w-full"
              weight="duotone"
            />
          ),
        },
      ],
    },
    {
      label: "Management",
      items: [
        {
          label: "Admins",
          key: "admins",
          icon: (
            <DetectiveIcon
              className="text-primary h-full w-full"
              weight="duotone"
            />
          ),
          superModOnly: true,
        },
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
