import { CSSProperties, HTMLAttributes } from "react";

const registry = new Map<string, string>();

const DATA_URL_PREFIX = /^data:image\/svg\+xml(;utf8)?,/;

/**
 * Registers SVG icons by name, e.g. `registerIcons({ home, homeOutline })` with icons from
 * `ionicons/icons`. Accepts raw SVG markup or `data:image/svg+xml` URLs.
 */
export function registerIcons(icons: Record<string, string>) {
  for (const [key, value] of Object.entries(icons)) {
    let svg = value.replace(DATA_URL_PREFIX, "");
    if (svg.startsWith("%3C")) svg = decodeURIComponent(svg);
    registry.set(key, svg);
  }
}

export type IconType = "solid" | "outline" | "sharp";

export interface IconProps extends Omit<HTMLAttributes<HTMLSpanElement>, "color"> {
  /** Registered icon name ("home", "arrow-back"), or a path/URL to a custom image. */
  name: string;
  type?: IconType;
  /** CSS colour or a token name: accent, danger, success, warning, muted, faint. */
  color?: string;
  /** Number in px or any CSS length. Defaults to 1em so it scales with the text. */
  size?: number | string;
}

const TYPE_SUFFIX: Record<IconType, string> = {
  solid: "",
  outline: "Outline",
  sharp: "Sharp",
};

const TOKEN_COLORS: Record<string, string> = {
  accent: "var(--accent)",
  danger: "var(--danger)",
  success: "var(--success)",
  warning: "var(--warning)",
  muted: "var(--text-muted)",
  faint: "var(--text-faint)",
};

function toCamel(name: string) {
  return name.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

export function Icon({ name, type = "solid", color, size, className, style, ...rest }: IconProps) {
  const svg = registry.get(toCamel(name) + TYPE_SUFFIX[type]);
  const dimension = typeof size === "number" ? `${size}px` : size;
  const a11y = rest["aria-label"] ? { role: "img" } : { "aria-hidden": true };

  const baseStyle: CSSProperties = {
    color: color ? (TOKEN_COLORS[color] ?? color) : undefined,
    width: dimension,
    height: dimension,
    ...style,
  };

  if (svg) {
    return (
      <span
        className={["icon", className].filter(Boolean).join(" ")}
        style={baseStyle}
        dangerouslySetInnerHTML={{ __html: svg }}
        {...a11y}
        {...rest}
      />
    );
  }

  // not a registered icon: treat the name as a path to a custom image, tinted via a mask
  const url = `url("${name.replace(/"/g, '\\"')}")`;
  return (
    <span
      className={["icon", "icon-custom", className].filter(Boolean).join(" ")}
      style={{ ...baseStyle, maskImage: url, WebkitMaskImage: url }}
      {...a11y}
      {...rest}
    />
  );
}
