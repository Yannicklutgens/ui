import { ReactNode, useState } from "react";
import { Button } from "./Button";
import { Field } from "./Field";

export interface CopyFieldProps {
  label?: ReactNode;
  value: string;
  multiline?: boolean;
  rows?: number;
  className?: string;
}

export function CopyField({ label, value, multiline = false, rows = 4, className }: CopyFieldProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Field label={label} className={["copy-field", className].filter(Boolean).join(" ")}>
      <div className="copy-field-row">
        {multiline ? <textarea value={value} rows={rows} readOnly /> : <input value={value} readOnly />}
        <Button type="button" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </Field>
  );
}
