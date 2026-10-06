import { Coordenador } from '../types';

export interface TeacherColorConfig {
  id: string;
  name: string;
  // Screen / Tailwind styles
  bg: string;
  border: string;
  text: string;
  badge: string;
  // Print / Hex styles
  printBg: string;
  printBorder: string;
  printBorderLeft: string;
  printText: string;
  printBadgeBg: string;
  printBadgeText: string;
}

export const TEACHER_COLOR_PALETTE: TeacherColorConfig[] = [
  {
    id: 'blue',
    name: 'Azul',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    badge: 'bg-blue-100 text-blue-700',
    printBg: '#eff6ff',
    printBorder: '#bfdbfe',
    printBorderLeft: '#2563eb',
    printText: '#1e40af',
    printBadgeBg: '#dbeafe',
    printBadgeText: '#1d4ed8'
  },
  {
    id: 'emerald',
    name: 'Verde Esmeralda',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-800',
    badge: 'bg-emerald-100 text-emerald-700',
    printBg: '#ecfdf5',
    printBorder: '#a7f3d0',
    printBorderLeft: '#059669',
    printText: '#065f46',
    printBadgeBg: '#d1fae5',
    printBadgeText: '#047857'
  },
  {
    id: 'violet',
    name: 'Violeta / Roxo',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    text: 'text-violet-800',
    badge: 'bg-violet-100 text-violet-700',
    printBg: '#f5f3ff',
    printBorder: '#ddd6fe',
    printBorderLeft: '#7c3aed',
    printText: '#5b21b6',
    printBadgeBg: '#ede9fe',
    printBadgeText: '#6d28d9'
  },
  {
    id: 'rose',
    name: 'Rosa Coral / Carmim',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-800',
    badge: 'bg-rose-100 text-rose-700',
    printBg: '#fff1f2',
    printBorder: '#fecdd3',
    printBorderLeft: '#e11d48',
    printText: '#9f1239',
    printBadgeBg: '#ffe4e6',
    printBadgeText: '#be123c'
  },
  {
    id: 'amber',
    name: 'Âmbar / Dourado',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    badge: 'bg-amber-100 text-amber-700',
    printBg: '#fffbeb',
    printBorder: '#fde68a',
    printBorderLeft: '#d97706',
    printText: '#92400e',
    printBadgeBg: '#fef3c7',
    printBadgeText: '#b45309'
  },
  {
    id: 'cyan',
    name: 'Ciano / Turquesa',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    text: 'text-cyan-800',
    badge: 'bg-cyan-100 text-cyan-700',
    printBg: '#ecfeff',
    printBorder: '#a5f3fc',
    printBorderLeft: '#0891b2',
    printText: '#155e75',
    printBadgeBg: '#cffafe',
    printBadgeText: '#0e7490'
  },
  {
    id: 'pink',
    name: 'Rosa Pink',
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    text: 'text-pink-800',
    badge: 'bg-pink-100 text-pink-700',
    printBg: '#fdf2f8',
    printBorder: '#fbcfe8',
    printBorderLeft: '#db2777',
    printText: '#9d174d',
    printBadgeBg: '#fce7f3',
    printBadgeText: '#be185d'
  },
  {
    id: 'teal',
    name: 'Verde Água / Petróleo',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    text: 'text-teal-800',
    badge: 'bg-teal-100 text-teal-700',
    printBg: '#f0fdfa',
    printBorder: '#99f6e4',
    printBorderLeft: '#0d9488',
    printText: '#115e59',
    printBadgeBg: '#ccfbf1',
    printBadgeText: '#0f766e'
  },
  {
    id: 'indigo',
    name: 'Índigo',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-800',
    badge: 'bg-indigo-100 text-indigo-700',
    printBg: '#eef2ff',
    printBorder: '#c7d2fe',
    printBorderLeft: '#4f46e5',
    printText: '#3730a3',
    printBadgeBg: '#e0e7ff',
    printBadgeText: '#4338ca'
  },
  {
    id: 'lime',
    name: 'Verde Limão',
    bg: 'bg-lime-50',
    border: 'border-lime-200',
    text: 'text-lime-800',
    badge: 'bg-lime-100 text-lime-700',
    printBg: '#f7fee7',
    printBorder: '#d9f99d',
    printBorderLeft: '#65a30d',
    printText: '#3f6212',
    printBadgeBg: '#ecfccb',
    printBadgeText: '#4d7c0f'
  },
  {
    id: 'orange',
    name: 'Laranja',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-800',
    badge: 'bg-orange-100 text-orange-700',
    printBg: '#fff7ed',
    printBorder: '#fed7aa',
    printBorderLeft: '#ea580c',
    printText: '#9a3412',
    printBadgeBg: '#ffedd5',
    printBadgeText: '#c2410c'
  },
  {
    id: 'fuchsia',
    name: 'Fúcsia / Magenta',
    bg: 'bg-fuchsia-50',
    border: 'border-fuchsia-200',
    text: 'text-fuchsia-800',
    badge: 'bg-fuchsia-100 text-fuchsia-700',
    printBg: '#fdf4ff',
    printBorder: '#f5d0fe',
    printBorderLeft: '#c026d3',
    printText: '#86198f',
    printBadgeBg: '#fae8ff',
    printBadgeText: '#a21caf'
  }
];

export const buildTeacherColorMap = (
  teachers: Coordenador[] = []
): Record<string, TeacherColorConfig> => {
  const map: Record<string, TeacherColorConfig> = {};
  teachers.forEach((t, i) => {
    if (t && t.id) {
      map[t.id] = TEACHER_COLOR_PALETTE[i % TEACHER_COLOR_PALETTE.length];
    }
  });
  return map;
};

export const DEFAULT_TEACHER_COLOR: TeacherColorConfig = TEACHER_COLOR_PALETTE[0];

export const isInvalidCoordinatorName = (name?: string | null): boolean => {
  if (!name) return true;
  const norm = name.trim().toLowerCase();
  const invalid = [
    'não tem',
    'nao tem',
    'não há',
    'nao ha',
    'sem coordenador',
    'sem coordenadora',
    'sem coordenacao',
    'sem coordenação',
    'não atribuído',
    'nao atribuido',
    'n/a',
    'na',
    '-',
    '--',
    '---',
    'nenhum',
    'nenhuma',
    'null',
    'undefined'
  ];
  return invalid.includes(norm) || norm.length < 2;
};
