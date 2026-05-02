"""
Test script for live watsonx Orchestrate integration
Run this to verify the API connection and agent invocation
"""

import asyncio
import sys
import os

# Fix Windows encoding issues
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.agents.orchestrate_client import get_orchestrate_client
from app.agents.orchestrator import SubLeechAgentOrchestrator
from app.core.config import get_settings


async def test_health_check():
    """Test if watsonx Orchestrate API is accessible"""
    print("\n" + "="*60)
    print("TEST 1: watsonx Orchestrate Health Check")
    print("="*60)
    
    client = get_orchestrate_client()
    is_healthy = await client.health_check()
    
    if is_healthy:
        print("✅ SUCCESS: watsonx Orchestrate API is accessible")
        return True
    else:
        print("❌ FAILED: Cannot connect to watsonx Orchestrate API")
        return False


async def test_cancellation_agent():
    """Test cancellation agent with live API"""
    print("\n" + "="*60)
    print("TEST 2: Cancellation Agent (Live Mode)")
    print("="*60)
    
    orchestrator = SubLeechAgentOrchestrator(use_live_mode=True)
    
    try:
        response = await orchestrator.generate_cancellation_letter(
            provider_name="Netflix",
            monthly_cost=1100.0,
            user_name="John Doe",
            account_type="personal",
            cancellation_reason="Price increased by 15% without adequate notice"
        )
        
        print(f"\n✅ SUCCESS: Generated cancellation letter")
        print(f"Model Used: {response.model_used}")
        print(f"Confidence: {response.confidence_score}")
        print(f"\n--- Generated Letter ---")
        print(response.generated_text[:500] + "..." if len(response.generated_text) > 500 else response.generated_text)
        print("--- End of Letter ---\n")
        
        return True
        
    except Exception as e:
        print(f"❌ FAILED: {str(e)}")
        return False


async def test_negotiation_agent():
    """Test negotiation agent with live API"""
    print("\n" + "="*60)
    print("TEST 3: Negotiation Agent (Live Mode)")
    print("="*60)
    
    orchestrator = SubLeechAgentOrchestrator(use_live_mode=True)
    
    try:
        response = await orchestrator.generate_negotiation_script(
            provider_name="Spotify Premium",
            monthly_cost=399.0,
            original_cost=299.0,
            subscription_duration_months=18,
            hardship_type="price_increase"
        )
        
        print(f"\n✅ SUCCESS: Generated negotiation script")
        print(f"Model Used: {response.model_used}")
        print(f"Confidence: {response.confidence_score}")
        print(f"\n--- Generated Script ---")
        print(response.generated_text[:500] + "..." if len(response.generated_text) > 500 else response.generated_text)
        print("--- End of Script ---\n")
        
        return True
        
    except Exception as e:
        print(f"❌ FAILED: {str(e)}")
        return False


async def test_mock_mode():
    """Test that mock mode still works"""
    print("\n" + "="*60)
    print("TEST 4: Mock Mode (Fallback)")
    print("="*60)
    
    orchestrator = SubLeechAgentOrchestrator(use_live_mode=False)
    
    try:
        response = await orchestrator.generate_cancellation_letter(
            provider_name="Adobe Creative Cloud",
            monthly_cost=2500.0,
            user_name="Jane Smith",
            account_type="business"
        )
        
        print(f"\n✅ SUCCESS: Mock mode working")
        print(f"Model Used: {response.model_used}")
        print(f"Mode: {response.metadata.get('mode', 'unknown')}")
        
        return True
        
    except Exception as e:
        print(f"❌ FAILED: {str(e)}")
        return False


async def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("SubLeech watsonx Orchestrate Integration Test Suite")
    print("="*60)
    
    settings = get_settings()
    print(f"\nConfiguration:")
    print(f"  Agent Mode: {settings.agent_mode}")
    print(f"  Orchestrate URL: {settings.orchestrate_url}")
    print(f"  API Key Set: {'Yes' if settings.orchestrate_apikey else 'No'}")
    print(f"  Live Mode Enabled: {settings.is_live_mode}")
    
    results = []
    
    # Run tests
    results.append(("Health Check", await test_health_check()))
    results.append(("Cancellation Agent", await test_cancellation_agent()))
    results.append(("Negotiation Agent", await test_negotiation_agent()))
    results.append(("Mock Mode", await test_mock_mode()))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    for test_name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{test_name:.<40} {status}")
    
    total_passed = sum(1 for _, passed in results if passed)
    total_tests = len(results)
    
    print(f"\nTotal: {total_passed}/{total_tests} tests passed")
    
    if total_passed == total_tests:
        print("\n🎉 All tests passed! watsonx Orchestrate integration is working.")
        return 0
    else:
        print("\n⚠️  Some tests failed. Check the output above for details.")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)

# Made with Bob
