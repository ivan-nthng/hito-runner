import type { CSSProperties, HTMLAttributes } from "react";

import { workoutFamilyColorToken } from "@/lib/workout-color-tokens";
import type { CanonicalWorkoutFamily } from "@/lib/rich-workout-model";
import { cn } from "@/lib/utils";

export const HITO_MARK_SIZES = {
  xs: {
    className: "size-8",
    pixels: 32,
    placement: "Supporting",
    tileRadiusClassName: "rounded-lg",
    tileRadiusToken: "--radius-lg",
  },
  sm: {
    className: "size-10",
    pixels: 40,
    placement: "Compact navigation",
    tileRadiusClassName: "rounded-xl",
    tileRadiusToken: "--radius-xl",
  },
  md: {
    className: "size-16",
    pixels: 64,
    placement: "Decoration",
    tileRadiusClassName: "rounded-2xl",
    tileRadiusToken: "--radius-2xl",
  },
  lg: {
    className: "size-32",
    pixels: 128,
    placement: "Large content",
    tileRadiusClassName: "rounded-3xl",
    tileRadiusToken: "--radius-3xl",
  },
  hero: {
    className: "size-64",
    pixels: 256,
    placement: "Identity / marketing",
    tileRadiusClassName: "rounded-4xl",
    tileRadiusToken: "--radius-4xl",
  },
} as const;

export const HITO_MARK_SHAPES = ["tile", "circle"] as const;
export const HITO_MARK_BACKGROUNDS = ["solid", "surface"] as const;

export type HitoMarkSize = keyof typeof HITO_MARK_SIZES;
export type HitoMarkShape = (typeof HITO_MARK_SHAPES)[number];
export type HitoMarkBackground = (typeof HITO_MARK_BACKGROUNDS)[number];

export type HitoMarkBackgroundOption = {
  readonly frameToken: string;
  readonly glyphToken: string;
  readonly label: string;
  readonly value: HitoMarkBackground;
};

type SurfaceMarkDefinition = {
  family: "surface";
  frameToken: string;
  glyphToken: string;
  contentToken: string;
};

type WorkoutMarkDefinition = {
  family: "workout";
};

type MarkDefinition = (SurfaceMarkDefinition | WorkoutMarkDefinition) & {
  label: string;
  opticalFit: number;
  paths: readonly string[];
  viewBox: string;
};

const HITO_MARK_DEFINITIONS = {
  rest: {
    family: "workout",
    label: "Rest",
    opticalFit: 0.58,
    viewBox: "0 0 116 132",
    paths: [
      "M115.084 113.219C111.884 135.949 42.4438 133.139 15.5838 128.569C11.1538 127.819 5.44386 125.649 1.73386 123.589C-2.58614 115.459 1.54382 105.959 9.94382 102.069C36.7538 89.6587 66.5638 87.3087 95.4738 94.0487C106.954 96.7187 116.464 103.409 115.074 113.229L115.084 113.219Z",
      "M94.6639 74.1087C71.9139 85.8287 46.2539 88.4687 21.6039 83.5387C17.7639 82.7687 12.1039 79.9987 10.5739 77.0887C6.39388 69.1787 10.5439 60.9587 17.6039 56.7087C34.6339 46.4587 53.9839 43.6187 73.9539 44.6787C88.5039 45.4487 103.594 49.8287 102.844 61.8487C102.594 65.8387 99.5839 71.5787 94.6639 74.1087Z",
      "M80.3139 17.7687C81.6039 34.8287 48.1438 45.8487 22.4938 38.2787C16.4738 36.4987 12.1239 31.2687 11.3539 25.8587C8.56389 6.25873 44.5839 -8.16127 71.7539 5.17873C76.8939 7.69873 79.9539 12.9887 80.3139 17.7687Z",
    ],
  },
  recovery: {
    family: "workout",
    label: "Recovery",
    opticalFit: 0.62,
    viewBox: "0 0 97 131",
    paths: [
      "M33.772 129.53C7.17198 117.13 -0.138037 86.89 0.00196344 58.13C13.612 66.02 23.1019 76.91 30.9619 89.75C33.4819 93.87 35.722 96.92 39.892 101.48L36.692 86.51C33.822 73.08 30.282 60.03 30.192 46.1C30.082 30.17 32.262 14.59 40.682 0C53.182 21.27 58.7119 44.29 60.1119 67.86L61.8419 96.83L72.942 65.87C76.922 54.77 84.162 45.65 94.062 37.8C101.172 74.71 93.2019 99.88 71.8419 129.48C59.0919 131.34 47.042 131.36 33.772 129.54V129.53Z",
    ],
  },
  easy: {
    family: "workout",
    label: "Easy",
    opticalFit: 0.56,
    viewBox: "0 0 101 93",
    paths: [
      "M44.046 81.9435C34.056 94.4535 14.5459 97.0435 4.72592 83.8235C-5.76408 69.7035 2.13587 50.4535 19.2959 43.4935C9.15587 33.7835 4.5859 20.5535 12.7059 9.38349C16.5859 4.05349 23.2759 2.04349 29.9559 3.03349C34.9459 3.76349 39.9859 7.79349 44.7359 12.9435C49.6059 4.47349 57.5858 -0.816512 66.8858 0.103488C74.4158 0.843488 80.046 6.07349 81.276 13.8135C82.326 20.4435 79.8359 26.7835 76.7459 34.0535C92.5459 37.3135 101.836 49.9935 100.176 65.2435C98.9959 76.0535 92.616 85.3235 83.536 88.6735C63.716 96.0035 53.876 80.7135 49.026 79.1335C47.886 78.7635 45.2358 80.4635 44.0558 81.9335L44.046 81.9435Z",
    ],
  },
  steady: {
    family: "workout",
    label: "Steady",
    opticalFit: 0.58,
    viewBox: "0 0 122 115",
    paths: [
      "M43.3599 81.32L2.91992 85.83L0 32.56L39.5298 32.06L38.3999 0L121.61 51.35C97.3999 74.19 74 94.55 46.47 114.4L43.3699 81.31L43.3599 81.32Z",
    ],
  },
  long: {
    family: "workout",
    label: "Long",
    opticalFit: 0.56,
    viewBox: "0 0 108 109",
    paths: [
      "M86.4778 98.8504C76.4978 106.66 65.0378 107.71 52.9278 108.05C31.1578 108.66 9.09781 96.9904 2.31781 75.3004C-3.62219 56.2904 2.41789 35.0804 14.0279 19.7804C24.5679 5.89042 39.9779 -0.289599 56.7679 0.0104014C77.3979 0.380401 93.8678 11.2304 102.308 29.7304C113.248 53.7304 108.108 81.9404 86.4879 98.8504H86.4778ZM81.0578 53.3004C81.0578 38.4004 68.9778 26.3204 54.0778 26.3204C39.1778 26.3204 27.0978 38.4004 27.0978 53.3004C27.0978 68.2004 39.1778 80.2804 54.0778 80.2804C68.9778 80.2804 81.0578 68.2004 81.0578 53.3004Z",
    ],
  },
  tempo: {
    family: "workout",
    label: "Tempo",
    opticalFit: 0.58,
    viewBox: "0 0 105 101",
    paths: [
      "M104.89 48.08L62.8499 100.13L1.59985 100.62L34.1299 51.99L30.8499 44.79L0 0L39.3799 1.17L56.3 1.86L88.3298 31.43L104.89 48.08Z",
    ],
  },
  intervals: {
    family: "workout",
    label: "Intervals",
    opticalFit: 0.64,
    viewBox: "0 0 123 89",
    paths: [
      "M83.63 44.98L97.48 44.95L100.62 12.11L119.57 12.85L122.92 82.2L55.54 86.33L0 88.68L0.940002 28.3L2.09998 0.420013L35.5 0L36.85 32.14L38.0099 45.92L53.0099 45.88L56.98 5.63L81.7599 5.71002L83.63 44.98Z",
    ],
  },
  progression: {
    family: "workout",
    label: "Progression",
    opticalFit: 0.6,
    viewBox: "0 0 115 116",
    paths: [
      "M84.84 58.81L35.63 115.17L0 93.27L47.93 39.3L15.92 28.48C16.4 24.21 17.35 20.4799 19.18 16.5699L114.35 0L114.29 16.96L111 85.87L97.6 88.9399L84.86 58.8199L84.84 58.81Z",
    ],
  },
  race: {
    family: "workout",
    label: "Race",
    opticalFit: 0.58,
    viewBox: "0 0 138 133",
    paths: [
      "M90.0701 132.16L70.6501 103.69L50.5701 132.53L48.95 97.48L14.3801 107.88L37.29 76.13L0 56.58L38.8601 54.34L25.9299 16.84L58.05 39.35L70.4399 0L82.0601 39.04L116.37 17.11L101.54 53.05L137.59 55.47L104.02 77.29L127.75 106.62L91.8901 97.46L90.0701 132.16Z",
    ],
  },
  hills: {
    family: "workout",
    label: "Hills",
    opticalFit: 0.7,
    viewBox: "0 0 158 91",
    paths: [
      "M157.76 89.1609L87.29 90.1309L0 89.8009L42.65 28.4109L54.93 45.2809L74.54 3.3109C75.16 1.9909 77.76 -0.049098 79.09 0.000901999C80.42 0.050902 83.31 1.69088 84.11 2.88088L106.96 36.4909L117.2 23.2609L123.72 32.8109L157.76 89.1509V89.1609Z",
    ],
  },
  trail: {
    family: "workout",
    label: "Trail",
    opticalFit: 0.58,
    viewBox: "0 0 113 119",
    paths: [
      "M70.2416 111.368C70.7416 120.738 59.8216 119.038 46.0316 118.428C41.8816 107.768 47.5416 95.5078 34.5016 94.3678C25.5816 93.5878 16.2016 90.2577 10.3116 83.0377C-2.40838 67.4477 -4.62836 39.4178 10.8716 36.1078C16.1816 34.9678 23.6816 38.0477 24.8916 44.5577L27.4616 58.3077C29.5716 69.5977 36.4516 75.3777 41.2716 73.1577C42.4016 72.6377 43.9816 69.8777 43.9116 68.5377L42.4416 39.4577C41.6216 23.2777 37.9916 0.577787 55.7816 0.00778717C63.0316 -0.222213 69.4316 4.65769 70.7516 12.6577C71.9216 19.7577 70.9716 26.8278 70.3716 34.5078L68.6316 57.0177C68.5616 57.9477 69.9316 60.7377 70.6916 61.3177C74.1816 63.9977 83.8116 58.5178 86.0416 46.4778C87.9516 36.1478 90.7516 26.4477 101.162 27.0677C104.832 27.2877 109.862 31.0577 111.092 35.1877C116.302 52.7677 103.972 78.3177 79.8116 80.5677C74.5716 81.0577 68.7816 83.8977 69.1116 90.2077L70.2316 111.348L70.2416 111.368Z",
    ],
  },
  "hito-running": {
    family: "surface",
    label: "Hito Running",
    opticalFit: 0.6,
    viewBox: "0 0 121 118",
    frameToken: "--signal",
    glyphToken: "--signal-foreground",
    contentToken: "--foreground",
    paths: [
      "M39.762 93.9099C24.502 106.86 23.582 119.01 11.622 117.46C9.06199 117.13 5.17197 114.72 4.10197 112.79C-0.568034 104.34 17.232 84.46 27.192 73.09C29.102 70.91 30.302 65.62 29.322 62.83C28.482 60.46 24.242 57.6899 21.412 57.3199L8.77198 55.64C5.02198 55.14 0.821982 52.66 0.211982 49.61C-2.82802 34.37 27.522 31.82 46.782 36.76C55.532 39 63.162 37.09 70.252 31.46C82.752 21.53 104.902 11.06 118.572 15.84C121.012 16.69 121.582 23.5699 120.192 26.0399C115.742 33.9999 99.492 34.84 85.372 51.83C82.682 55.06 80.312 61.83 84.272 65.09C91.792 71.28 111.142 72.5999 106.662 89.5599C104.962 95.9999 101.602 104.44 97.972 109.45C96.512 111.47 89.812 111.5 87.742 110.46C85.672 109.42 84.472 105.99 82.972 102.82C75.392 86.7999 53.692 82.0799 39.762 93.9099Z",
      "M54.592 28.64C62.5007 28.64 68.912 22.2287 68.912 14.3199C68.912 6.41123 62.5007 0 54.592 0C46.6833 0 40.272 6.41123 40.272 14.3199C40.272 22.2287 46.6833 28.64 54.592 28.64Z",
    ],
  },
  admin: {
    family: "surface",
    label: "Admin",
    opticalFit: 0.58,
    viewBox: "0 0 118 101",
    frameToken: "--primary",
    glyphToken: "--primary-foreground",
    contentToken: "--foreground",
    paths: [
      "M89.78 100.19L26.29 98.9399L0 48.12L29.39 0L91.9 2.84998L117.45 47.3099L89.77 100.19H89.78ZM66.8 64.9L73.93 50.91L66.37 37.02L51.83 36.72C48.31 41.08 44.77 46.6699 43.4 51.4299L50.4 64.79L66.8 64.89V64.9Z",
    ],
  },
  "design-system": {
    family: "surface",
    label: "Design System",
    opticalFit: 0.64,
    viewBox: "0 0 115 132",
    frameToken: "--accent",
    glyphToken: "--accent-foreground",
    contentToken: "--foreground",
    paths: [
      "M41.8494 74.3616C37.9294 85.8216 27.1994 91.4316 16.4494 88.9216C5.6994 86.4116 -1.0706 76.5016 0.139398 65.1616C1.5494 51.9416 13.2294 42.8317 25.8794 45.3117C38.2194 47.7317 46.3394 61.2516 41.8594 74.3616H41.8494Z",
      "M79.1694 14.9116C83.5794 28.9616 74.1994 43.8116 59.6894 44.6016C52.6394 44.9816 46.0494 40.5817 42.7594 35.8817C38.3994 29.6517 37.5994 22.1517 39.8394 15.0517C42.6794 6.08165 50.3594 0.111663 59.2594 0.00166326C68.0694 -0.108337 76.1294 5.24164 79.1594 14.9116H79.1694Z",
      "M114.329 70.9316C113.159 83.3616 102.949 91.5817 91.9494 90.8817C80.2394 90.1417 71.5494 79.9517 72.3794 67.7717C73.2294 55.2017 82.8594 46.5516 94.5894 47.3016C106.369 48.0516 115.579 57.6117 114.329 70.9417V70.9316Z",
      "M51.8994 130.472C40.7694 127.672 35.6994 116.892 37.7194 107.122C39.7394 97.3516 49.2394 89.2416 60.2594 91.2216C71.7594 93.2916 77.9294 104.192 75.7994 114.812C73.6694 125.432 63.8094 133.462 51.9094 130.472H51.8994Z",
    ],
  },
  changelog: {
    family: "surface",
    label: "Changelog",
    opticalFit: 0.64,
    viewBox: "0 0 114 91",
    frameToken: "--info",
    glyphToken: "--info-foreground",
    contentToken: "--foreground",
    paths: [
      "M66.4372 87.8508C61.2472 91.8108 53.0072 91.4708 46.9072 88.5308C43.1272 65.3908 37.7873 2.64078 53.9773 0.120783C65.5673 -1.67922 68.7973 17.0008 69.9873 32.0408C71.4773 50.7108 72.1472 69.0808 66.4372 87.8608V87.8508Z",
      "M3.02725 80.0808C-0.492746 56.1408 -4.74276 0.100793 14.5172 1.85079C18.4672 2.21079 23.1472 6.07081 24.2572 10.8008C29.4472 33.0808 28.8672 56.3908 25.9672 79.1108C25.1072 85.8408 21.6471 90.0008 15.9071 90.5908C9.16714 91.2808 4.20726 88.0208 3.03726 80.0808H3.02725Z",
      "M109.407 88.7508C102.637 90.6908 97.0073 91.1108 90.9273 89.0908C89.5273 85.4808 88.5574 80.3908 88.2774 76.4908L87.1773 61.0408C85.7473 40.8808 82.6474 1.51077 96.9874 0.530767C109.267 -0.319233 112.917 26.1708 112.997 42.2308L113.107 64.8708L109.407 88.7607V88.7508Z",
    ],
  },
} as const satisfies Record<string, MarkDefinition>;

export type HitoMarkName = keyof typeof HITO_MARK_DEFINITIONS;

function tokenPairFor(name: HitoMarkName) {
  const definition = HITO_MARK_DEFINITIONS[name];

  if (definition.family === "workout") {
    const family = name as CanonicalWorkoutFamily;
    return {
      frameToken: workoutFamilyColorToken(family, "base"),
      glyphToken: workoutFamilyColorToken(family, "foreground"),
      contentToken: workoutFamilyColorToken(family, "content"),
    };
  }

  if (definition.family === "surface") {
    return {
      frameToken: definition.frameToken,
      glyphToken: definition.glyphToken,
      contentToken: definition.contentToken,
    };
  }

  throw new Error(`Missing Hito Mark token pair for ${name}`);
}

function backgroundOptionsFor(name: HitoMarkName): readonly HitoMarkBackgroundOption[] {
  const definition = HITO_MARK_DEFINITIONS[name];
  const canonicalTokens = tokenPairFor(name);
  const options: HitoMarkBackgroundOption[] = [
    {
      frameToken: canonicalTokens.frameToken,
      glyphToken: canonicalTokens.glyphToken,
      label: "Solid frame",
      value: "solid",
    },
  ];

  if (definition.family === "workout") {
    const family = name as CanonicalWorkoutFamily;
    options.push({
      frameToken: workoutFamilyColorToken(family, "surface"),
      glyphToken: workoutFamilyColorToken(family, "content"),
      label: "Surface frame",
      value: "surface",
    });
  }

  return options;
}

function backgroundOptionFor(name: HitoMarkName, background: HitoMarkBackground) {
  const option = backgroundOptionsFor(name).find((candidate) => candidate.value === background);
  if (!option) {
    throw new Error(`Hito Mark ${name} does not support the ${background} background`);
  }
  return option;
}

export const HITO_MARK_META = (Object.keys(HITO_MARK_DEFINITIONS) as HitoMarkName[]).map((name) => {
  const definition = HITO_MARK_DEFINITIONS[name];
  return {
    backgrounds: backgroundOptionsFor(name),
    name,
    family: definition.family,
    label: definition.label,
    opticalFit: definition.opticalFit,
    pathCount: definition.paths.length,
    viewBox: definition.viewBox,
    ...tokenPairFor(name),
  };
});

type HitoMarkBaseProps = Omit<
  HTMLAttributes<HTMLSpanElement>,
  "aria-hidden" | "aria-label" | "children" | "color" | "role"
> & {
  name: HitoMarkName;
  background?: HitoMarkBackground;
  shape?: HitoMarkShape;
  size?: HitoMarkSize;
};

export type HitoMarkProps = HitoMarkBaseProps &
  ({ decorative?: true; label?: never } | { decorative: false; label: string });

export function HitoMark({
  name,
  background = "solid",
  shape = "tile",
  size = "md",
  decorative = true,
  label,
  className,
  style,
  ...props
}: HitoMarkProps) {
  const definition = HITO_MARK_DEFINITIONS[name];
  const backgroundOption = backgroundOptionFor(name, background);
  const glyphStyle = {
    transform: `scale(${definition.opticalFit})`,
    transformOrigin: "center",
  } satisfies CSSProperties;

  return (
    <span
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : label}
      className={cn(
        "inline-grid shrink-0 place-items-center",
        HITO_MARK_SIZES[size].className,
        shape === "circle" ? "rounded-full" : HITO_MARK_SIZES[size].tileRadiusClassName,
        className,
      )}
      data-hito-mark={name}
      data-hito-mark-background={background}
      data-hito-mark-frame-token={backgroundOption.frameToken}
      data-hito-mark-glyph-token={backgroundOption.glyphToken}
      data-hito-mark-optical-fit={definition.opticalFit}
      data-hito-mark-shape={shape}
      data-hito-mark-size={size}
      data-hito-mark-tile-radius-token={
        shape === "tile" ? HITO_MARK_SIZES[size].tileRadiusToken : undefined
      }
      role={decorative ? undefined : "img"}
      style={{
        ...style,
        backgroundColor: `var(${backgroundOption.frameToken})`,
        color: `var(${backgroundOption.glyphToken})`,
      }}
      {...props}
    >
      <svg
        aria-hidden="true"
        fill="none"
        focusable="false"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        style={glyphStyle}
        viewBox={definition.viewBox}
        width="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        {definition.paths.map((path) => (
          <path key={path} d={path} fill="currentColor" />
        ))}
      </svg>
    </span>
  );
}
