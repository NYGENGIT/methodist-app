export const ghs = (n: number) =>
  'GHS ' + (n ?? 0).toLocaleString('en-GH', { maximumFractionDigits: 0 });
export const ghsK = (n: number) => {
  if (Math.abs(n) >= 1e6) return 'GHS ' + (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3) return 'GHS ' + (n / 1e3).toFixed(0) + 'K';
  return 'GHS ' + Math.round(n);
};
export const int = (n: number) => (n ?? 0).toLocaleString('en-GH');
export const pct = (n: number) => (n ?? 0).toFixed(1) + '%';
export const monthLabel = (m: string) => {
  const [y, mo] = m.split('-');
  const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${names[+mo - 1]} ${y}`;
};
export const COLORS = {
  navy: '#1f3a63', gold: '#c89b3c', teal: '#2a9d8f', brick: '#c0533f',
  steel: '#5b8bbf', deep: '#16294a',
};
export const SERIES = ['#1f3a63', '#c89b3c', '#2a9d8f', '#c0533f', '#5b8bbf', '#7a6fae', '#4c9a6b', '#b5793f'];
