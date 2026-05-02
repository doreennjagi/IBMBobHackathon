"""
Merchant Fingerprinting Service

Normalizes merchant names and maps payment references to known
subscription service providers using fuzzy matching and alias databases.
"""

import pandas as pd
from typing import Dict, List, Optional
import re
import logging

logger = logging.getLogger(__name__)


class MerchantFingerprintService:
    """
    Service for normalizing merchant names and identifying subscription providers.
    
    Uses a combination of exact matching, fuzzy matching, and known alias mapping
    to standardize merchant names across different bank statement formats.
    """
    
    def __init__(self):
        self.merchant_database = self._load_merchant_database()
        
    def _load_merchant_database(self) -> Dict[str, Dict]:
        """
        Load known subscription providers and their aliases.
        
        In production, this would be loaded from a database or JSON file.
        """
        
        return {
            # Streaming Services
            "netflix": {
                "canonical_name": "Netflix",
                "category": "streaming",
                "aliases": ["netflix.com", "netflix inc", "nflx", "netflix subscription"],
                "typical_amounts": [9.99, 13.99, 15.99, 19.99]
            },
            "spotify": {
                "canonical_name": "Spotify",
                "category": "music",
                "aliases": ["spotify.com", "spotify ab", "spotify premium", "spotify subscription"],
                "typical_amounts": [9.99, 14.99]
            },
            "amazon_prime": {
                "canonical_name": "Amazon Prime",
                "category": "shopping",
                "aliases": ["amazon prime", "amzn prime", "prime video", "amazon.com"],
                "typical_amounts": [12.99, 14.99]
            },
            "apple_music": {
                "canonical_name": "Apple Music",
                "category": "music",
                "aliases": ["apple.com/bill", "apple music", "itunes", "apple subscription"],
                "typical_amounts": [9.99, 14.99]
            },
            "icloud": {
                "canonical_name": "iCloud Storage",
                "category": "cloud_storage",
                "aliases": ["icloud", "apple icloud", "icloud storage"],
                "typical_amounts": [0.99, 2.99, 9.99]
            },
            "adobe": {
                "canonical_name": "Adobe Creative Cloud",
                "category": "software",
                "aliases": ["adobe", "adobe creative", "adobe cc", "adobe systems"],
                "typical_amounts": [9.99, 20.99, 52.99]
            },
            "microsoft_365": {
                "canonical_name": "Microsoft 365",
                "category": "software",
                "aliases": ["microsoft 365", "office 365", "msft", "microsoft subscription"],
                "typical_amounts": [6.99, 9.99, 12.99]
            },
            "youtube_premium": {
                "canonical_name": "YouTube Premium",
                "category": "streaming",
                "aliases": ["youtube premium", "youtube music", "google youtube"],
                "typical_amounts": [11.99, 17.99]
            },
            "showmax": {
                "canonical_name": "Showmax",
                "category": "streaming",
                "aliases": ["showmax", "showmax subscription"],
                "typical_amounts": [7.99, 12.99]
            },
            "dstv": {
                "canonical_name": "DStv",
                "category": "tv",
                "aliases": ["dstv", "multichoice", "dstv subscription"],
                "typical_amounts": [15.00, 30.00, 50.00, 80.00]
            },
            # Add more providers as needed
        }
    
    def normalize_transactions(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Normalize merchant names in transaction DataFrame.
        
        Args:
            df: DataFrame with merchant/description column
            
        Returns:
            DataFrame with normalized merchant names
        """
        
        if 'merchant' not in df.columns:
            logger.warning("No merchant column found in DataFrame")
            return df
        
        # Apply normalization to each merchant name
        df['merchant_normalized'] = df['merchant'].apply(self._normalize_merchant_name)
        
        # Use normalized name as primary merchant field
        df['merchant'] = df['merchant_normalized']
        
        return df
    
    def _normalize_merchant_name(self, raw_name: str) -> str:
        """
        Normalize a single merchant name.
        
        Steps:
        1. Clean and standardize format
        2. Check against known providers
        3. Return canonical name or cleaned version
        """
        
        if pd.isna(raw_name):
            return "Unknown"
        
        # Convert to lowercase and remove extra whitespace
        cleaned = str(raw_name).lower().strip()
        cleaned = re.sub(r'\s+', ' ', cleaned)
        
        # Remove common payment processor prefixes
        prefixes_to_remove = [
            'paypal *',
            'card purchase ',
            'pos ',
            'atm ',
            'online payment ',
            'subscription ',
        ]
        
        for prefix in prefixes_to_remove:
            if cleaned.startswith(prefix):
                cleaned = cleaned[len(prefix):].strip()
        
        # Check against known providers
        for provider_key, provider_data in self.merchant_database.items():
            canonical_name = provider_data['canonical_name']
            aliases = provider_data['aliases']
            
            # Check if cleaned name matches any alias
            for alias in aliases:
                if alias.lower() in cleaned or cleaned in alias.lower():
                    return canonical_name
            
            # Check if provider key is in cleaned name
            if provider_key.replace('_', ' ') in cleaned:
                return canonical_name
        
        # If no match found, return cleaned version with title case
        return cleaned.title()
    
    def identify_provider(self, merchant_name: str, amount: float) -> Optional[Dict]:
        """
        Identify subscription provider and return metadata.
        
        Args:
            merchant_name: Normalized merchant name
            amount: Transaction amount
            
        Returns:
            Provider metadata if identified, None otherwise
        """
        
        merchant_lower = merchant_name.lower()
        
        for provider_key, provider_data in self.merchant_database.items():
            if merchant_name == provider_data['canonical_name']:
                return {
                    "provider_id": provider_key,
                    "canonical_name": provider_data['canonical_name'],
                    "category": provider_data['category'],
                    "is_known_provider": True,
                    "amount_matches_typical": amount in provider_data['typical_amounts']
                }
        
        return None
    
    def get_provider_category(self, merchant_name: str) -> str:
        """
        Get category for a merchant.
        
        Returns: streaming, music, software, cloud_storage, tv, shopping, or other
        """
        
        for provider_data in self.merchant_database.values():
            if merchant_name == provider_data['canonical_name']:
                return provider_data['category']
        
        return "other"
    
    def add_custom_provider(self, canonical_name: str, aliases: List[str], 
                           category: str, typical_amounts: List[float]):
        """
        Add a custom provider to the database (for user-defined mappings).
        
        This allows users to teach the system about new subscription services.
        """
        
        provider_key = canonical_name.lower().replace(' ', '_')
        
        self.merchant_database[provider_key] = {
            "canonical_name": canonical_name,
            "category": category,
            "aliases": aliases,
            "typical_amounts": typical_amounts
        }
        
        logger.info(f"Added custom provider: {canonical_name}")

# Made with Bob
