import type { SVGProps } from "react";
import type { TablerIcon } from "@tabler/icons-react";
import {
  IconActivity,
  IconAlertCircle,
  IconApple,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUpRight,
  IconCalendarClock,
  IconCalendarMonth,
  IconCalendarX,
  IconCamera,
  IconChartLine,
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconCircle,
  IconCircleCheck,
  IconCircleX,
  IconCopy,
  IconDeviceWatch,
  IconDots,
  IconDownload,
  IconEye,
  IconEyeOff,
  IconFileText,
  IconFileUpload,
  IconJson,
  IconLoader2,
  IconLogout,
  IconMail,
  IconMinus,
  IconNotebook,
  IconPencil,
  IconPhoto,
  IconPlug,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconSettings,
  IconSettings2,
  IconShieldExclamation,
  IconSparkles,
  IconTrash,
  IconTrophy,
  IconUpload,
  IconUserCircle,
  IconX,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";

export const HITO_ICON_SIZES = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
} as const;

export const HITO_ICON_META = [
  { name: "calendar", category: "navigation", label: "Calendar" },
  { name: "progress", category: "navigation", label: "Progress" },
  { name: "connections", category: "navigation", label: "Connections" },
  { name: "workout", category: "navigation", label: "Workout" },
  { name: "arrow-left", category: "navigation", label: "Arrow left" },
  { name: "arrow-right", category: "navigation", label: "Arrow right" },
  { name: "arrow-up-right", category: "navigation", label: "Arrow up right" },
  { name: "chevron-down", category: "utility", label: "Chevron down" },
  { name: "chevron-left", category: "utility", label: "Chevron left" },
  { name: "chevron-right", category: "utility", label: "Chevron right" },
  { name: "chevron-up", category: "utility", label: "Chevron up" },
  { name: "close", category: "utility", label: "Close" },
  { name: "copy", category: "utility", label: "Copy" },
  { name: "more-horizontal", category: "utility", label: "More horizontal" },
  { name: "search", category: "utility", label: "Search" },
  { name: "visibility", category: "utility", label: "Visibility" },
  { name: "visibility-off", category: "utility", label: "Visibility off" },
  { name: "loader", category: "utility", label: "Loader" },
  { name: "check", category: "status", label: "Check" },
  { name: "check-circle", category: "status", label: "Check circle" },
  { name: "minus", category: "status", label: "Minus" },
  { name: "warning", category: "status", label: "Warning" },
  { name: "x-circle", category: "status", label: "Cross circle" },
  { name: "circle", category: "status", label: "Circle" },
  { name: "import", category: "data/import", label: "Import" },
  { name: "download", category: "data/import", label: "Download" },
  { name: "upload", category: "data/import", label: "Upload" },
  { name: "file-text", category: "data/import", label: "Text file" },
  { name: "file-up", category: "data/import", label: "File upload" },
  { name: "user", category: "account/settings", label: "User" },
  { name: "settings", category: "account/settings", label: "Settings" },
  { name: "logout", category: "account/settings", label: "Logout" },
  { name: "mail", category: "account/settings", label: "Mail" },
  { name: "camera", category: "account/settings", label: "Camera" },
  { name: "activity", category: "feedback/workout", label: "Activity" },
  { name: "plan-note", category: "feedback/workout", label: "Plan note" },
  { name: "refresh", category: "feedback/workout", label: "Refresh" },
  { name: "sparkles", category: "feedback/workout", label: "Sparkles" },
  { name: "trophy", category: "feedback/workout", label: "Trophy" },
  { name: "trash", category: "actions", label: "Trash" },
  { name: "plus", category: "actions", label: "Plus" },
  { name: "edit", category: "actions", label: "Edit" },
  { name: "clear-calendar", category: "actions", label: "Clear calendar" },
  { name: "calendar-clock", category: "feedback/workout", label: "Calendar clock" },
  { name: "shield-alert", category: "feedback/workout", label: "Shield alert" },
  { name: "watch", category: "feedback/workout", label: "Watch" },
  { name: "apple", category: "feedback/workout", label: "Apple" },
  { name: "image", category: "data/import", label: "Image" },
  { name: "cog", category: "account/settings", label: "Cog" },
] as const;

export type HitoIconName = (typeof HITO_ICON_META)[number]["name"];
export type HitoIconSize = keyof typeof HITO_ICON_SIZES;
export type HitoIconCategory = (typeof HITO_ICON_META)[number]["category"];

const HITO_ICON_COMPONENTS: Record<HitoIconName, TablerIcon> = {
  calendar: IconCalendarMonth,
  progress: IconChartLine,
  connections: IconPlug,
  workout: IconActivity,
  "arrow-left": IconArrowLeft,
  "arrow-right": IconArrowRight,
  "arrow-up-right": IconArrowUpRight,
  "chevron-down": IconChevronDown,
  "chevron-left": IconChevronLeft,
  "chevron-right": IconChevronRight,
  "chevron-up": IconChevronUp,
  close: IconX,
  copy: IconCopy,
  "more-horizontal": IconDots,
  search: IconSearch,
  visibility: IconEye,
  "visibility-off": IconEyeOff,
  loader: IconLoader2,
  check: IconCheck,
  "check-circle": IconCircleCheck,
  minus: IconMinus,
  warning: IconAlertCircle,
  "x-circle": IconCircleX,
  circle: IconCircle,
  import: IconJson,
  download: IconDownload,
  upload: IconUpload,
  "file-text": IconFileText,
  "file-up": IconFileUpload,
  user: IconUserCircle,
  settings: IconSettings2,
  logout: IconLogout,
  mail: IconMail,
  camera: IconCamera,
  activity: IconActivity,
  "plan-note": IconNotebook,
  refresh: IconRefresh,
  sparkles: IconSparkles,
  trophy: IconTrophy,
  trash: IconTrash,
  plus: IconPlus,
  edit: IconPencil,
  "clear-calendar": IconCalendarX,
  "calendar-clock": IconCalendarClock,
  "shield-alert": IconShieldExclamation,
  watch: IconDeviceWatch,
  apple: IconApple,
  image: IconPhoto,
  cog: IconSettings,
};

type IconProps = Omit<SVGProps<SVGSVGElement>, "aria-label" | "role"> & {
  name: HitoIconName;
  size?: HitoIconSize;
  label?: string;
  decorative?: boolean;
};

export function Icon({
  name,
  size = "sm",
  className,
  decorative = true,
  label,
  strokeWidth,
  ...props
}: IconProps) {
  const IconComponent = HITO_ICON_COMPONENTS[name];
  const resolvedSize = HITO_ICON_SIZES[size];
  const resolvedStrokeWidth = strokeWidth ?? (size === "xs" || size === "sm" ? 1.75 : 1.5);

  return (
    <IconComponent
      aria-hidden={decorative ? true : undefined}
      aria-label={!decorative ? label : undefined}
      className={cn("hito-icon shrink-0", className)}
      focusable="false"
      role={decorative ? undefined : "img"}
      {...props}
      size={resolvedSize}
      stroke={resolvedStrokeWidth}
    />
  );
}
