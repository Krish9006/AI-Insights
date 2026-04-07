require('dotenv').config({ path: '.env' });

async function test() {
    const key = process.env.GROQ_API_KEY;
    console.log("Using Key:", key ? key.substring(0, 10) + "..." : "MISSING");
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: 'Say hello' }]
            })
        });
        const data = await response.json();
        console.log("Status:", response.status);
        if (data.choices && data.choices[0]) {
            console.log("Reply:", data.choices[0].message.content);
        } else {
            console.log("Error Structure:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Fetch/Parse Error:", e.name, e.message);
    }
}

test();
