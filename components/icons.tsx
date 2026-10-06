export function IconPlate(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.5" />
    </svg>
  );
}
export function IconTag(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="M4 12.5 11.5 5H19v7.5L11.5 20 4 12.5Z" />
      <circle cx="15" cy="9" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
export function IconCrate(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="M4 8h16v11H4zM4 12h16M8 8V5h8v3" />
    </svg>
  );
}
export function IconCard(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}
export function IconMenu(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="M7 4h10v16H7zM7 9h10M10 4v5" />
    </svg>
  );
}
export function IconScale(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="M12 4v14M8 20h8M12 7l-6 6h4M12 7l6 6h-4" />
    </svg>
  );
}
export function IconLine(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="M4 16c2-5 4-5 6 0s4 5 6 0 2-4 4-2" />
      <path d="M4 8h16" />
    </svg>
  );
}
export function IconBars(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="M5 19V10M12 19V5M19 19v-7" />
    </svg>
  );
}
export function IconFlame(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="M12 3s5 4.5 5 9a5 5 0 0 1-10 0c0-2 1.2-3.5 2-4.5C10 9 11 10 12 10c0-2.5 0-5 0-7Z" />
    </svg>
  );
}
export function IconDial(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 12l4-2" />
    </svg>
  );
}
export function IconSearch(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <circle cx="11" cy="11" r="6" />
      <path d="M16 16l4 4" />
    </svg>
  );
}
export function IconPlus(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
export function IconBell(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2H4.5L6 16Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}
export function IconClose(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

type IconProps = { className?: string };
function base(props: IconProps) {
  return {
    className: props.className ?? "h-5 w-5",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
}
