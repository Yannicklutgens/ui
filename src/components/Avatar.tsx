import { HTMLAttributes, ReactNode, isValidElement, useEffect, useState } from "react";

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  /** Image URL. Without it, or when it fails to load, the first letter of `mainline` is shown. */
  src?: string;
  /** Main line, e.g. the username. */
  mainline: ReactNode;
  /** Optional smaller line below the main line. */
  subline?: ReactNode;
  /** Image diameter in px (default 40). */
  size?: number;
}

export function Avatar({ src, mainline, subline, size = 40, className, ...rest }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  const name = textOf(mainline).trim();
  const showImage = src && !failed;

  return (
    <div className={["avatar", className].filter(Boolean).join(" ")} {...rest}>
      {showImage ? (
        <img className="avatar-image" src={src} alt={name} width={size} height={size} onError={() => setFailed(true)} />
      ) : (
        <span
          className="avatar-image avatar-initial"
          aria-hidden
          style={{ width: size, height: size, fontSize: size * 0.42, background: colorFor(name) }}
        >
          {name.charAt(0).toUpperCase()}
        </span>
      )}
      <div className="avatar-text">
        <div className="avatar-mainline">{mainline}</div>
        {subline && <div className="avatar-subline">{subline}</div>}
      </div>
    </div>
  );
}

// plain text of a node, so `<>Steam <span>…</span></>` still yields "Steam …"
function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

// same name, same color
function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return `hsl(${Math.abs(hash) % 360}, 45%, 42%)`;
}
