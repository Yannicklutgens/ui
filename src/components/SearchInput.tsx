import { InputHTMLAttributes, KeyboardEvent } from "react";
import { Icon } from "./Icon";

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Called when Escape is pressed, e.g. to clear the search. */
  onClear?: () => void;
}

/**
 * A search box with a search icon. `className` and `style` go on the wrapper, everything else on the input.
 * Inside a PageHeader's actions it takes its own full-width line on small screens.
 */
export function SearchInput({ onClear, onKeyDown, className, style, ...rest }: SearchInputProps) {
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(e);
    if (e.key === "Escape" && onClear && !e.defaultPrevented) onClear();
  }

  return (
    <span className={["search-input", className].filter(Boolean).join(" ")} style={style}>
      <Icon name="search" type="outline" />
      <input type="search" onKeyDown={handleKeyDown} {...rest} />
    </span>
  );
}
