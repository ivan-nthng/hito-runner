import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { createAdminSupabaseClient } from "../src/lib/supabase/server";
import { getPersistedUserIdForAuthContext } from "../src/lib/request-persisted-user";
import {
  getUiLocaleResolutionForUserId,
  getUserSettingsForUserId,
  updateUserSettingsForUserId,
} from "../src/lib/user-settings-actions";
import {
  INVALID_STORED_UI_LOCALE_PREFERENCE,
  formatUiDate,
  formatUiNumber,
  resolveRequestUiLocale,
  resolveUiLocale,
} from "../src/lib/ui-locale";
import {
  formatHitoProductMessage,
  getHitoKnownProductMessage,
  getHitoProductApiFailureMessage,
  getHitoProductMessage,
} from "../src/lib/ui-locale-messages";
import type { HitoProductApiFailure } from "../src/lib/product-api-error-contract";

const REQUIRE_PERSISTENCE = process.argv.includes("--require-persistence");

async function main() {
  proveResolverContract();
  proveSourceOwnership();

  if (!REQUIRE_PERSISTENCE) {
    console.log("UI locale profile source validation passed.");
    return;
  }

  await proveLocalPersistenceContract();
  console.log("UI locale profile source + local persistence validation passed.");
}

function proveResolverContract() {
  const requestCases = [
    ["pt", "pt-BR"],
    ["pt-BR", "pt-BR"],
    ["pt-PT", "pt-BR"],
    ["PT-br", "pt-BR"],
    ["en", "en"],
    ["es", "en"],
    ["fr;q=1, pt;q=0.9", "en"],
    ["en;q=0.8, pt-PT;q=0.9", "pt-BR"],
    ["en, pt", "en"],
    ["*;q=1, pt;q=0.9", "en"],
    ["pt;q=0, en;q=0.5", "en"],
    ["pt;q=0", "en"],
    ["pt_BR", "en"],
    ["pt;q=1.5", "en"],
    ["pt;q=invalid", "en"],
    [", pt", "en"],
    ["*", "en"],
    ["", "en"],
    [null, "en"],
    [undefined, "en"],
  ] as const;

  for (const [acceptLanguage, expected] of requestCases) {
    assert.equal(resolveRequestUiLocale(acceptLanguage), expected, String(acceptLanguage));
  }

  assert.deepEqual(resolveUiLocale({ storedPreference: "en", acceptLanguage: "pt" }), {
    preference: "en",
    preferenceContractViolation: null,
    resolvedLocale: "en",
  });
  assert.deepEqual(resolveUiLocale({ storedPreference: "pt-BR", acceptLanguage: "en" }), {
    preference: "pt-BR",
    preferenceContractViolation: null,
    resolvedLocale: "pt-BR",
  });
  assert.deepEqual(resolveUiLocale({ storedPreference: "system", acceptLanguage: "pt-PT" }), {
    preference: "system",
    preferenceContractViolation: null,
    resolvedLocale: "pt-BR",
  });
  assert.deepEqual(resolveUiLocale({ storedPreference: null, acceptLanguage: "en" }), {
    preference: "system",
    preferenceContractViolation: null,
    resolvedLocale: "en",
  });
  assert.deepEqual(resolveUiLocale({ storedPreference: "pt", acceptLanguage: "pt-BR" }), {
    preference: null,
    preferenceContractViolation: INVALID_STORED_UI_LOCALE_PREFERENCE,
    resolvedLocale: "pt-BR",
  });

  assert.equal(getHitoProductMessage("en", "Calendar"), "Calendar");
  assert.equal(getHitoProductMessage("pt-BR", "Calendar"), "Calendário");
  assert.equal(getHitoProductMessage("pt-BR", "Completed"), "Concluído");
  assert.equal(getHitoProductMessage("pt-BR", "Feedback ready"), "Feedback pronto");
  assert.equal(formatHitoProductMessage("pt-BR", "Week {week}", { week: 3 }), "Semana 3");
  assert.equal(
    getHitoKnownProductMessage("pt-BR", "Warm-up requires positive minutes."),
    "Warm-up exige minutos positivos.",
  );
  assert.equal(
    getHitoKnownProductMessage("pt-BR", "Runner-authored title"),
    "Runner-authored title",
  );
  assert.equal(formatUiNumber(1234.5, "en"), "1,234.5");
  assert.equal(formatUiNumber(1234.5, "pt-BR"), "1.234,5");
  assert.equal(formatUiDate("2026-08-24", "en", { dateStyle: "long" }), "August 24, 2026");
  assert.equal(formatUiDate("2026-08-24", "pt-BR", { dateStyle: "long" }), "24 de agosto de 2026");
  assert.equal(
    getHitoProductMessage("pt-BR", "Distance by FIT-recorded run"),
    "Distância por corrida registrada via FIT",
  );
  assert.equal(
    getHitoProductMessage(
      "pt-BR",
      "Review the supplied distance for every FIT-recorded run in the exact selected period.",
    ),
    "Revise a distância informada para cada corrida registrada via FIT no período exato selecionado.",
  );
  assert.equal(getHitoProductMessage("pt-BR", "This week"), "Esta semana");
  assert.equal(
    getHitoProductMessage("pt-BR", "No activity evidence"),
    "Nenhuma evidência de atividade",
  );
  assert.equal(
    formatHitoProductMessage("pt-BR", "No FIT-recorded runs from {startDate} to {endDate}.", {
      startDate: "24 de ago. de 2026",
      endDate: "30 de ago. de 2026",
    }),
    "Nenhuma corrida registrada via FIT de 24 de ago. de 2026 a 30 de ago. de 2026.",
  );
  assert.equal(getHitoProductMessage("pt-BR", "Distance"), "Distância");
  assert.equal(
    getHitoProductMessage("pt-BR", "Recorded whole-activity distance"),
    "Distância registrada da atividade completa",
  );
  assert.equal(getHitoProductMessage("pt-BR", "28 days"), "28 dias");
  assert.equal(getHitoProductMessage("pt-BR", "From FIT file"), "Do arquivo FIT");
  const factualReasonTranslations = [
    [
      "Runner-reported effort is missing.",
      "O esforço informado pelo corredor não está disponível.",
    ],
    [
      "Distance was not available in the FIT file.",
      "A distância não estava disponível no arquivo FIT.",
    ],
    [
      "Observed distance or duration was not available for pace.",
      "A distância ou a duração observada não estava disponível para o ritmo.",
    ],
    [
      "Elevation gain was not available in the FIT file.",
      "O ganho de elevação não estava disponível no arquivo FIT.",
    ],
  ] as const;
  for (const [reason, portuguese] of factualReasonTranslations) {
    assert.equal(getHitoKnownProductMessage("pt-BR", reason), portuguese);
  }
  assert.equal(
    getHitoKnownProductMessage("pt-BR", "Runner-authored FIT note"),
    "Runner-authored FIT note",
  );
  assert.equal(
    formatHitoProductMessage("en", "{startDate} through {endDate}", {
      startDate: formatUiDate("2026-07-29", "en", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      endDate: formatUiDate("2026-08-02", "en", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    }),
    "Jul 29, 2026 through Aug 2, 2026",
  );
  assert.equal(
    formatHitoProductMessage("pt-BR", "{startDate} through {endDate}", {
      startDate: formatUiDate("2026-07-29", "pt-BR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      endDate: formatUiDate("2026-08-02", "pt-BR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    }),
    "29 de jul. de 2026 a 2 de ago. de 2026",
  );
  assert.equal(getHitoProductMessage("pt-BR", "Partial week"), "Semana parcial");
  assert.equal(getHitoProductMessage("pt-BR", "Complete week"), "Semana completa");
  assert.equal(getHitoProductMessage("pt-BR", "To date"), "Até o momento");
  assert.equal(
    formatHitoProductMessage("pt-BR", "{includedCount} of {candidateCount} accepted activities", {
      includedCount: 0,
      candidateCount: 0,
    }),
    "0 de 0 atividades aceitas",
  );
  assert.equal(
    getHitoProductMessage(
      "pt-BR",
      "The source image could not be prepared. Choose another JPEG, PNG, or WebP image.",
    ),
    "Não foi possível preparar a imagem de origem. Escolha outra imagem JPEG, PNG ou WebP.",
  );

  proveProductApiFailureMessages();
}

function proveProductApiFailureMessages() {
  const cases: readonly [HitoProductApiFailure, string, string][] = [
    [
      { ok: false, code: "avatar_file_required", params: {} },
      "Choose an avatar image before uploading.",
      "Escolha uma imagem de avatar antes de enviar.",
    ],
    [
      { ok: false, code: "avatar_file_empty", params: {} },
      "Choose a non-empty avatar image.",
      "Escolha uma imagem de avatar que não esteja vazia.",
    ],
    [
      { ok: false, code: "avatar_file_too_large", params: { maxBytes: 5 * 1024 * 1024 } },
      "Choose an avatar image under 5 MB.",
      "Escolha uma imagem de avatar com menos de 5 MB.",
    ],
    [
      {
        ok: false,
        code: "avatar_file_type_unsupported",
        params: { allowedMimeTypes: ["image/jpeg", "image/png"] },
      },
      "Use one of these avatar file types: image/jpeg, image/png.",
      "Use um destes tipos de arquivo para o avatar: image/jpeg, image/png.",
    ],
    [
      { ok: false, code: "avatar_profile_required", params: {} },
      "Finish setup before uploading an avatar.",
      "Conclua a configuração antes de enviar um avatar.",
    ],
    [
      { ok: false, code: "avatar_auth_required", params: {} },
      "Sign in again before changing your avatar.",
      "Entre novamente antes de alterar seu avatar.",
    ],
    [
      { ok: false, code: "avatar_upload_failed", params: {} },
      "The avatar could not be uploaded. Try again shortly.",
      "Não foi possível enviar o avatar. Tente novamente em instantes.",
    ],
    [
      {
        ok: false,
        code: "runner_activity_auth_required",
        params: { operation: "history_read" },
      },
      "Sign in again before opening activity history.",
      "Entre novamente antes de abrir o histórico de atividades.",
    ],
    [
      {
        ok: false,
        code: "runner_activity_auth_required",
        params: { operation: "progress_read" },
      },
      "Sign in again before opening running progress.",
      "Entre novamente antes de abrir o progresso de corrida.",
    ],
    [
      {
        ok: false,
        code: "runner_activity_auth_required",
        params: { operation: "delete" },
      },
      "Sign in again before deleting activity history.",
      "Entre novamente antes de excluir o histórico de atividades.",
    ],
    [
      {
        ok: false,
        code: "runner_activity_auth_required",
        params: { operation: "source_remove" },
      },
      "Sign in again before removing the original activity file.",
      "Entre novamente antes de remover o arquivo de atividade original.",
    ],
    [
      { ok: false, code: "runner_activity_history_request_invalid", params: {} },
      "Refresh activity history and try again.",
      "Atualize o histórico de atividades e tente novamente.",
    ],
    [
      { ok: false, code: "runner_activity_history_unavailable", params: {} },
      "We could not load activity history. Try again shortly.",
      "Não foi possível carregar o histórico de atividades. Tente novamente em instantes.",
    ],
    [
      {
        ok: false,
        code: "runner_activity_progress_period_invalid",
        params: { period: "quarter" },
      },
      "The progress period quarter is not available. Choose another period.",
      "O período de progresso quarter não está disponível. Escolha outro período.",
    ],
    [
      { ok: false, code: "runner_activity_progress_unavailable", params: {} },
      "We could not load running progress. Try again shortly.",
      "Não foi possível carregar o progresso de corrida. Tente novamente em instantes.",
    ],
    [
      {
        ok: false,
        code: "runner_activity_not_found",
        params: { operation: "delete" },
      },
      "This activity is no longer available to delete.",
      "Esta atividade não está mais disponível para exclusão.",
    ],
    [
      {
        ok: false,
        code: "runner_activity_not_found",
        params: { operation: "source_remove" },
      },
      "This activity is no longer available for file removal.",
      "Esta atividade não está mais disponível para remoção do arquivo.",
    ],
    [
      { ok: false, code: "runner_activity_delete_failed", params: {} },
      "We could not delete this activity history. Try again shortly.",
      "Não foi possível excluir este histórico de atividade. Tente novamente em instantes.",
    ],
    [
      { ok: false, code: "runner_activity_source_remove_failed", params: {} },
      "We could not remove the original file. Try again shortly.",
      "Não foi possível remover o arquivo original. Tente novamente em instantes.",
    ],
    [
      {
        ok: false,
        code: "workout_result_auth_required",
        params: { operation: "upload" },
      },
      "Sign in again before uploading a Garmin result file.",
      "Entre novamente antes de enviar um arquivo de resultado Garmin.",
    ],
    [
      {
        ok: false,
        code: "workout_result_auth_required",
        params: { operation: "remove" },
      },
      "Sign in again before changing Garmin evidence.",
      "Entre novamente antes de alterar a evidência Garmin.",
    ],
    [
      {
        ok: false,
        code: "workout_result_invalid_request",
        params: { operation: "upload" },
      },
      "Choose a Garmin .fit file or a .zip archive before uploading.",
      "Escolha um arquivo Garmin .fit ou um arquivo .zip antes de enviar.",
    ],
    [
      {
        ok: false,
        code: "workout_result_invalid_request",
        params: { operation: "remove" },
      },
      "Choose a workout before removing its Garmin evidence.",
      "Escolha um treino antes de remover sua evidência Garmin.",
    ],
    [
      {
        ok: false,
        code: "workout_result_file_type_unsupported",
        params: { operation: "upload", acceptedKinds: ["fit", "zip"] },
      },
      "Only these activity file types are supported: FIT, ZIP.",
      "Somente estes tipos de arquivo de atividade são aceitos: FIT, ZIP.",
    ],
    [
      {
        ok: false,
        code: "workout_result_file_too_large",
        params: { operation: "upload", maxBytes: 25 * 1024 * 1024 },
      },
      "Choose an activity file under 25 MB.",
      "Escolha um arquivo de atividade com menos de 25 MB.",
    ],
    [
      {
        ok: false,
        code: "workout_result_workout_unavailable",
        params: { operation: "upload" },
      },
      "That workout is no longer available for activity upload.",
      "Esse treino não está mais disponível para o envio de atividade.",
    ],
    [
      {
        ok: false,
        code: "workout_result_workout_unavailable",
        params: { operation: "remove" },
      },
      "That workout is no longer available for evidence removal.",
      "Esse treino não está mais disponível para a remoção de evidência.",
    ],
    [
      {
        ok: false,
        code: "workout_result_rest_day_unsupported",
        params: { operation: "upload" },
      },
      "Activity evidence can only be attached to a running workout.",
      "A evidência de atividade só pode ser anexada a um treino de corrida.",
    ],
    [
      {
        ok: false,
        code: "workout_result_archive_activity_missing",
        params: { operation: "upload" },
      },
      "This archive does not contain a usable activity file.",
      "Este arquivo compactado não contém um arquivo de atividade utilizável.",
    ],
    [
      {
        ok: false,
        code: "workout_result_archive_multiple_activities",
        params: { operation: "upload", maxActivities: 1 },
      },
      "This archive contains more than 1 activity file. Upload one activity only.",
      "Este arquivo compactado contém mais de 1 arquivo de atividade. Envie apenas uma atividade.",
    ],
    [
      {
        ok: false,
        code: "workout_result_file_unreadable",
        params: { operation: "upload" },
      },
      "We could not read that activity file. Choose the original file and try again.",
      "Não foi possível ler esse arquivo de atividade. Escolha o arquivo original e tente novamente.",
    ],
    [
      {
        ok: false,
        code: "workout_result_activity_already_recorded",
        params: { operation: "upload" },
      },
      "This activity is already attached to another workout. Choose the matching workout instead.",
      "Esta atividade já está anexada a outro treino. Escolha o treino correspondente.",
    ],
    [
      {
        ok: false,
        code: "workout_result_storage_failed",
        params: { operation: "upload" },
      },
      "We could not store that activity file. Try again shortly.",
      "Não foi possível armazenar esse arquivo de atividade. Tente novamente em instantes.",
    ],
    [
      {
        ok: false,
        code: "workout_result_storage_failed",
        params: { operation: "remove" },
      },
      "We could not remove the stored activity file. Try again shortly.",
      "Não foi possível remover o arquivo de atividade armazenado. Tente novamente em instantes.",
    ],
    [
      {
        ok: false,
        code: "workout_result_persistence_failed",
        params: { operation: "upload" },
      },
      "The activity result could not be saved. The workout is unchanged.",
      "Não foi possível salvar o resultado da atividade. O treino não foi alterado.",
    ],
    [
      {
        ok: false,
        code: "workout_result_persistence_failed",
        params: { operation: "remove" },
      },
      "The activity evidence could not be removed. Try again shortly.",
      "Não foi possível remover a evidência da atividade. Tente novamente em instantes.",
    ],
  ];

  for (const [failure, english, portuguese] of cases) {
    assert.equal(getHitoProductApiFailureMessage("en", failure), english, failure.code);
    assert.equal(getHitoProductApiFailureMessage("pt-BR", failure), portuguese, failure.code);
  }
}

function proveSourceOwnership() {
  const migration = readSource(
    "supabase/migrations/20260813124903_runner_ui_locale_preference.sql",
  );
  assert.match(migration, /add column ui_locale_preference text not null default 'system'/);
  assert.match(migration, /check \(ui_locale_preference in \('system', 'en', 'pt-BR'\)\)/);

  const databaseTypes = readSource("src/lib/supabase/database.ts");
  assert.equal(databaseTypes.match(/ui_locale_preference/g)?.length, 3);

  const settingsSource = readSource("src/lib/user-settings-actions.ts");
  assert.match(settingsSource, /uiLocalePreference: uiLocalePreferenceSchema\.optional\(\)/);
  assert.match(settingsSource, /ui_locale_preference = data\.uiLocalePreference/);
  assert.match(settingsSource, /getUiLocaleResolutionForUserId/);

  const rejectedOwners = ["src/lib/runner-training-preferences.ts", "src/lib/theme-preference.ts"];
  for (const path of rejectedOwners) {
    assert.doesNotMatch(readSource(path), /ui_locale|UiLocale/);
  }

  const providerSource = readSource("src/components/ui/hito-ui-locale-provider.tsx");
  assert.match(providerSource, /createContext<ResolvedUiLocale>/);
  assert.match(providerSource, /document\.documentElement\.lang = locale/);

  const shellSource = readSource("src/components/AppShell.tsx");
  assert.match(shellSource, /<HitoUiLocaleProvider locale=\{resolvedLocale\}>/);
  assert.match(shellSource, /HitoLanguageMenuItems/);

  const calendarDaySource = readSource("src/components/ui/hito-calendar-day.tsx");
  assert.match(calendarDaySource, /resultLabel\?: string/);
  assert.match(calendarDaySource, /feedbackLabel\?: string/);

  for (const path of ["src/components/ui/dialog.tsx", "src/components/ui/sheet.tsx"]) {
    const source = readSource(path);
    assert.match(source, /useHitoProductMessage/);
    assert.match(source, /\{t\("Close"\)\}/);
    assert.doesNotMatch(source, />Close<\/span>/);
  }

  const completionSource = readSource("src/components/CompletionPanel.tsx");
  assert.match(completionSource, /planned=\{formatUiNumber\(plannedKm, locale\)\}/);

  const failureContractSource = readSource("src/lib/product-api-error-contract.ts");
  const failureMessageOwner = readSource("src/lib/ui-locale-messages.ts");
  const failureParameterMap = failureContractSource.match(
    /export type HitoProductApiFailureParameterMap = \{([\s\S]*?)\n\};/,
  )?.[1];
  assert.ok(failureParameterMap);
  const failureCodes = [...failureParameterMap.matchAll(/^ {2}([a-z0-9_]+):/gm)].map(
    ([, code]) => code,
  );
  assert.ok(failureCodes.length > 0);
  for (const code of failureCodes) {
    assert.match(failureMessageOwner, new RegExp(`case ["']${code}["']:`), code);
  }

  for (const path of [
    "src/routes/settings.tsx",
    "src/components/progress/RunnerActivityProgressExperience.tsx",
    "src/components/CompletionPanel.tsx",
  ]) {
    const source = readSource(path);
    assert.match(source, /HitoProductApiFailure/);
    assert.match(source, /getHitoProductApiFailureMessage/);
    assert.doesNotMatch(source, /message\?: string/);
    assert.doesNotMatch(source, /(?:payload|body)\.message|["']message["'] in (?:payload|body)/);
  }

  for (const path of [
    "src/components/ui/hito-factual-activity-point-sequence.tsx",
    "src/components/ui/hito-factual-bar-chart.tsx",
  ]) {
    const source = readSource(path);
    assert.match(source, /useHitoUiLocale/);
    assert.match(source, /formatUiDate/);
    assert.match(source, /getHitoKnownProductMessage/);
    assert.doesNotMatch(source, /import \{ formatDate \} from ["']@\/lib\/training["']/);
  }

  const pointSequenceSource = readSource(
    "src/components/ui/hito-factual-activity-point-sequence.tsx",
  );
  assert.match(pointSequenceSource, /getHitoProductMessage\(locale, metric\.title\)/);
  assert.match(
    pointSequenceSource,
    /getHitoKnownProductMessage\(locale, sequence\.selectedPeriod\.label\)/,
  );
  assert.match(pointSequenceSource, /getHitoKnownProductMessage\(locale, observation\.label\)/);
  assert.match(pointSequenceSource, /getHitoKnownProductMessage\(locale, point\.evidence\.label\)/);

  const factualBarChartSource = readSource("src/components/ui/hito-factual-bar-chart.tsx");
  assert.match(factualBarChartSource, /getHitoKnownProductMessage\(locale, series\.title\)/);
  assert.match(factualBarChartSource, /getHitoKnownProductMessage\(locale, period\.label\)/);
  assert.match(
    factualBarChartSource,
    /getHitoKnownProductMessage\(locale, series\.evidenceLabel\)/,
  );
  assert.match(factualBarChartSource, /pointPeriodLabel\(point, locale\)/);
  assert.match(factualBarChartSource, /pointCompletionLabel\(point, locale\)/);
  assert.match(factualBarChartSource, /pointCoverageLabel\(point, locale\)/);
  assert.match(factualBarChartSource, /pointDisplayValue\(point, locale\)/);
  assert.match(
    factualBarChartSource,
    /formatHitoProductMessage\(locale, "\{startDate\} through \{endDate\}"/,
  );
  assert.match(
    factualBarChartSource,
    /"\{includedCount\} of \{candidateCount\} accepted activities"/,
  );
  assert.doesNotMatch(factualBarChartSource, /`\$\{point\.displayValue\} \$\{series\.unitLabel\}`/);

  const avatarSettingsSource = readSource("src/routes/settings.tsx");
  assert.match(avatarSettingsSource, /buildAvatarUploadFile\(file\)\.catch\(\(\) => null\)/);
  assert.match(
    avatarSettingsSource,
    /The source image could not be prepared\. Choose another JPEG, PNG, or WebP image\./,
  );
  assert.doesNotMatch(avatarSettingsSource, /uploadError\.message/);

  const activityFileDialogSource = readSource(
    "src/components/workout-completion/WorkoutActivityFileDialog.tsx",
  );
  assert.match(
    activityFileDialogSource,
    /fallbackReturnFocusRef\.current \?\? returnFocusRef\?\.current/,
  );
  assert.doesNotMatch(
    activityFileDialogSource,
    /returnFocusRef\?\.current \?\? fallbackReturnFocusRef\.current/,
  );

  const savedPlanLibrarySource = readSource("src/components/progress/SavedPlanLibraryPanel.tsx");
  assert.match(savedPlanLibrarySource, /filterButtonLabel=\{message\("Filters"\)\}/);
  assert.match(savedPlanLibrarySource, /activeFiltersLabel=\{message\("Active filters"\)\}/);
  assert.match(savedPlanLibrarySource, /clearAllFiltersLabel=\{message\("Clear all"\)\}/);

  const admittedConsumers = [
    "src/components/Calendar.tsx",
    "src/components/OnboardingGate.tsx",
    "src/components/TodayHero.tsx",
    "src/components/CompletionPanel.tsx",
    "src/components/progress/FactualProgressPanel.tsx",
    "src/routes/settings.tsx",
    "src/routes/workout.$date.tsx",
  ];
  for (const path of admittedConsumers) {
    const source = readSource(path);
    assert.match(source, /useHitoProductMessage|HitoUiLocaleProvider/);
    assert.doesNotMatch(source, /toLocaleDateString\(["']en-US["']/);
    assert.doesNotMatch(source, /toLocaleString\(["']en-US["']/);
  }
}

async function proveLocalPersistenceContract() {
  const supabaseUrl = requireLoopbackEnv("NEXT_PUBLIC_SUPABASE_URL");
  const publishableKey = requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  const admin = createAdminSupabaseClient();
  const password = `Locale-${randomUUID()}-Aa1!`;
  const owner = await createDisposableUser(
    admin,
    `locale-owner-${randomUUID()}@example.test`,
    password,
  );
  const other = await createDisposableUser(
    admin,
    `locale-other-${randomUUID()}@example.test`,
    password,
  );
  const adminPrincipal = await createDisposableUser(
    admin,
    `locale-admin-${randomUUID()}@example.test`,
    password,
    { hito_role: "admin" },
  );

  try {
    const insertedProfiles = await admin
      .from("runner_profiles")
      .insert([
        buildProfile(owner.id, "Locale", "Runner"),
        buildProfile(other.id, "Other", "Runner"),
      ]);
    assert.ifError(insertedProfiles.error);

    const initial = await getUserSettingsForUserId(owner.id, owner.email);
    assert.ok(initial);
    assert.equal(initial.uiLocalePreference, "system");
    assert.equal(initial.uiLocalePreferenceContractViolation, false);
    assert.equal(initial.calendarTimezone, "America/Sao_Paulo");
    assert.deepEqual(initial.trainingPreferences, {
      blocked_days: ["Monday"],
      preferred_long_run_day: "Sunday",
      max_running_days_per_week: 4,
    });

    const systemPortuguese = await getUiLocaleResolutionForUserId(owner.id, "pt-PT, en;q=0.8");
    assert.deepEqual(systemPortuguese, {
      preference: "system",
      preferenceContractViolation: null,
      resolvedLocale: "pt-BR",
    });
    await assertPersistedPreference(admin, owner.id, "system");

    const savedPortuguese = await updateUserSettingsForUserId(
      owner.id,
      {
        firstName: initial.firstName,
        lastName: initial.lastName,
        displayName: initial.displayName,
        age: initial.age,
        weightKg: initial.weightKg,
        heightCm: initial.heightCm,
        fitnessLevel: initial.fitnessLevel ?? undefined,
        trainingPreferences: initial.trainingPreferences,
        uiLocalePreference: "pt-BR",
      },
      owner.email,
    );
    assert.equal(savedPortuguese.uiLocalePreference, "pt-BR");
    assert.equal(savedPortuguese.profileRevision, initial.profileRevision);
    assert.equal(savedPortuguese.calendarTimezone, initial.calendarTimezone);
    assert.deepEqual(savedPortuguese.trainingPreferences, initial.trainingPreferences);

    const explicitPortuguese = await getUiLocaleResolutionForUserId(owner.id, "en-US");
    assert.equal(explicitPortuguese.preference, "pt-BR");
    assert.equal(explicitPortuguese.resolvedLocale, "pt-BR");

    const savedEnglish = await updateUserSettingsForUserId(
      owner.id,
      {
        firstName: savedPortuguese.firstName,
        lastName: savedPortuguese.lastName,
        displayName: savedPortuguese.displayName,
        age: savedPortuguese.age,
        weightKg: savedPortuguese.weightKg,
        heightCm: savedPortuguese.heightCm,
        fitnessLevel: savedPortuguese.fitnessLevel ?? undefined,
        trainingPreferences: savedPortuguese.trainingPreferences,
        uiLocalePreference: "en",
      },
      owner.email,
    );
    assert.equal(savedEnglish.uiLocalePreference, "en");
    assert.equal(savedEnglish.profileRevision, initial.profileRevision);
    assert.deepEqual(savedEnglish.trainingPreferences, initial.trainingPreferences);

    await assert.rejects(
      updateUserSettingsForUserId(
        owner.id,
        {
          firstName: savedEnglish.firstName,
          lastName: savedEnglish.lastName,
          displayName: savedEnglish.displayName,
          age: savedEnglish.age,
          weightKg: savedEnglish.weightKg,
          heightCm: savedEnglish.heightCm,
          fitnessLevel: savedEnglish.fitnessLevel ?? undefined,
          uiLocalePreference: "pt" as "en",
        },
        owner.email,
      ),
      /runner settings could not be saved/i,
    );
    const invalidDirectWrite = await admin
      .from("runner_profiles")
      .update({ ui_locale_preference: "pt" })
      .eq("user_id", owner.id);
    assert.equal(invalidDirectWrite.error?.code, "23514");
    await assertPersistedPreference(admin, owner.id, "en");

    const ownerClient = createClient(supabaseUrl, publishableKey);
    const otherClient = createClient(supabaseUrl, publishableKey);
    assert.ifError(
      (await ownerClient.auth.signInWithPassword({ email: owner.email, password })).error,
    );
    assert.ifError(
      (await otherClient.auth.signInWithPassword({ email: other.email, password })).error,
    );
    const ownerRead = await ownerClient
      .from("runner_profiles")
      .select("user_id, ui_locale_preference");
    assert.ifError(ownerRead.error);
    assert.deepEqual(ownerRead.data, [{ user_id: owner.id, ui_locale_preference: "en" }]);

    const crossUserRead = await otherClient
      .from("runner_profiles")
      .select("user_id, ui_locale_preference")
      .eq("user_id", owner.id);
    assert.ifError(crossUserRead.error);
    assert.deepEqual(crossUserRead.data, []);

    const crossUserWrite = await otherClient
      .from("runner_profiles")
      .update({ ui_locale_preference: "pt-BR" })
      .eq("user_id", owner.id)
      .select("user_id");
    assert.ifError(crossUserWrite.error);
    assert.deepEqual(crossUserWrite.data, []);
    await assertPersistedPreference(admin, owner.id, "en");

    const resolvedAdminUserId = await getPersistedUserIdForAuthContext({
      userId: adminPrincipal.id,
      email: adminPrincipal.email,
      appBaseUrl: "http://localhost:3000",
      provider: "admin",
      adminSession: {
        label: "Disposable admin",
        source: "local_fixture",
        runtimeClass: "loopback",
      },
    });
    const rejectedRunnerAsAdmin = await getPersistedUserIdForAuthContext({
      userId: owner.id,
      email: owner.email,
      appBaseUrl: "http://localhost:3000",
      provider: "admin",
      adminSession: {
        label: "Forged runner mapping",
        source: "local_fixture",
        runtimeClass: "loopback",
      },
    });
    assert.equal(resolvedAdminUserId, adminPrincipal.id);
    assert.equal(rejectedRunnerAsAdmin, null);
    assert.equal(await getUserSettingsForUserId(adminPrincipal.id, adminPrincipal.email), null);

    const adminPortuguese = await updateUserSettingsForUserId(
      adminPrincipal.id,
      preferenceOnlySettingsInput("pt-BR"),
      adminPrincipal.email,
    );
    assert.equal(adminPortuguese.uiLocalePreference, "pt-BR");
    assert.equal(adminPortuguese.profileRevision, 1);
    assert.equal(adminPortuguese.age, null);
    assert.equal(adminPortuguese.weightKg, null);
    assert.equal(adminPortuguese.heightCm, null);
    assert.equal(adminPortuguese.fitnessLevel, null);

    const adminReset = await updateUserSettingsForUserId(
      adminPrincipal.id,
      preferenceOnlySettingsInput("system"),
      adminPrincipal.email,
    );
    assert.equal(adminReset.uiLocalePreference, "system");
    assert.equal(adminReset.profileRevision, 1);
    assert.deepEqual(
      {
        age: adminReset.age,
        weightKg: adminReset.weightKg,
        heightCm: adminReset.heightCm,
        fitnessLevel: adminReset.fitnessLevel,
        trainingPreferences: adminReset.trainingPreferences,
      },
      {
        age: null,
        weightKg: null,
        heightCm: null,
        fitnessLevel: null,
        trainingPreferences: null,
      },
    );
    await assertPersistedPreference(admin, adminPrincipal.id, "system");

    const adminClient = createClient(supabaseUrl, publishableKey);
    assert.ifError(
      (
        await adminClient.auth.signInWithPassword({
          email: adminPrincipal.email,
          password,
        })
      ).error,
    );
    const adminOwnRead = await adminClient
      .from("runner_profiles")
      .select("user_id, ui_locale_preference");
    assert.ifError(adminOwnRead.error);
    assert.deepEqual(adminOwnRead.data, [
      { user_id: adminPrincipal.id, ui_locale_preference: "system" },
    ]);
    const runnerCannotReadAdmin = await ownerClient
      .from("runner_profiles")
      .select("user_id")
      .eq("user_id", adminPrincipal.id);
    assert.ifError(runnerCannotReadAdmin.error);
    assert.deepEqual(runnerCannotReadAdmin.data, []);
  } finally {
    const deletedUsers = await Promise.all(
      [owner, other, adminPrincipal].map((user) => admin.auth.admin.deleteUser(user.id)),
    );
    for (const deletedUser of deletedUsers) {
      assert.ifError(deletedUser.error);
    }

    const remainingProfiles = await admin
      .from("runner_profiles")
      .select("user_id")
      .in("user_id", [owner.id, other.id, adminPrincipal.id]);
    assert.ifError(remainingProfiles.error);
    assert.deepEqual(remainingProfiles.data, []);
  }
}

function buildProfile(userId: string, firstName: string, lastName: string) {
  return {
    user_id: userId,
    first_name: firstName,
    last_name: lastName,
    display_name: `${firstName} ${lastName}`,
    age: 36,
    weight_kg: 70,
    height_cm: 175,
    fitness_level: "running_regularly",
    baseline_revision: 4,
    training_preferences: {
      blocked_days: ["Monday"],
      preferred_long_run_day: "Sunday",
      max_running_days_per_week: 4,
    },
    calendar_timezone: "America/Sao_Paulo",
    calendar_timezone_source: "user",
  };
}

async function assertPersistedPreference(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  userId: string,
  expected: string,
) {
  const result = await admin
    .from("runner_profiles")
    .select("ui_locale_preference")
    .eq("user_id", userId)
    .single();
  assert.ifError(result.error);
  assert.equal(result.data.ui_locale_preference, expected);
}

async function createDisposableUser(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  email: string,
  password: string,
  appMetadata?: Record<string, unknown>,
) {
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: appMetadata,
  });
  assert.ifError(created.error);
  assert.ok(created.data.user);
  return { id: created.data.user.id, email };
}

function preferenceOnlySettingsInput(uiLocalePreference: "system" | "en" | "pt-BR") {
  return {
    firstName: null,
    lastName: null,
    displayName: null,
    age: null,
    weightKg: null,
    heightCm: null,
    uiLocalePreference,
  };
}

function readSource(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for local UI locale validation.`);
  return value;
}

function requireLoopbackEnv(name: string) {
  const value = requireEnv(name);
  const url = new URL(value);
  assert.ok(["127.0.0.1", "localhost", "::1", "[::1]"].includes(url.hostname));
  return value;
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
