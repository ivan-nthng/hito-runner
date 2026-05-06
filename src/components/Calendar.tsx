import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
	TYPE_META,
	WEEK_STATUS_META,
	workoutDuration,
	workoutDistanceKm,
	findWorkout,
	weekdayShort,
	formatDate,
	type Status,
	type TrainingSnapshot,
	type Workout,
} from "@/lib/training";
import { WorkoutGlyph } from "./WorkoutGlyph";

type View = "month" | "week";

export function Calendar({ snapshot }: { snapshot: TrainingSnapshot }) {
	const [view, setView] = useState<View>("month");
	const [cursor, setCursor] = useState(() => new Date(`${snapshot.currentDate}T00:00:00`));
	const [hovered, setHovered] = useState<string | null>(null);

	const cells = useMemo(() => buildMonth(cursor), [cursor]);
	const monthLabel = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
	const weekStatus = WEEK_STATUS_META[snapshot.weekStatus];

	const weekCells = useMemo(() => {
		const date = new Date(cursor);
		const day = (date.getDay() + 6) % 7;
		const monday = new Date(date);
		monday.setDate(date.getDate() - day);
		return Array.from({ length: 7 }, (_, index) => {
			const current = new Date(monday);
			current.setDate(monday.getDate() + index);
			return current.toISOString().slice(0, 10);
		});
	}, [cursor]);

	function shift(amount: number) {
		const date = new Date(cursor);
		if (view === "month") date.setMonth(date.getMonth() + amount);
		else date.setDate(date.getDate() + amount * 7);
		setCursor(date);
	}

	return (
		<div>
			<div className="flex flex-wrap items-end justify-between gap-4 mb-8">
				<div>
					<p className="text-[11px] tracking-[0.18em] uppercase text-muted-foreground">
						Training plan
					</p>
					<h1 className="font-display text-4xl lg:text-5xl mt-1 leading-none">
						{monthLabel}
					</h1>
					<p className="text-sm text-muted-foreground mt-3 max-w-xl">
						{snapshot.source === "persisted"
							? "Imported baseline planning surface. Month and week views stay preserved while the calendar now renders one persisted plan cycle."
							: "Imported baseline planning surface. Month and week views are preserved while the product stays explicit that this is still a sample plan."}
					</p>
				</div>

				<div className="flex items-center gap-2">
					<div className="flex rounded-md border border-hairline p-0.5 text-xs">
						<button
							onClick={() => setView("month")}
							className={cn(
								"px-3 py-1.5 rounded-sm tracking-wide",
								view === "month"
									? "bg-accent text-foreground"
									: "text-muted-foreground",
							)}
						>
							Month
						</button>
						<button
							onClick={() => setView("week")}
							className={cn(
								"px-3 py-1.5 rounded-sm tracking-wide",
								view === "week"
									? "bg-accent text-foreground"
									: "text-muted-foreground",
							)}
						>
							Week
						</button>
					</div>
					<button
						onClick={() => shift(-1)}
						className="h-8 w-8 grid place-items-center rounded-md border border-hairline hover:bg-accent"
					>
						<ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
					</button>
					<button
						onClick={() => setCursor(new Date(`${snapshot.currentDate}T00:00:00`))}
						className="px-3 h-8 rounded-md border border-hairline text-xs tracking-wide hover:bg-accent"
					>
						Today
					</button>
					<button
						onClick={() => shift(1)}
						className="h-8 w-8 grid place-items-center rounded-md border border-hairline hover:bg-accent"
					>
						<ChevronRight className="h-4 w-4" strokeWidth={1.5} />
					</button>
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
				{(["easy", "long_run", "quality", "rest"] as const).map((type) => (
					<div key={type} className="flex items-center gap-1.5">
						<span
							className="h-2 w-2 rounded-full"
							style={{
								background: `var(--${type === "long_run" ? "long" : type === "quality" ? "quality" : type === "rest" ? "rest" : "easy"})`,
							}}
						/>
						<span>{TYPE_META[type].short}</span>
					</div>
				))}
				<div className="ml-auto hidden md:flex items-center gap-1.5">
					<span className="text-muted-foreground">Week status</span>
					<span className="font-mono-num text-foreground">{weekStatus.label}</span>
					<span className="opacity-50">/</span>
					<span>{snapshot.source === "persisted" ? "saved state" : "sample data"}</span>
				</div>
			</div>

			{view === "month" ? (
				<div className="rounded-xl border border-hairline overflow-hidden bg-surface/40">
					<div className="grid grid-cols-7 border-b border-hairline">
						{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
							<div
								key={day}
								className="px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
							>
								{day}
							</div>
						))}
					</div>
					<div className="grid grid-cols-7">
						{cells.map((iso, index) => (
							<DayCell
								key={index}
								iso={iso}
								inMonth={
									iso
										? new Date(`${iso}T00:00:00`).getMonth() ===
											cursor.getMonth()
										: false
								}
								onHover={setHovered}
								hovered={hovered}
								snapshot={snapshot}
							/>
						))}
					</div>
				</div>
			) : (
				<WeekStrip dates={weekCells} snapshot={snapshot} />
			)}
		</div>
	);
}

function buildMonth(cursor: Date): (string | null)[] {
	const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
	const startOffset = (first.getDay() + 6) % 7;
	const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
	const cells: (string | null)[] = [];

	for (let index = startOffset; index > 0; index -= 1) {
		const date = new Date(first);
		date.setDate(first.getDate() - index);
		cells.push(date.toISOString().slice(0, 10));
	}

	for (let day = 1; day <= daysInMonth; day += 1) {
		const date = new Date(cursor.getFullYear(), cursor.getMonth(), day);
		cells.push(date.toISOString().slice(0, 10));
	}

	while (cells.length % 7 !== 0) {
		const last = new Date(`${cells[cells.length - 1]}T00:00:00`);
		last.setDate(last.getDate() + 1);
		cells.push(last.toISOString().slice(0, 10));
	}

	return cells;
}

function DayCell({
	iso,
	inMonth,
	onHover,
	hovered,
	snapshot,
}: {
	iso: string | null;
	inMonth: boolean;
	onHover: (value: string | null) => void;
	hovered: string | null;
	snapshot: TrainingSnapshot;
}) {
	if (!iso) return <div className="aspect-[5/4] border-r border-b border-hairline" />;
	const workout = findWorkout(snapshot.workouts, iso);
	const isToday = iso === snapshot.currentDate;
	const status = workout?.status ?? "rest";
	const day = parseInt(iso.split("-")[2], 10);
	const isHover = hovered === iso;
	const meta = workout ? TYPE_META[workout.type] : null;
	const km = workout ? workoutDistanceKm(workout) : null;
	const duration = workout ? workoutDuration(workout) : 0;

	return (
		<div className="relative">
			<Link
				to="/workout/$date"
				params={{ date: iso }}
				onMouseEnter={() => onHover(iso)}
				onMouseLeave={() => onHover(null)}
				className={cn(
					"block aspect-[5/4] border-r border-b border-hairline p-3 transition-colors group",
					!inMonth && "opacity-30",
					isToday && "bg-accent/40",
					"hover:bg-accent/40",
				)}
			>
				<div className="flex items-start justify-between">
					<div
						className={cn(
							"font-mono-num text-xs",
							isToday ? "text-signal" : "text-muted-foreground",
						)}
					>
						{String(day).padStart(2, "0")}
					</div>
					{workout && workout.type !== "rest" && meta && (
						<span style={{ color: meta.color }}>
							<WorkoutGlyph type={workout.type} />
						</span>
					)}
				</div>

				{workout && workout.type !== "rest" && (
					<div className="mt-3">
						<div
							className={cn(
								"text-[11px] uppercase tracking-wider",
								status === "skipped" && "line-through opacity-50",
							)}
							style={{ color: meta?.color }}
						>
							{TYPE_META[workout.type].short}
						</div>
						<div className="mt-1 text-xs leading-tight text-foreground/85 line-clamp-2">
							{workout.title.replace(/^(Аэробный |Лёгкий )/, "")}
						</div>
						<div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground font-mono-num">
							{km && <span>{km}km</span>}
							{duration > 0 && <span>{duration}′</span>}
							<StatusDot status={status} />
						</div>
					</div>
				)}
				{workout && workout.type === "rest" && (
					<div className="mt-3 text-[11px] uppercase tracking-wider text-muted-foreground">
						Rest
					</div>
				)}

				{workout && workout.type !== "rest" && (
					<div className="absolute bottom-0 left-0 right-0 h-[2px] bg-hairline overflow-hidden">
						<div
							className="h-full"
							style={{
								width:
									status === "completed"
										? "100%"
										: status === "partial"
											? "55%"
											: status === "skipped"
												? "100%"
												: "0%",
								background:
									status === "completed"
										? "var(--success)"
										: status === "partial"
											? "var(--warn)"
											: status === "skipped"
												? "var(--destructive)"
												: "transparent",
								opacity: status === "skipped" ? 0.5 : 1,
							}}
						/>
					</div>
				)}
			</Link>

			{isHover && workout && workout.type !== "rest" && (
				<div className="absolute z-50 left-1/2 -translate-x-1/2 top-full mt-2 w-72 pointer-events-none">
					<Tooltip workout={workout} />
				</div>
			)}
		</div>
	);
}

function StatusDot({ status }: { status: Status }) {
	const map: Record<Status, string> = {
		completed: "bg-success",
		partial: "bg-warn",
		skipped: "bg-destructive/70",
		today: "bg-signal animate-pulse",
		upcoming: "bg-muted-foreground/30",
		rest: "bg-transparent",
	};

	return <span className={cn("ml-auto h-1.5 w-1.5 rounded-full", map[status])} />;
}

function Tooltip({ workout }: { workout: Workout }) {
	const km = workoutDistanceKm(workout);
	const duration = workoutDuration(workout);
	const meta = TYPE_META[workout.type];
	const status = workout.status;
	const target = workout.steps[0]?.target;

	return (
		<div className="rounded-lg border border-hairline bg-popover/95 backdrop-blur-xl shadow-2xl p-4 text-left">
			<div className="flex items-center justify-between">
				<span
					className="text-[10px] uppercase tracking-[0.18em]"
					style={{ color: meta.color }}
				>
					{meta.label}
				</span>
				<span className="text-[10px] uppercase tracking-wider text-muted-foreground">
					{formatDate(workout.date, { month: "short", day: "numeric", weekday: "short" })}
				</span>
			</div>
			<div className="mt-2 font-display text-lg leading-tight">{workout.title}</div>
			<div className="mt-3 grid grid-cols-3 gap-3 text-[11px]">
				<Stat label="Distance" value={km ? `${km}km` : "—"} />
				<Stat label="Duration" value={duration ? `${duration}′` : "—"} />
				<Stat label="Status" value={status} />
			</div>
			{target && (
				<div className="mt-3 pt-3 border-t border-hairline text-[11px] text-muted-foreground space-y-0.5">
					{Object.entries(target)
						.slice(0, 2)
						.map(([key, value]) => (
							<div key={key} className="flex justify-between gap-3">
								<span className="uppercase tracking-wider text-[10px]">
									{key.replace(/_/g, " ")}
								</span>
								<span className="text-foreground/80 truncate">{String(value)}</span>
							</div>
						))}
				</div>
			)}
		</div>
	);
}

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
				{label}
			</div>
			<div className="font-mono-num text-foreground mt-0.5 capitalize">{value}</div>
		</div>
	);
}

function WeekStrip({ dates, snapshot }: { dates: string[]; snapshot: TrainingSnapshot }) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-7 gap-3">
			{dates.map((iso) => {
				const workout = findWorkout(snapshot.workouts, iso);
				const isToday = iso === snapshot.currentDate;
				const meta = workout ? TYPE_META[workout.type] : null;
				const status = workout?.status ?? "rest";
				const km = workout ? workoutDistanceKm(workout) : null;
				const duration = workout ? workoutDuration(workout) : 0;
				return (
					<Link
						key={iso}
						to="/workout/$date"
						params={{ date: iso }}
						className={cn(
							"rounded-xl border border-hairline p-4 bg-surface/40 hover:bg-accent/40 transition-colors min-h-[180px] flex flex-col",
							isToday && "border-signal/40",
						)}
					>
						<div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
							<span>{weekdayShort(iso)}</span>
							<span className="font-mono-num">{iso.slice(8)}</span>
						</div>
						{workout && workout.type !== "rest" && meta ? (
							<>
								<div
									className="mt-3 text-[11px] uppercase tracking-wider"
									style={{ color: meta.color }}
								>
									{meta.short}
								</div>
								<div className="mt-1 text-sm leading-snug">{workout.title}</div>
								<div className="mt-auto pt-3 flex items-center gap-3 text-[11px] font-mono-num text-muted-foreground">
									{km && <span>{km}km</span>}
									{duration > 0 && <span>{duration}′</span>}
									<span className="ml-auto capitalize text-foreground/70">
										{status}
									</span>
								</div>
							</>
						) : (
							<div className="mt-auto text-xs uppercase tracking-wider text-muted-foreground">
								Rest
							</div>
						)}
					</Link>
				);
			})}
		</div>
	);
}
