import type React from "react";

const baseControlClass =
  "w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none ring-1 focus:ring-2 focus:ring-primary/25";

interface FormFieldWrapperProps {
  label?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

const FormFieldWrapper = ({
  label,
  error,
  children,
  className,
}: FormFieldWrapperProps) => {
  return (
    <div className={`space-y-1 ${className ?? ""}`.trim()}>
      {label && (
        <span className="block text-sm text-on-surface-variant">{label}</span>
      )}
      {children}
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
};

type InputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "className"
>;

interface TextInputProps extends InputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const TextInput = ({
  label,
  error,
  containerClassName,
  ...props
}: TextInputProps) => {
  return (
    <FormFieldWrapper
      label={label}
      error={error}
      className={containerClassName}
    >
      <input
        {...props}
        className={`${baseControlClass} ${error ? "ring-error" : "ring-transparent"}`}
      />
    </FormFieldWrapper>
  );
};

type TextAreaProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "className"
>;

interface FormTextAreaProps extends TextAreaProps {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const FormTextArea = ({
  label,
  error,
  containerClassName,
  ...props
}: FormTextAreaProps) => {
  return (
    <FormFieldWrapper
      label={label}
      error={error}
      className={containerClassName}
    >
      <textarea
        {...props}
        className={`${baseControlClass} min-h-28 ${error ? "ring-error" : "ring-transparent"}`}
      />
    </FormFieldWrapper>
  );
};

interface SelectOption {
  label: string;
  value: string;
}

type SelectProps = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "className"
>;

interface FormSelectProps extends SelectProps {
  label?: string;
  error?: string;
  options: SelectOption[];
  containerClassName?: string;
}

export const FormSelect = ({
  label,
  error,
  options,
  containerClassName,
  ...props
}: FormSelectProps) => {
  return (
    <FormFieldWrapper
      label={label}
      error={error}
      className={containerClassName}
    >
      <select
        {...props}
        className={`${baseControlClass} ${error ? "ring-error" : "ring-transparent"}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormFieldWrapper>
  );
};

