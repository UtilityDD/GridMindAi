import { retrieve, buildContext } from "../frontend/src/lib/rag";
import { generateAnswer } from "../frontend/src/lib/llm";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function testPromotionQuery() {
  const query = "What is the eligibility for promotion from AE to EE?";
  console.log(`\n[Test Query]: ${query}`);
  console.log("--------------------------------------------------");

  try {
    // 1. Test Retrieval & Reranking
    console.log("Step 1: Executing RAG v2 Retrieval (Multi-Query + Rerank)...");
    const result = await retrieve(query, true, "pro"); // Use 'pro' to simulate higher depth/Gemini use
    
    console.log(`\n[Results Found]: ${result.chunkResults.length} chunks from ${result.docIds.length} documents.`);
    console.log("\n[Top 3 Reranked Chunks]:");
    result.chunkResults.slice(0, 3).forEach((c, i) => {
      console.log(`${i+1}. [${c.ref}] ${c.title}`);
      console.log(`   Excerpt: ${c.content.substring(0, 150)}...\n`);
    });

    // 2. Test Generation
    console.log("Step 2: Generating Answer...");
    const { context, sources } = buildContext(result);
    const { answer, modelUsed } = await generateAnswer(query, context, sources, 3, null, "pro");

    console.log("\n[Final AI Response]:");
    console.log("--------------------------------------------------");
    console.log(answer);
    console.log("--------------------------------------------------");
    console.log(`[Model Used]: ${modelUsed}`);

  } catch (e) {
    console.error("Test failed:", e);
  }
}

testPromotionQuery();
