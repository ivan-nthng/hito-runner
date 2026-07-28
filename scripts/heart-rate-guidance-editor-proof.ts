import assert from "node:assert/strict";

import {
  buildHeartRateProfileDraft,
  HEART_RATE_GUIDANCE_SCALE,
  updateHeartRateDraftFromSlider,
  updateHeartRateDraftText,
  validateHeartRateProfileDraft,
  type HeartRateProfileDraftZone,
} from "@/components/settings/heart-rate-profile-editor-model";
import { displayTargetEntries } from "@/lib/training";
import type { HeartRateZonesSummary } from "@/lib/heart-rate-zones";

const baseDraft = (): HeartRateProfileDraftZone[] =>
  [
    [90, 110],
    [100, 130],
    [105, 140],
    [120, 155],
    [140, 170],
  ].map(([minBpm, maxBpm], index) => ({
    reference: `Z${index + 1}` as HeartRateProfileDraftZone["reference"],
    label: `Band ${index + 1}`,
    description: "",
    minBpm: String(minBpm),
    maxBpm: String(maxBpm),
    sliderMinBpm: minBpm,
    sliderMaxBpm: maxBpm,
  }));

const sliderMatrix = (draft: HeartRateProfileDraftZone[]) =>
  draft.map((zone) => [zone.sliderMinBpm, zone.sliderMaxBpm]);

assert.deepEqual(HEART_RATE_GUIDANCE_SCALE, {
  min: 60,
  max: 200,
  ticks: [60, 95, 130, 165, 200],
});

const lowerRipple = updateHeartRateDraftFromSlider({
  draft: baseDraft(),
  field: "minBpm",
  index: 3,
  value: 95,
});
assert.deepEqual(sliderMatrix(lowerRipple), [
  [90, 110],
  [95, 130],
  [95, 140],
  [95, 155],
  [140, 170],
]);

const upperRipple = updateHeartRateDraftFromSlider({
  draft: baseDraft(),
  field: "maxBpm",
  index: 1,
  value: 165,
});
assert.deepEqual(sliderMatrix(upperRipple), [
  [90, 110],
  [100, 165],
  [105, 165],
  [120, 165],
  [140, 170],
]);

const equalityRipple = updateHeartRateDraftFromSlider({
  draft: baseDraft(),
  field: "minBpm",
  index: 1,
  value: 130,
});
assert.deepEqual(sliderMatrix(equalityRipple), [
  [90, 110],
  [130, 130],
  [130, 140],
  [130, 155],
  [140, 170],
]);
assert.equal(validateHeartRateProfileDraft(equalityRipple).summary, null);

const lowerBoundary = updateHeartRateDraftFromSlider({
  draft: baseDraft(),
  field: "minBpm",
  index: 3,
  value: 20,
});
assert.equal(lowerBoundary[0].sliderMinBpm, 60);
assert.equal(lowerBoundary[3].sliderMinBpm, 60);

const upperBoundary = updateHeartRateDraftFromSlider({
  draft: baseDraft(),
  field: "maxBpm",
  index: 1,
  value: 240,
});
assert.equal(upperBoundary[1].sliderMaxBpm, 200);
assert.equal(upperBoundary[4].sliderMaxBpm, 200);

const typedInvalid = updateHeartRateDraftText({
  draft: baseDraft(),
  field: "minBpm",
  index: 2,
  value: "205",
});
assert.equal(typedInvalid[2].minBpm, "205");
assert.equal(typedInvalid[2].sliderMinBpm, 105);
assert.match(validateHeartRateProfileDraft(typedInvalid).summary ?? "", /60 to 200/);

const typedReversed = updateHeartRateDraftText({
  draft: baseDraft(),
  field: "minBpm",
  index: 2,
  value: "145",
});
assert.equal(typedReversed[2].minBpm, "145");
assert.equal(typedReversed[2].sliderMinBpm, 105);
assert.match(validateHeartRateProfileDraft(typedReversed).summary ?? "", /start at or below/);

const historicalSummary: HeartRateZonesSummary = {
  source: "personal",
  accepted: true,
  title: "Historical",
  description: "",
  sourceNote: null,
  estimatedMaxHr: null,
  zones: baseDraft().map((zone, index) => ({
    reference: zone.reference,
    label: zone.label,
    description: "",
    minBpm: index === 0 ? 40 : zone.sliderMinBpm,
    maxBpm: index === 4 ? 220 : zone.sliderMaxBpm,
    rangeBpm: "",
  })),
};
const historicalDraft = buildHeartRateProfileDraft(historicalSummary);
assert.equal(historicalDraft[0].minBpm, "40");
assert.equal(historicalDraft[0].sliderMinBpm, 60);
assert.equal(historicalDraft[4].maxBpm, "220");
assert.equal(historicalDraft[4].sliderMaxBpm, 200);

const fullBand = displayTargetEntries({
  primary_execution_mode: "heart_rate",
  hr_bpm_range: "110-135 bpm",
  hr_target_source: "personal_hr_zone",
  extra: {
    hr_zone_reference: "Z2",
    hr_profile_source: "personal",
    hr_band_bpm_min: 110,
    hr_band_bpm_max: 135,
    hr_execution_range_kind: "full_band",
  },
});
assert.deepEqual(fullBand[0], {
  key: "hr_bpm_range",
  label: "Personal HR · Easy full band",
  value: "110-135 bpm",
});

const subrange = displayTargetEntries({
  primary_execution_mode: "heart_rate",
  hr_bpm_range: "120-130 bpm",
  hr_target_source: "default_estimated_hr",
  extra: {
    hr_zone_reference: "Z3",
    hr_profile_source: "estimated",
    hr_band_bpm_min: 110,
    hr_band_bpm_max: 140,
    hr_execution_range_kind: "ai_selected_subrange",
  },
});
assert.deepEqual(subrange[0], {
  key: "hr_bpm_range",
  label: "Estimated HR · AI-selected Long aerobic subrange",
  value: "120-130 bpm within Long aerobic 110-140 bpm",
});

console.log("Heart-rate guidance editor proof passed.");
