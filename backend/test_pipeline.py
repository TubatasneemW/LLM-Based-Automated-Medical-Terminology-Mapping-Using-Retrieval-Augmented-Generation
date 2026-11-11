import asyncio
from app.api.mapping import execute_mapping_pipeline
from app.api.analytics import run_evaluation_benchmark
from app.services.vector_search import vector_search_service

vector_search_service.build_or_load_index()

async def run_tests():
    print("--- Running Test 1: High blood pressure ---")
    res1 = await execute_mapping_pipeline("High blood pressure", "SNOMED CT")
    print(f"Selected Concept: {res1.selected_concept.concept_name} (ID: {res1.selected_concept.concept_id})")
    print(f"Confidence: {res1.confidence_score} ({res1.confidence_label}) | Similarity: {res1.similarity_score}")
    print(f"Reasoning Engine: {res1.reasoning_engine}")
    print(f"Why Selected: {res1.why_selected}")
    print(f"Alternatives ({len(res1.alternatives)}):")
    for alt in res1.alternatives[:3]:
        print(f"  - #{alt.rank} {alt.concept_name} [{alt.terminology}: {alt.concept_id}] (Score: {alt.hybrid_score})")

    print("\n--- Running Test 2: Multi-symptom description ---")
    res2 = await execute_mapping_pipeline("Patient presents with elevated blood glucose levels and frequent urination", "SNOMED CT")
    print(f"Selected Concept: {res2.selected_concept.concept_name} (ID: {res2.selected_concept.concept_id})")
    print(f"Confidence: {res2.confidence_score} ({res2.confidence_label}) | Similarity: {res2.similarity_score}")

    print("\n--- Running Evaluation Benchmark ---")
    eval_res = run_evaluation_benchmark()
    print(f"Dataset Size: {eval_res['dataset_size']} clinical test cases")
    print(f"Top-1 Accuracy: {eval_res['top_1_accuracy']}%")
    print(f"Top-5 Accuracy: {eval_res['top_5_accuracy']}%")
    print(f"MRR: {eval_res['mrr']}")
    print("Method Comparison:")
    for comp in eval_res['comparison']:
        print(f"  - {comp['pipeline']}: Top-1={comp['top1_accuracy']}%, Top-5={comp['top5_accuracy']}%, MRR={comp['mrr']}, Latency={comp['latency_ms']}ms")

if __name__ == "__main__":
    asyncio.run(run_tests())

