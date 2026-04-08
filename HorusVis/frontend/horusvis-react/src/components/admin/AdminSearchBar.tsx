import { useEffect, useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export default function AdminSearchBar({ value, onChange }: Props) {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    setLocalValue(newValue);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, 300);
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <input
      type="search"
      placeholder="Search users..."
      value={localValue}
      onChange={handleChange}
      style={{
        width: "100%",
        padding: "0.5rem 0.75rem",
        borderRadius: "0.375rem",
        border: "1px solid #d1d5db",
      }}
    />
  );
}
