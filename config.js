/*
 * Site settings: edit these, nothing else needs to change.
 *   price        what the buy buttons show
 *   checkoutUrl  your Lemon Squeezy (or Gumroad) checkout link for Crumb; upload dist/crumb-<version>.zxp there as the product file
 *   version      shown on the page
 *   launch       free-launch window: endsAt (ISO time, with timezone) and the coupon code. The banner and the "free" labels
 *                switch themselves off after endsAt. Set launch: null to remove.
 *   discord      support server invite
 */
window.CRUMB_SITE = {
  price: "$5",
  checkoutUrl: "https://payhip.com/b/BgoA6",
  version: "0.1.0",
  aeVersions: "After Effects 2020 or newer",
  tiktok: "https://www.tiktok.com/@celo.vfx",
  discord: "https://discord.gg/6KCEgNSDnc",
  launch: { endsAt: "2026-11-14T19:27:00-05:00", code: "LAUNCH" }
};
