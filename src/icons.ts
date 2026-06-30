// Inline SVG icon set — stroke-based, monochrome, inherits currentColor.
// Keeps the UI crisp at any density instead of relying on unicode glyphs.

type IconOpts = { size?: number; stroke?: number; fill?: boolean };

function svg(path: string, { size = 24, stroke = 1.9 }: IconOpts = {}): string {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none"
    stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round"
    stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

export const icon = {
  jobs: (o?: IconOpts) =>
    svg(
      `<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7"/><path d="M3 12h18"/>`,
      o
    ),
  today: (o?: IconOpts) =>
    svg(`<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>`, o),
  materials: (o?: IconOpts) =>
    svg(
      `<path d="M12 3.2l1.7 4.6 4.6 1.7-4.6 1.7L12 15.8l-1.7-4.6L5.7 9.5l4.6-1.7z"/><path d="M18.5 14.5l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z"/>`,
      o
    ),
  chevronRight: (o?: IconOpts) => svg(`<path d="M9 6l6 6-6 6"/>`, { stroke: 2, ...o }),
  chevronLeft: (o?: IconOpts) => svg(`<path d="M15 6l-6 6 6 6"/>`, { stroke: 2.1, ...o }),
  plus: (o?: IconOpts) => svg(`<path d="M12 5v14M5 12h14"/>`, { stroke: 2, ...o }),
  check: (o?: IconOpts) => svg(`<path d="M5 12.5l4.2 4.2L19 7"/>`, { stroke: 2.4, ...o }),
  copy: (o?: IconOpts) =>
    svg(
      `<rect x="9" y="9" width="11" height="11" rx="2.2"/><path d="M5.5 15A2 2 0 0 1 4 13.1V5.5A1.5 1.5 0 0 1 5.5 4h7.6A2 2 0 0 1 15 5.5"/>`,
      o
    ),
  doc: (o?: IconOpts) =>
    svg(
      `<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 16.5h6"/>`,
      o
    ),
  link: (o?: IconOpts) => svg(`<path d="M7 17L17 7"/><path d="M8.5 7H17v8.5"/>`, { stroke: 2, ...o }),
  mail: (o?: IconOpts) =>
    svg(`<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="M4.5 7.5l7.5 5 7.5-5"/>`, o),
  download: (o?: IconOpts) =>
    svg(`<path d="M12 4v11"/><path d="M8 11.5l4 4 4-4"/><path d="M5 20h14"/>`, { stroke: 2, ...o }),
  upload: (o?: IconOpts) =>
    svg(`<path d="M12 20V9"/><path d="M8 12.5l4-4 4 4"/><path d="M5 4h14"/>`, { stroke: 2, ...o }),
  inbox: (o?: IconOpts) =>
    svg(
      `<path d="M4 13l2.2-7A2 2 0 0 1 8.1 4.6h7.8A2 2 0 0 1 17.8 6L20 13v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M4 13h4l1.5 2.5h5L16 13h4"/>`,
      o
    ),
  sparkleSm: (o?: IconOpts) =>
    svg(`<path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6z"/>`, { stroke: 1.7, ...o }),
  flag: (o?: IconOpts) =>
    svg(`<path d="M6 21V4"/><path d="M6 5h11l-2.2 3.5L17 12H6"/>`, { stroke: 2, ...o }),
};
