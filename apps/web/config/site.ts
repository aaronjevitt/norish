export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Norish",
  description: "Any recipe, any source.",
  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Groceries",
      href: "/groceries",
    },
    {
      label: "Calendar",
      href: "/calendar",
    },
  ],
  navMenuItems: [
    {
      label: "Profile",
      href: "/profile",
    },
  ],
  links: {
    github: "https://github.com/norish-recipes/norish",
  },
};
