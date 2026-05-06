import type { VisitResponse } from '../types';

const SEP = ';';

function esc(v: string | number | null | undefined): string {
  if (v == null) return '';
  const s = String(v);
  if (s.includes(SEP) || s.includes('"') || s.includes('\n'))
    return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pl-PL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function exportVisitsCSV(visits: VisitResponse[], headers: Record<string, string>): void {
  const cols: Array<{ header: string; value: (v: VisitResponse) => string | number | null }> = [
    { header: headers.date,       value: v => formatDate(v.createdAt) },
    { header: headers.animalName, value: v => v.animalName },
    { header: headers.species,    value: v => v.species },
    { header: headers.breed,      value: v => v.breed ?? '' },
    { header: headers.gender,     value: v => v.gender },
    { header: headers.age,        value: v => v.ageYears ?? '' },
    { header: headers.weight,     value: v => v.weightKg ?? '' },
    { header: headers.owner,      value: v => v.ownerFullName },
    { header: headers.phone,      value: v => v.ownerPhone },
    { header: headers.reason,     value: v => v.reason },
    { header: headers.category,   value: v => v.triageCategory },
    { header: headers.waitMin,    value: v => v.triageCategory === 'RED' ? '' : v.waitingMinutes },
    { header: headers.status,     value: v => v.status },
  ];

  const headerRow = cols.map(c => esc(c.header)).join(SEP);
  const rows = visits.map(v => cols.map(c => esc(c.value(v))).join(SEP));
  const csv = '﻿' + [headerRow, ...rows].join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const date = new Date().toISOString().slice(0, 10);
  a.download = `vettriage_historia_${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
