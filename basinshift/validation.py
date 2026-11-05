"""
Scientific Validation Protocol and Data Leakage Auditing for BASINSHIFT.
Guarantees strict chronological ordering, spatial basin partitioning, and zero future lookahead.
"""

from typing import List, Dict, Any, Set, Tuple
from datetime import datetime


def parse_date(date_str: str) -> datetime:
    """Parses standard ISO date YYYY-MM-DD."""
    return datetime.strptime(str(date_str)[:10], "%Y-%m-%d")


def validate_chronological_sequence(dates: List[str]) -> Tuple[bool, List[str]]:
    """
    Verifies that the date sequence is strictly monotonically increasing with no duplicates or gaps > 1 day.
    """
    issues = []
    if not dates:
        return False, ["Date list is empty."]

    prev_dt = None
    for i, d_str in enumerate(dates):
        try:
            curr_dt = parse_date(d_str)
        except ValueError:
            issues.append(f"Invalid date format at index {i}: '{d_str}'. Expected YYYY-MM-DD.")
            continue

        if prev_dt is not None:
            delta = (curr_dt - prev_dt).days
            if delta < 0:
                issues.append(f"Temporal inversion at index {i}: {d_str} precedes {dates[i-1]}.")
            elif delta == 0:
                issues.append(f"Duplicate date detected at index {i}: {d_str}.")
            elif delta > 1:
                issues.append(f"Temporal gap of {delta} days detected between {dates[i-1]} and {d_str}.")

        prev_dt = curr_dt

    return len(issues) == 0, issues


def validate_no_future_leakage(records: List[Dict[str, Any]], forecast_origin: str) -> Tuple[bool, List[str]]:
    """
    Red-teams the feature records against the forecast origin.
    Ensures no observation or forcing timestamp exceeds forecast_origin (t > t_0).
    """
    origin_dt = parse_date(forecast_origin)
    violations = []

    for r in records:
        d_str = r.get("date")
        if not d_str:
            violations.append("Record missing required 'date' field.")
            continue

        r_dt = parse_date(d_str)
        if r_dt > origin_dt:
            violations.append(
                f"Future leakage violation: Record date {d_str} is after forecast origin {forecast_origin}."
            )

    return len(violations) == 0, violations


def validate_spinup_history(records: List[Dict[str, Any]], min_days: int = 90) -> Tuple[bool, str]:
    """
    Verifies that antecedent forcing history meets the 90-day hydrological spin-up requirement
    needed to equilibrate the 4 linear storage reservoirs (especially S4 baseflow, k=0.015).
    """
    count = len(records)
    if count < min_days:
        return False, (
            f"Spin-up warning: Provided {count} days of history. "
            f"Hydrological baseflow equilibration requires at least {min_days} antecedent days."
        )
    return True, f"Spin-up requirement satisfied ({count} days >= {min_days} days)."


def validate_spatial_partition(
    train_basins: Set[str],
    eval_basins: Set[str]
) -> Tuple[bool, Set[str]]:
    """
    Ensures complete spatial disjointness between training catchments and unseen evaluation catchments.
    Intersection MUST be empty (null set) to guarantee true Ungauged Basin (PUB) testing.
    """
    overlap = train_basins.intersection(eval_basins)
    is_valid = len(overlap) == 0
    return is_valid, overlap
