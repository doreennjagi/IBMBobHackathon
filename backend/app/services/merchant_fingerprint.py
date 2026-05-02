from dataclasses import dataclass

MERCHANT_DATABASE = {
    "netflix": {"canonical": "Netflix", "category": "Streaming", "known": True},
    "nflx": {"canonical": "Netflix", "category": "Streaming", "known": True},
    "spotify": {"canonical": "Spotify", "category": "Music", "known": True},
    "showmax": {"canonical": "Showmax", "category": "Streaming", "known": True},
    "dstv": {"canonical": "DStv", "category": "Streaming", "known": True},
    "youtube premium": {"canonical": "YouTube Premium", "category": "Streaming", "known": True},
    "apple icloud": {"canonical": "iCloud", "category": "Cloud Storage", "known": True},
    "icloud": {"canonical": "iCloud", "category": "Cloud Storage", "known": True},
    "google one": {"canonical": "Google One", "category": "Cloud Storage", "known": True},
    "dropbox": {"canonical": "Dropbox", "category": "Cloud Storage", "known": True},
    "adobe": {"canonical": "Adobe Creative Cloud", "category": "Software", "known": True},
    "microsoft 365": {"canonical": "Microsoft 365", "category": "Software", "known": True},
    "notion": {"canonical": "Notion", "category": "Productivity", "known": True},
    "canva": {"canonical": "Canva", "category": "Design", "known": True},
    "safaricom": {"canonical": "Safaricom", "category": "Telecom", "known": True},
    "m-pesa": {"canonical": "M-Pesa", "category": "Mobile Money", "known": True},
    "zuku": {"canonical": "Zuku", "category": "Internet/TV", "known": True},
    "airtel": {"canonical": "Airtel", "category": "Telecom", "known": True},
}

@dataclass
class MerchantMatch:
    raw_name: str
    canonical_name: str
    category: str
    known_provider: bool
    match_score: float

class MerchantFingerprintService:
    def __init__(self):
        self._db = {k.lower(): v for k, v in MERCHANT_DATABASE.items()}

    def identify(self, raw_name: str) -> MerchantMatch:
        normalized = raw_name.lower().strip()
        if normalized in self._db:
            e = self._db[normalized]
            return MerchantMatch(raw_name, e["canonical"], e["category"], e["known"], 1.0)
        for key, e in self._db.items():
            if key in normalized or normalized in key:
                return MerchantMatch(raw_name, e["canonical"], e["category"], e["known"], 0.85)
        best_score, best_e = 0.0, None
        for key, e in self._db.items():
            score = self._similarity(normalized, key)
            if score > best_score:
                best_score, best_e = score, e
        if best_score >= 0.7 and best_e:
            return MerchantMatch(raw_name, best_e["canonical"], best_e["category"], best_e["known"], round(best_score, 2))
        return MerchantMatch(raw_name, raw_name.title(), "Unknown", False, 0.0)

    @staticmethod
    def _similarity(a: str, b: str) -> float:
        def bigrams(s):
            return {s[i:i+2] for i in range(len(s) - 1)}
        a_bg, b_bg = bigrams(a), bigrams(b)
        if not a_bg or not b_bg:
            return 0.0
        return len(a_bg & b_bg) / len(a_bg | b_bg)
