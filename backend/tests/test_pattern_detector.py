from datetime import date, timedelta
import pandas as pd
import pytest
from app.services.pattern_detector import Frequency, SubscriptionPatternDetector, SubscriptionStatus

TODAY = date.today()

def make_df(merchant, amount, count, gap_days, amounts_override=None):
    rows = []
    start = TODAY - timedelta(days=gap_days * (count - 1))
    for i in range(count):
        rows.append({
            "date": str(start + timedelta(days=i * gap_days)),
            "merchant_name": merchant,
            "amount": amounts_override[i] if amounts_override else amount,
            "transaction_id": f"TXN{i:04d}"
        })
    return pd.DataFrame(rows)

@pytest.fixture
def detector():
    return SubscriptionPatternDetector()

def test_monthly_subscription_detected(detector):
    df = make_df("Netflix", 1100.0, count=6, gap_days=30)
    results = detector.detect(df)
    assert len(results) == 1
    assert results[0].frequency == Frequency.MONTHLY
    assert results[0].status == SubscriptionStatus.ACTIVE

def test_irregular_merchant_not_flagged(detector):
    rows = [
        {"date": str(TODAY - timedelta(days=90)), "merchant_name": "Naivas Supermarket", "amount": 3200.0, "transaction_id": "T1"},
        {"date": str(TODAY - timedelta(days=74)), "merchant_name": "Naivas Supermarket", "amount": 1500.0, "transaction_id": "T2"},
        {"date": str(TODAY - timedelta(days=51)), "merchant_name": "Naivas Supermarket", "amount": 4100.0, "transaction_id": "T3"},
        {"date": str(TODAY - timedelta(days=14)), "merchant_name": "Naivas Supermarket", "amount": 870.0, "transaction_id": "T4"},
    ]
    results = detector.detect(pd.DataFrame(rows))
    assert all("Naivas" not in s.merchant_canonical for s in results)

def test_price_increase_flagged(detector):
    amounts = [299.0, 299.0, 299.0, 299.0, 399.0]
    df = make_df("Spotify", 299.0, count=5, gap_days=30, amounts_override=amounts)
    results = detector.detect(df)
    sub = next((s for s in results if "Spotify" in s.merchant_canonical), None)
    assert sub is not None
    assert sub.price_alert.alert_level == "HIGH"
    assert sub.status == SubscriptionStatus.CRITICAL

def test_annual_subscription_detected(detector):
    df = make_df("iCloud", 1200.0, count=3, gap_days=365)
    results = detector.detect(df)
    sub = next((s for s in results if "iCloud" in s.merchant_canonical), None)
    assert sub is not None
    assert sub.frequency == Frequency.ANNUAL

def test_empty_dataframe_returns_empty(detector):
    df = pd.DataFrame(columns=["date", "merchant_name", "amount", "transaction_id"])
    assert detector.detect(df) == []
