from dataclasses import dataclass, field
from enum import Enum
import numpy as np
import pandas as pd
from app.services.merchant_fingerprint import MerchantFingerprintService

class Frequency(str, Enum):
    WEEKLY = "weekly"
    BI_WEEKLY = "bi-weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUAL = "annual"
    IRREGULAR = "irregular"

class SubscriptionStatus(str, Enum):
    ACTIVE = "Active"
    ZOMBIE = "Zombie"
    ESCALATING = "Escalating"
    CRITICAL = "Critical"

@dataclass
class PriceAlert:
    original_price: float
    current_price: float
    percentage_change: float
    months_affected: int
    alert_level: str
    total_overcharge: float

@dataclass
class DetectedSubscription:
    merchant_raw: str
    merchant_canonical: str
    category: str
    known_provider: bool
    frequency: Frequency
    average_amount: float
    latest_amount: float
    first_seen: str
    last_seen: str
    transaction_count: int
    confidence_score: float
    status: SubscriptionStatus
    price_alert: PriceAlert | None = None
    all_amounts: list[float] = field(default_factory=list)

FREQUENCY_BANDS = {
    Frequency.WEEKLY: (5, 9),
    Frequency.BI_WEEKLY: (10, 18),
    Frequency.MONTHLY: (25, 35),
    Frequency.QUARTERLY: (80, 100),
    Frequency.ANNUAL: (340, 390),
}
PRICE_HIKE_THRESHOLD = 0.10
CREEP_THRESHOLD = 0.05
ZOMBIE_DAYS = 60
MIN_OCCURRENCES = 2

class SubscriptionPatternDetector:
    def __init__(self):
        self._fingerprint = MerchantFingerprintService()

    def detect(self, df: pd.DataFrame) -> list[DetectedSubscription]:
        if df.empty:
            return []
        df = self._normalize(df)
        results = []
        for canonical, group in df.groupby("merchant_canonical"):
            group = group.sort_values("date")
            if len(group) < MIN_OCCURRENCES:
                continue
            freq, confidence = self._classify_frequency(group)
            if freq == Frequency.IRREGULAR:
                continue
            match = self._fingerprint.identify(group["merchant_name"].iloc[0])
            amounts = group["amount"].tolist()
            results.append(DetectedSubscription(
                merchant_raw=group["merchant_name"].iloc[0],
                merchant_canonical=str(canonical),
                category=match.category,
                known_provider=match.known_provider,
                frequency=freq,
                average_amount=round(float(np.mean(amounts)), 2),
                latest_amount=round(float(amounts[-1]), 2),
                first_seen=str(group["date"].iloc[0].date()),
                last_seen=str(group["date"].iloc[-1].date()),
                transaction_count=len(group),
                confidence_score=round(confidence, 2),
                status=self._compute_status(group),
                price_alert=self.detect_price_changes(group),
                all_amounts=amounts,
            ))
        return sorted(results, key=lambda s: s.average_amount, reverse=True)

    def detect_price_changes(self, group: pd.DataFrame) -> PriceAlert | None:
        amounts = group.sort_values("date")["amount"].tolist()
        if len(amounts) < 2:
            return None
        baseline = float(np.mean(amounts[:-1]))
        current = amounts[-1]
        if baseline == 0:
            return None
        single_change = (current - baseline) / baseline
        first_to_last = (current - amounts[0]) / amounts[0] if amounts[0] != 0 else 0
        if single_change >= PRICE_HIKE_THRESHOLD:
            level = "HIGH"
        elif first_to_last >= CREEP_THRESHOLD:
            level = "MEDIUM"
        elif single_change > 0:
            level = "LOW"
        else:
            return None
        return PriceAlert(
            original_price=round(baseline, 2),
            current_price=round(current, 2),
            percentage_change=round(single_change * 100, 1),
            months_affected=len([a for a in amounts if a > baseline]),
            alert_level=level,
            total_overcharge=round(sum(max(a - baseline, 0) for a in amounts), 2),
        )

    def _normalize(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df["date"] = pd.to_datetime(df["date"], infer_datetime_format=True)
        df["amount"] = pd.to_numeric(df["amount"], errors="coerce").abs()
        df = df.dropna(subset=["date", "amount", "merchant_name"])
        df["merchant_name"] = df["merchant_name"].str.strip()
        df["merchant_canonical"] = df["merchant_name"].apply(
            lambda name: self._fingerprint.identify(name).canonical_name)
        return df

    def _classify_frequency(self, group):
        dates = group["date"].sort_values()
        if len(dates) < 2:
            return Frequency.IRREGULAR, 0.0
        gaps = dates.diff().dropna().dt.days.tolist()
        median_gap = float(np.median(gaps))
        std_gap = float(np.std(gaps)) if len(gaps) > 1 else 0.0
        for freq, (low, high) in FREQUENCY_BANDS.items():
            if low <= median_gap <= high:
                confidence = max(0.5, 1.0 - (std_gap / max(median_gap, 1)) * 0.5)
                if len(group) >= 4:
                    confidence = min(1.0, confidence + 0.1)
                return freq, confidence
        return Frequency.IRREGULAR, 0.0

    def _compute_status(self, group):
        days_since = (pd.Timestamp.now() - group["date"].max()).days
        if days_since > ZOMBIE_DAYS:
            return SubscriptionStatus.ZOMBIE
        amounts = group.sort_values("date")["amount"].tolist()
        if len(amounts) >= 2:
            baseline = float(np.mean(amounts[:-1]))
            current = amounts[-1]
            if baseline > 0:
                change = (current - baseline) / baseline
                if change >= PRICE_HIKE_THRESHOLD:
                    return SubscriptionStatus.CRITICAL
                if change >= CREEP_THRESHOLD:
                    return SubscriptionStatus.ESCALATING
        return SubscriptionStatus.ACTIVE
