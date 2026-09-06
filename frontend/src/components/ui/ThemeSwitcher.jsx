import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { resolveTheme } from '../../utils/theme';
import CustomSelect from './CustomSelect';

const STORAGE_KEY = 'vrum-theme';
const options = [
  { value: 'light', label: 'Sáng', icon: Sun },
  { value: 'dark', label: 'Tối', icon: Moon },
  { value: 'system', label: 'Theo hệ thống', icon: Monitor },
];

function readPreference() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return options.some(({ value }) => value === saved) ? saved : 'system';
  } catch {
    return 'system';
  }
}

export default function ThemeSwitcher({ className = '' }) {
  const [preference, setPreference] = useState(readPreference);

  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const theme = resolveTheme(preference, media.matches);
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#090909' : '#f4f4f4');
    };
    applyTheme();
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [preference]);

  const changeTheme = (value) => {
    setPreference(value);
    try { localStorage.setItem(STORAGE_KEY, value); } catch { /* Áp dụng trong phiên hiện tại. */ }
  };

  return (
    <CustomSelect className={`theme-switcher ${className}`} compact value={preference} onChange={changeTheme} options={options} ariaLabel="Chọn giao diện" />
  );
}
