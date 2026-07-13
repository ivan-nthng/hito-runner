export function focusManualWorkoutDialogCloseOnOpen(event: Event) {
  event.preventDefault();

  const dialogContent = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
  window.requestAnimationFrame(() => {
    dialogContent
      ?.querySelector<HTMLButtonElement>(".hito-ui-dialog-close")
      ?.focus({ preventScroll: true });
  });
}
