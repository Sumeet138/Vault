export interface SettingItem {
  id: string;
  icon: string;
  label: string;
  type: "modal" | "redirect" | "action";
  currentValue?: string;
}

export interface SettingSection {
  title: string;
  items: SettingItem[];
}

export const SETTINGS: SettingSection[] = [
  {
    title: "Preferences",
    items: [
      // {
      //   id: "appearance",
      //   icon: "/assets/icons/settings_appearance.svg",
      //   label: "Appearance",
      //   type: "modal",
      //   currentValue: "Light",
      // },
      {
        id: "currency",
        icon: "/assets/icons/settings_currency.svg",
        label: "Currency",
        type: "modal",
        currentValue: "USD",
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        id: "connected-wallets",
        icon: "/assets/icons/cute-wallet.svg",
        label: "Connected Wallets",
        type: "modal",
      },
      {
        id: "logout",
        icon: "/assets/icons/settings_logout.svg",
        label: "Logout",
        type: "action",
      },
    ],
  },
];

export const APPEARANCE_OPTIONS = [
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

export const CURRENCY_OPTIONS = [{ id: "usd", label: "USD" }];
