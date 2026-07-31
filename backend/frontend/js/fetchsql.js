// const BASE_URL = "http://localhost:5001";

// Fetch latest gate pass records
// async function get() {
//     try {
//         const response = await fetch(`${BASE_URL}/api/gatepass`, {
//             credentials: "include"
//         });

//         if (!response.ok) {
//             throw new Error("Failed to fetch records.");
//         }

//         const data = await response.json();

//         console.log(data);

//         return data;

//     } catch (err) {

//         console.error("Error fetching records:", err);

//     }
// }

// Save gate pass record
async function post(sqlData) {
    try {

        const response = await fetch(`${BASE_URL}/api/post-entry`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(sqlData)
        });

        if (!response.ok) {
            throw new Error("Failed to save record.");
        }

        const data = await response.json();

        console.log(data);

        return data;

    } catch (err) {

        console.error("Error saving record:", err);

    }
}