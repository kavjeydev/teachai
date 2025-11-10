"""
Basic usage example for Trainly Python SDK
"""

from trainly import TrainlyClient

def main():
    # Initialize the client (make sure to set environment variables or pass directly)
    trainly = TrainlyClient(
        api_key="tk_mhse51pz_7wcvjs9mh2l",
        chat_id="j57cq1sb5fd3pp8psnvx991e1x7shtvk"
    )

    print("🚀 Trainly Python SDK - Basic Usage Example\n")

    # Example 1: Simple query
    print("=" * 60)
    print("Example 1: Simple Query")
    print("=" * 60)

    response = trainly.query("tell me about the exclusion form")
    print(f"\n📝 Answer:\n{response.answer}\n")
    print(f"📚 Context chunks: {len(response.context)}")

    # Example 2: Query with citations
    print("\n" + "=" * 60)
    print("Example 2: Query with Citations")
    print("=" * 60)

    response = trainly.query(
        question="What is the conclusion?",
        model="gpt-4o-mini",
        temperature=0.5,
        max_tokens=2000,
        include_context=True
    )

    print(f"\n📝 Answer:\n{response.answer}\n")
    print(f"📚 Citations ({len(response.context)}):")
    for i, chunk in enumerate(response.context[:3], 1):  # Show first 3
        print(f"\n  [{i}] Score: {chunk.score:.3f}")
        print(f"      Source: {chunk.source}")
        print(f"      Text: {chunk.chunk_text[:150]}...")

    # Example 3: Token usage
    if response.usage:
        print(f"\n💰 Token Usage:")
        print(f"   Prompt tokens: {response.usage.prompt_tokens}")
        print(f"   Completion tokens: {response.usage.completion_tokens}")
        print(f"   Total tokens: {response.usage.total_tokens}")

    # Close the session
    trainly.close()

    print("\n✅ Examples completed successfully!")

if __name__ == "__main__":
    main()

