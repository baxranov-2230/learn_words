"""SM-2 (SuperMemo 2) algoritmi.

quality 0..5:
  5 — perfect, 4 — correct (hesitation), 3 — correct (difficult)
  2 — wrong (easy to remember), 1 — wrong, 0 — total blackout

Returns updated (repetitions, interval_days, ease_factor, mastery_level).
mastery_level: 0..5 — quality va repetitions asosida soddalashtirilgan ko'rsatkich.
"""

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class SRSResult:
    repetitions: int
    interval_days: int
    ease_factor: float
    mastery_level: int


MIN_EF = 1.3


def review(
    *,
    quality: int,
    prev_repetitions: int,
    prev_interval_days: int,
    prev_ease_factor: float,
) -> SRSResult:
    if not 0 <= quality <= 5:
        raise ValueError("quality must be in [0, 5]")

    ef = prev_ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    ef = max(MIN_EF, ef)

    if quality < 3:
        repetitions = 0
        interval_days = 1
    else:
        repetitions = prev_repetitions + 1
        if repetitions == 1:
            interval_days = 1
        elif repetitions == 2:
            interval_days = 6
        else:
            interval_days = max(1, round(prev_interval_days * ef))

    # Mastery: kombinatsiya — repetitions va quality.
    if quality < 3:
        mastery = 0
    else:
        mastery = min(5, repetitions)

    return SRSResult(
        repetitions=repetitions,
        interval_days=interval_days,
        ease_factor=round(ef, 4),
        mastery_level=mastery,
    )
