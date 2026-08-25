export interface TabItem {
  key: string;
  label: string;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (key: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={tab.key === active ? "active" : undefined}
          disabled={tab.disabled}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
