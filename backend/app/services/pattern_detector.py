"""
Subscription Pattern Detection Service

Uses Pandas frequency analysis to identify recurring payment patterns
in bank transaction data and classify them as subscriptions.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class SubscriptionPatternDetector:
    """
    Detects subscription patterns in transaction data using frequency analysis.
    
    This service analyzes transaction history to identify recurring payments
    that match subscription billing patterns (monthly, weekly, quarterly, annual).
    """
    
    def __init__(self):
        self.min_frequency = settings.MIN_TRANSACTION_FREQUENCY
        self.analysis_window_months = settings.ANALYSIS_WINDOW_MONTHS
        
    def detect_subscriptions(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Detect subscription patterns in transaction DataFrame.
        
        Args:
            df: Pandas DataFrame with columns: date, merchant, amount
            
        Returns:
            List of detected subscriptions with metadata
        """
        
        if df.empty:
            return []
        
        # Normalize column names
        df = self._normalize_columns(df)
        
        # Convert date column to datetime
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        df = df.dropna(subset=['date'])
        
        # Sort by date
        df = df.sort_values('date')
        
        # Group by merchant and analyze frequency
        subscriptions = []
        
        for merchant, group in df.groupby('merchant'):
            if len(group) < self.min_frequency:
                continue
            
            subscription = self._analyze_merchant_pattern(merchant, group)
            
            if subscription:
                subscriptions.append(subscription)
        
        logger.info(f"Detected {len(subscriptions)} subscriptions from {len(df)} transactions")
        
        return subscriptions
    
    def _normalize_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Normalize column names to standard format.
        
        Handles various CSV formats from different banks.
        """
        
        # Common column name variations
        date_columns = ['date', 'transaction_date', 'posting_date', 'value_date', 'Date', 'DATE']
        merchant_columns = ['merchant', 'description', 'payee', 'details', 'Description', 'DESCRIPTION']
        amount_columns = ['amount', 'debit', 'withdrawal', 'Amount', 'AMOUNT']
        
        # Find and rename columns
        for col in df.columns:
            if col in date_columns:
                df = df.rename(columns={col: 'date'})
            elif col in merchant_columns:
                df = df.rename(columns={col: 'merchant'})
            elif col in amount_columns:
                df = df.rename(columns={col: 'amount'})
        
        # Ensure required columns exist
        required = ['date', 'merchant', 'amount']
        missing = [col for col in required if col not in df.columns]
        
        if missing:
            logger.warning(f"Missing columns: {missing}. Using first 3 columns as fallback.")
            if len(df.columns) >= 3:
                df.columns = ['date', 'merchant', 'amount'] + list(df.columns[3:])
        
        return df
    
    def _analyze_merchant_pattern(self, merchant: str, group: pd.DataFrame) -> Dict[str, Any]:
        """
        Analyze transaction pattern for a specific merchant.
        
        Determines if the pattern matches subscription billing cycles.
        """
        
        # Calculate time differences between transactions
        group = group.sort_values('date')
        group['days_diff'] = group['date'].diff().dt.days
        
        # Remove first NaN value
        days_diffs = group['days_diff'].dropna()
        
        if len(days_diffs) == 0:
            return None
        
        # Calculate average interval
        avg_interval = days_diffs.mean()
        std_interval = days_diffs.std()
        
        # Classify billing cycle
        billing_cycle = self._classify_billing_cycle(avg_interval, std_interval)
        
        if not billing_cycle:
            return None
        
        # Calculate average amount
        avg_amount = group['amount'].abs().mean()
        
        # Detect price changes
        price_changes = self._detect_price_changes(group)
        
        # Calculate subscription health
        health_status = self._calculate_health_status(group, price_changes)
        
        return {
            "merchant": merchant,
            "billing_cycle": billing_cycle,
            "frequency": len(group),
            "avg_amount": round(avg_amount, 2),
            "monthly_cost": round(self._calculate_monthly_cost(avg_amount, billing_cycle), 2),
            "first_charge": group['date'].min().isoformat(),
            "last_charge": group['date'].max().isoformat(),
            "price_changes": price_changes,
            "health_status": health_status,
            "confidence_score": self._calculate_confidence(days_diffs, std_interval)
        }
    
    def _classify_billing_cycle(self, avg_interval: float, std_interval: float) -> str:
        """
        Classify the billing cycle based on average interval between charges.
        
        Returns: weekly, bi-weekly, monthly, quarterly, annual, or None
        """
        
        # Allow 20% variance for classification
        tolerance = 0.20
        
        cycles = {
            "weekly": 7,
            "bi-weekly": 14,
            "monthly": 30,
            "quarterly": 90,
            "annual": 365
        }
        
        for cycle_name, expected_days in cycles.items():
            lower_bound = expected_days * (1 - tolerance)
            upper_bound = expected_days * (1 + tolerance)
            
            if lower_bound <= avg_interval <= upper_bound:
                # Check if standard deviation is reasonable
                if std_interval < expected_days * 0.3:  # 30% variance allowed
                    return cycle_name
        
        return None
    
    def _detect_price_changes(self, group: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Detect significant price changes (>10% threshold).
        """
        
        price_changes = []
        amounts = group['amount'].abs().values
        dates = group['date'].values
        
        for i in range(1, len(amounts)):
            prev_amount = amounts[i-1]
            curr_amount = amounts[i]
            
            if prev_amount > 0:
                change_pct = ((curr_amount - prev_amount) / prev_amount) * 100
                
                if abs(change_pct) > settings.PRICE_HIKE_THRESHOLD * 100:
                    price_changes.append({
                        "date": pd.Timestamp(dates[i]).isoformat(),
                        "old_price": round(prev_amount, 2),
                        "new_price": round(curr_amount, 2),
                        "change_percent": round(change_pct, 2),
                        "is_increase": change_pct > 0
                    })
        
        return price_changes
    
    def _calculate_health_status(self, group: pd.DataFrame, price_changes: List) -> str:
        """
        Calculate subscription health status.
        
        Returns: active, zombie, escalating, or critical
        """
        
        last_charge = group['date'].max()
        days_since_last = (datetime.now() - last_charge).days
        
        # Check if zombie (no recent charges)
        if days_since_last > 60:
            return "zombie"
        
        # Check if escalating (multiple price increases)
        recent_increases = [pc for pc in price_changes if pc['is_increase']]
        if len(recent_increases) >= 2:
            return "escalating"
        
        # Check if critical (single large increase)
        if any(pc['change_percent'] > 20 for pc in recent_increases):
            return "critical"
        
        return "active"
    
    def _calculate_monthly_cost(self, avg_amount: float, billing_cycle: str) -> float:
        """
        Convert average charge to estimated monthly cost.
        """
        
        multipliers = {
            "weekly": 4.33,      # ~4.33 weeks per month
            "bi-weekly": 2.17,   # ~2.17 bi-weeks per month
            "monthly": 1.0,
            "quarterly": 0.33,   # 1/3 month
            "annual": 0.083      # 1/12 month
        }
        
        return avg_amount * multipliers.get(billing_cycle, 1.0)
    
    def _calculate_confidence(self, days_diffs: pd.Series, std_interval: float) -> float:
        """
        Calculate confidence score for subscription classification.
        
        Higher confidence for more consistent intervals.
        """
        
        if len(days_diffs) < 2:
            return 0.5
        
        # Lower standard deviation = higher confidence
        avg_interval = days_diffs.mean()
        
        if avg_interval == 0:
            return 0.5
        
        coefficient_of_variation = std_interval / avg_interval
        
        # Convert to confidence score (0-1)
        confidence = max(0.0, min(1.0, 1.0 - coefficient_of_variation))
        
        return round(confidence, 2)

# Made with Bob
