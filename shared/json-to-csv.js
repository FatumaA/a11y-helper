const fs = require("fs");

// Load WCAG JSON
const wcagData = JSON.parse(fs.readFileSync("./wcag.json", "utf8"));

// Flatten to CSV rows
const csvRows = [];
const headers = ["ref_id", "title", "description", "level", "url", "metadata"];

// Add header row
csvRows.push(headers.join(","));

// Process each principle -> guideline -> success criteria
wcagData.forEach((principle) => {
	principle.guidelines.forEach((guideline) => {
		guideline.success_criteria.forEach((sc) => {
			// Escape commas and quotes in text
			const cleanText = (text) => `"${text?.replace(/"/g, '""') || ""}"`;

			const row = [
				sc.ref_id,
				cleanText(sc.title),
				cleanText(sc.description),
				sc.level,
				cleanText(sc.url),
				cleanText(JSON.stringify(sc)), // Full object as metadata
			];

			csvRows.push(row.join(","));
		});
	});
});

// Write CSV file
fs.writeFileSync("wcag-for-supabase.csv", csvRows.join("\n"));
console.log(`Created CSV with ${csvRows.length - 1} success criteria`);
console.log("File: wcag-for-supabase.csv");
