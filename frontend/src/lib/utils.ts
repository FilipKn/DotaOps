export function classNames(
  ...values: Array<string | false | null | undefined>
) {
  return values.filter(Boolean).join(" ");
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("sl-SI", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}
