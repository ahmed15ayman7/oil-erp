'use client';

import { useState, useEffect } from 'react';
import { TextField, InputAdornment } from '@mui/material';
import { IconSearch } from '@tabler/icons-react';
import { useDebounce } from '@/hooks/use-debounce';

interface SearchInputProps {
  onSearch: (value: string) => void;
  placeholder?: string;
  initialValue?: string;
}

export function SearchInput({
  onSearch,
  placeholder = 'بحث...',
  initialValue = '',
}: SearchInputProps) {
  const [value, setValue] = useState(initialValue);
  const debouncedValue = useDebounce(value, 500);

  useEffect(() => {
    onSearch(debouncedValue);
  }, [debouncedValue, onSearch]);

  return (
    <TextField
      fullWidth
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <IconSearch className="text-gray-400" size={20} />
          </InputAdornment>
        ),
      }}
      className="max-w-md"
    />
  );
}
