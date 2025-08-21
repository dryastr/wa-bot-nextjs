import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import type { SelectProps } from '@radix-ui/react-select'; 

interface FilterOption {
  value: string;
  label: string;
}

interface StatusFilterProps extends Omit<SelectProps, 'children'> {
  placeholder?: string;
  options: FilterOption[];
}

export function StatusFilter({ placeholder = "Filter...", options, ...props }: StatusFilterProps) {
  return (
    <Select {...props}>
      <SelectTrigger className="w-[140px] text-sm">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}