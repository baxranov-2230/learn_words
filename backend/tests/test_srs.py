from app.services.srs import MIN_EF, review


def test_first_correct_review_quality_5():
    r = review(quality=5, prev_repetitions=0, prev_interval_days=0, prev_ease_factor=2.5)
    assert r.repetitions == 1
    assert r.interval_days == 1
    assert r.ease_factor >= 2.5
    assert r.mastery_level == 1


def test_second_correct_review_is_six_days():
    r = review(quality=5, prev_repetitions=1, prev_interval_days=1, prev_ease_factor=2.5)
    assert r.repetitions == 2
    assert r.interval_days == 6
    assert r.mastery_level == 2


def test_third_review_uses_ef_multiplier():
    r = review(quality=4, prev_repetitions=2, prev_interval_days=6, prev_ease_factor=2.5)
    assert r.repetitions == 3
    assert r.interval_days == round(6 * r.ease_factor)


def test_failure_resets_repetitions_and_interval():
    r = review(quality=2, prev_repetitions=5, prev_interval_days=30, prev_ease_factor=2.5)
    assert r.repetitions == 0
    assert r.interval_days == 1
    assert r.mastery_level == 0


def test_ease_factor_floor():
    r = review(quality=0, prev_repetitions=0, prev_interval_days=0, prev_ease_factor=1.3)
    assert r.ease_factor >= MIN_EF


def test_invalid_quality_raises():
    import pytest

    with pytest.raises(ValueError):
        review(quality=6, prev_repetitions=0, prev_interval_days=0, prev_ease_factor=2.5)
    with pytest.raises(ValueError):
        review(quality=-1, prev_repetitions=0, prev_interval_days=0, prev_ease_factor=2.5)


def test_mastery_caps_at_5():
    r = review(quality=5, prev_repetitions=10, prev_interval_days=100, prev_ease_factor=2.5)
    assert r.mastery_level == 5
