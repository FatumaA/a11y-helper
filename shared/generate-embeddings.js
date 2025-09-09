const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");
// const { pipeline } = require("@xenova/transformers");

dotenv.config({ path: "../.env" });

const supabase = createClient(
	process.env.SUPABASE_URL,
	process.env.SUPABASE_ANON_KEY
);

async function generateEmbeddings() {
	console.log("Loading embedding model...");
	const { pipeline } = await import("@xenova/transformers");
	const generateEmbedding = await pipeline(
		"feature-extraction",
		"Supabase/gte-small"
	);

	console.log("Fetching WCAG guidelines...");
	const { data: guidelines, error } = await supabase
		.from("wcag_guidelines")
		.select("*")
		.is("embedding", null); // Only process rows without embeddings

	if (error) {
		console.error("Error fetching guidelines:", error);
		return;
	}

	console.log(`Processing ${guidelines.length} guidelines...`);

	for (const guideline of guidelines) {
		const text = `${guideline.title} ${guideline.description}`;

		// Generate embedding
		const output = await generateEmbedding(text, {
			pooling: "mean",
			normalize: true,
		});

		// Extract the embedding
		const embedding = Array.from(output.data);

		// Update the row
		const { error: updateError } = await supabase
			.from("wcag_guidelines")
			.update({ embedding })
			.eq("id", guideline.id);

		if (updateError) {
			console.error(`Error updating ${guideline.ref_id}:`, updateError);
		} else {
			console.log(`✅ Updated ${guideline.ref_id}: ${guideline.title}`);
		}
	}

	console.log("🎉 All embeddings generated!");
}

generateEmbeddings().catch(console.error);
