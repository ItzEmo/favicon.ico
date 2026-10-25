import localFont from "next/font/local"

export const glassFont = localFont({
  src: "../app/fonts/super-maples.ttf",
  display: "swap",
})

export const discoFont = localFont({
  src: "../app/fonts/70s-disco.otf",
  display: "swap",
  preload: false,
})

export const travelersFont = localFont({
  src: "../app/fonts/air-travelers.otf",
  display: "swap",
  preload: false,
})
