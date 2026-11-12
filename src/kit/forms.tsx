"use client";

// Fixed by Horizon: don't change this file. Horizon's own components, built on shadcn/ui for now.
import { cn } from "cn";
import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select as UiSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";

type Option = { value: string; label: string };

function Labelled({ id, label, hint, error, children }: { id: string; label: ReactNode; hint?: ReactNode; error?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, hint?: ReactNode, error?: ReactNode) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}

type FieldProps = Omit<ComponentProps<"input">, "onChange" | "id"> & {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Hands back the text. Leave it off in a form that's sent as it is (give it a name instead). */
  onChange?: (value: string) => void;
};

/** A labelled text box. Give it a name (and defaultValue) inside a form, or value and onChange. */
export function Field({ label, hint, error, onChange, className, ...props }: FieldProps) {
  const id = useId();

  return (
    <Labelled id={id} label={label} hint={hint} error={error}>
      <Input
        {...props}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        className={cn("max-md:h-11", className)}
      />
    </Labelled>
  );
}

type TextAreaProps = Omit<ComponentProps<"textarea">, "onChange" | "id"> & {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  onChange?: (value: string) => void;
};

/** A labelled box for longer text. */
export function TextArea({ label, hint, error, onChange, ...props }: TextAreaProps) {
  const id = useId();

  return (
    <Labelled id={id} label={label} hint={hint} error={error}>
      <Textarea
        {...props}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
      />
    </Labelled>
  );
}

type SelectProps = {
  label?: ReactNode;
  /** For a select without a label, such as a filter in a toolbar. */
  ariaLabel?: string;
  hint?: ReactNode;
  options: Option[];
  placeholder?: string;
  className?: string;
  /** Controlled: value and onChange. In a form that's sent as it is: name (and defaultValue, required). */
  value?: string;
  onChange?: (value: string) => void;
  name?: string;
  defaultValue?: string;
  required?: boolean;
};

/** Choose one from a list. options: [{ value, label }]. */
export function Select({ label, ariaLabel, hint, value, onChange, options, placeholder, className, name, defaultValue, required }: SelectProps) {
  const id = useId();
  const select = (
    <UiSelect value={value} defaultValue={defaultValue} onValueChange={onChange} name={name} required={required}>
      <SelectTrigger
        id={id}
        aria-label={label ? undefined : ariaLabel}
        aria-describedby={label ? describedBy(id, hint) : undefined}
        className={cn("w-full max-md:h-11! md:w-56", className)}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </UiSelect>
  );

  return label ? (
    <Labelled id={id} label={label} hint={hint}>
      {select}
    </Labelled>
  ) : (
    select
  );
}

type SegmentedProps = {
  options: Option[];
  /** A label shown above it (in a form), or ariaLabel when there's no room for one (a filter). */
  label?: ReactNode;
  ariaLabel?: string;
  /** Controlled: value and onChange. In a form that's sent as it is: name and defaultValue. */
  value?: string;
  onChange?: (value: string) => void;
  name?: string;
  defaultValue?: string;
};

/** A few choices side by side, one picked, for filtering, switching a view or a short choice in a form. options: [{ value, label }]. */
export function Segmented({ value, onChange, options, ariaLabel, label, name, defaultValue }: SegmentedProps) {
  const id = useId();
  const [own, setOwn] = useState(defaultValue ?? options[0]?.value ?? "");
  const current = value ?? own;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span id={id} className="text-sm leading-none font-medium select-none">
          {label}
        </span>
      )}
      <ToggleGroup
        type="single"
        variant="outline"
        value={current}
        onValueChange={(next) => {
          if (!next) return;
          setOwn(next);
          onChange?.(next);
        }}
        aria-label={label ? undefined : ariaLabel}
        aria-labelledby={label ? id : undefined}
        className="w-fit"
      >
        {options.map((option) => (
          <ToggleGroupItem key={option.value} value={option.value} className="max-md:h-11">
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {name && <input type="hidden" name={name} value={current} />}
    </div>
  );
}
