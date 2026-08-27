export function focusManualWorkoutDialogCloseOnOpen(event: Event) {
  event.preventDefault();

  const dialogContent = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
  window.requestAnimationFrame(() => {
    dialogContent
      ?.querySelector<HTMLButtonElement>("[data-hito-dialog-close]")
      ?.focus({ preventScroll: true });
  });
}
