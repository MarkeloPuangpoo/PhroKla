"use client";

import { useState, useEffect } from 'react';

type Props = {
  formatOptions?: Intl.DateTimeFormatOptions;
  locale?: string;
};

export function ClientOnlyTimestamp({
  formatOptions = { year: 'numeric', month: 'long', day: 'numeric' },
  locale = 'th-TH'
}: Props) {
  const [dateString, setDateString] = useState('');

  // useEffect จะทำงานเฉพาะบน Client เท่านั้น
  // เราจึงตั้งค่า date string ที่นี่เพื่อหลีกเลี่ยง hydration mismatch
  useEffect(() => {
    setDateString(new Date().toLocaleDateString(locale, formatOptions));
  }, [locale, formatOptions]);

  // ระหว่างที่ยังไม่ hydrate (บน server และ client render แรก)
  // เราอาจจะยังไม่แสดงอะไรเลย หรือแสดง placeholder
  if (!dateString) {
    return null; // หรือ <span className="h-5 w-32 animate-pulse rounded-md bg-muted" />
  }

  return <span>{dateString}</span>;
}