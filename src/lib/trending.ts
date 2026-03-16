
'use server';

import googleTrends from "google-trends-api"

export async function getTrending(){
    try {
        const data = await googleTrends.dailyTrends({
            geo:"IN"
        });

        if (typeof data !== 'string' || !data.trim()) {
            console.error("Received empty or invalid response from google-trends-api");
            return {};
        }

        // Google's response can be prefixed with garbage characters like )]}'
        // We need to find the first opening brace to get the actual JSON string.
        const firstBraceIndex = data.indexOf('{');
        if (firstBraceIndex === -1) {
            console.error("No JSON object found in the response from google-trends-api");
            return {};
        }

        const jsonString = data.substring(firstBraceIndex);
        
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Failed to fetch or parse Google Trends data:", error);
        return {};
    }
}
