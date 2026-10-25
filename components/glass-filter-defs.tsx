type GlassFilterProps = {
  id: string
  blur: number
  rim: number
  innerRim: number
  surface: number
}

function GlassFilter({ id, blur, rim, innerRim, surface }: GlassFilterProps) {
  return (
    <filter id={id} x="-10%" y="-20%" width="120%" height="140%" colorInterpolationFilters="sRGB">
      {/* Height map: a soft alpha blur turns the flat glyph into a rounded dome. */}
      <feGaussianBlur in="SourceAlpha" stdDeviation={blur} result="dome" />

      {/* Faint smoky body so the glass reads as clear, not empty. */}
      <feFlood floodColor="#ffffff" floodOpacity="0.07" result="tint" />
      <feComposite in="tint" in2="SourceAlpha" operator="in" result="body" />

      {/* Inner shading: darker toward the edges, like thick glass refracting the black behind it. */}
      <feComposite in="SourceAlpha" in2="dome" operator="out" result="edgeShade" />
      <feFlood floodColor="#ffffff" floodOpacity="0.18" result="shadeTint" />
      <feComposite in="shadeTint" in2="edgeShade" operator="in" result="edgeGlow" />

      {/* Broad glossy reflection from a light above-left. */}
      <feSpecularLighting
        in="dome"
        surfaceScale={surface}
        specularConstant="1.1"
        specularExponent="28"
        lightingColor="#ffffff"
        result="gloss"
      >
        <feDistantLight azimuth="225" elevation="48" />
      </feSpecularLighting>
      <feComposite in="gloss" in2="SourceAlpha" operator="in" result="glossIn" />

      {/* Tight pinpoint hotspots for the wet, liquid look. */}
      <feSpecularLighting
        in="dome"
        surfaceScale={surface * 1.4}
        specularConstant="1.4"
        specularExponent="90"
        lightingColor="#ffffff"
        result="sparkle"
      >
        <fePointLight x="-200" y="-300" z="260" />
      </feSpecularLighting>
      <feComposite in="sparkle" in2="SourceAlpha" operator="in" result="sparkleIn" />

      {/* Bright outer rim. */}
      <feMorphology in="SourceAlpha" operator="erode" radius={rim} result="rimInner" />
      <feComposite in="SourceAlpha" in2="rimInner" operator="out" result="rimMask" />
      <feFlood floodColor="#ffffff" floodOpacity="0.95" result="rimColor" />
      <feComposite in="rimColor" in2="rimMask" operator="in" result="rim" />

      {/* Thin second contour inset from the edge, the glass wall's inner surface. */}
      <feMorphology in="SourceAlpha" operator="erode" radius={innerRim} result="wallOuter" />
      <feMorphology in="SourceAlpha" operator="erode" radius={innerRim + rim * 0.6} result="wallInner" />
      <feComposite in="wallOuter" in2="wallInner" operator="out" result="wallMask" />
      <feFlood floodColor="#ffffff" floodOpacity="0.55" result="wallColor" />
      <feComposite in="wallColor" in2="wallMask" operator="in" result="wall" />
      <feGaussianBlur in="wall" stdDeviation="0.4" result="wallSoft" />

      {/* Soft halo around the letter on the dark background. */}
      <feGaussianBlur in="rimMask" stdDeviation={rim * 1.6} result="haloBlur" />
      <feFlood floodColor="#ffffff" floodOpacity="0.25" result="haloColor" />
      <feComposite in="haloColor" in2="haloBlur" operator="in" result="halo" />

      <feMerge>
        <feMergeNode in="halo" />
        <feMergeNode in="body" />
        <feMergeNode in="edgeGlow" />
        <feMergeNode in="glossIn" />
        <feMergeNode in="wallSoft" />
        <feMergeNode in="rim" />
        <feMergeNode in="sparkleIn" />
      </feMerge>
    </filter>
  )
}

export function GlassFilterDefs() {
  return (
    <svg aria-hidden="true" focusable="false" width="0" height="0" className="pointer-events-none absolute">
      <defs>
        <GlassFilter id="glass-text-lg" blur={5} rim={1.6} innerRim={4} surface={5} />
        <GlassFilter id="glass-text-sm" blur={1.6} rim={0.7} innerRim={1.6} surface={2.5} />
      </defs>
    </svg>
  )
}
