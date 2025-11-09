"""
Streaming response example for Trainly Python SDK
"""

from trainly import TrainlyClient
import sys

def main():
    # Initialize the client
    trainly = TrainlyClient(
        api_key="tk_your_api_key_here",
        chat_id="chat_abc123"
    )

    print("🌊 Trainly Python SDK - Streaming Example\n")
    print("=" * 60)
    print("Streaming Response:")
    print("=" * 60)
    print()

    question = "Explain the methodology in detail"
    print(f"Question: {question}\n")
    print("Answer (streaming):")
    print("-" * 60)

    context_chunks = []

    try:
        for chunk in trainly.query_stream(
            question=question,
            model="gpt-4o-mini",
            temperature=0.7
        ):
            if chunk.is_content:
                # Print content as it arrives
                print(chunk.data, end="", flush=True)

            elif chunk.is_context:
                # Store context chunks
                context_chunks = chunk.data

            elif chunk.is_error:
                print(f"\n\n❌ Error: {chunk.data}")
                sys.exit(1)

            elif chunk.is_end:
                print("\n" + "-" * 60)
                print("\n✅ Stream complete!")
                break

        # Show context information
        if context_chunks:
            print(f"\n📚 Context chunks: {len(context_chunks)}")
            print("\nTop 3 citations:")
            for i, chunk in enumerate(context_chunks[:3], 1):
                print(f"\n  [{i}] Score: {chunk.score:.3f}")
                print(f"      Source: {chunk.source}")
                print(f"      Text: {chunk.chunk_text[:150]}...")

    except KeyboardInterrupt:
        print("\n\n⚠️ Stream interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
    finally:
        trainly.close()

if __name__ == "__main__":
    main()

