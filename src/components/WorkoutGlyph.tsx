import { cn } from "@/lib/utils";
import type { WorkoutType } from "@/lib/training";

/* Tiny abstract glyphs per workout type — calmer than icon library. */
export function WorkoutGlyph({ type, className }: { type: WorkoutType; className?: string }) {
	const cls = cn("h-3 w-3", className);
	switch (type) {
		case "easy":
		case "steady_or_easy":
			return (
				<svg viewBox="0 0 12 12" className={cls} fill="none">
					<circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.2" />
				</svg>
			);
		case "long_run":
			return (
				<svg viewBox="0 0 12 12" className={cls} fill="none">
					<path
						d="M1 6h10"
						stroke="currentColor"
						strokeWidth="1.4"
						strokeLinecap="round"
					/>
					<circle cx="10" cy="6" r="1.2" fill="currentColor" />
				</svg>
			);
		case "quality":
			return (
				<svg viewBox="0 0 12 12" className={cls} fill="none">
					<path
						d="M1.5 9 L4 4 L6 8 L8 3 L10.5 9"
						stroke="currentColor"
						strokeWidth="1.2"
						strokeLinejoin="round"
						strokeLinecap="round"
					/>
				</svg>
			);
		case "rest":
			return (
				<svg viewBox="0 0 12 12" className={cls} fill="none">
					<line
						x1="3"
						y1="6"
						x2="9"
						y2="6"
						stroke="currentColor"
						strokeWidth="1.2"
						strokeLinecap="round"
					/>
				</svg>
			);
	}
}
