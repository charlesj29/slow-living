// What kind of device the visitor is on (render and UI both ask).

/** Phones and tablets: touch first, no hover. Desktops with a touch screen still count as desktop. */
export function isTouchFirst(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(hover: none) and (pointer: coarse)').matches
  );
}
