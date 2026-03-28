import axios from 'axios';

const API_BASE = 'https://fix-link-5332f899c079.herokuapp.com/api';

async function runTest() {
    try {
        console.log("Logging in as Customer (nuniyat.g@gmail.com)...");
        const custLogin = await axios.post(`${API_BASE}/users/login/`, { 
            username: 'nuniyat.g@gmail.com',
            email: 'nuniyat.g@gmail.com', 
            password: '12345678' 
        });
        const custToken = custLogin.data.access;
        const userId = custLogin.data.user.id;
        console.log("  Success! User ID:", userId);

        console.log("\nFetching User Details...");
        const detailsRes = await axios.get(`${API_BASE}/users/${userId}/`, { 
            headers: { Authorization: `Bearer ${custToken}` }
        });
        
        console.log("\n=== FULL USER DETAIL PAYLOAD ===");
        console.log(JSON.stringify(detailsRes.data, null, 2));
        console.log("================================\n");

        if (detailsRes.data) {
            console.log("\nAttempting to UPDATE user profile...");
            try {
                const patchRes = await axios.patch(`${API_BASE}/users/${userId}/`, {
                    phonenumber: "+251911223344",
                    city: "Addis Ababa",
                    subcity: "Bole"
                }, { 
                    headers: { Authorization: `Bearer ${custToken}` }
                });
                console.log("  Update SUCCESS:", patchRes.status);
                
                if (!patchRes.data.city) {
                    console.log("  WARNING: 'city/subcity' are MISSING from the PATCH response!");
                } else {
                    console.log("  City/Subcity FOUND in PATCH response.");
                }
            } catch (err) {
                console.log("  Update FAILED:", err.response?.status || err.message);
                console.log(JSON.stringify(err.response?.data, null, 2));
            }

            console.log("\nRe-fetching User Details to verify persistence...");
            const verifyRes = await axios.get(`${API_BASE}/users/${userId}/`, { 
                headers: { Authorization: `Bearer ${custToken}` }
            });
            console.log("  Phonenumber in response:", verifyRes.data.phonenumber);
            console.log("  City in response:", verifyRes.data.city || "MISSING");
        }

    } catch (error) {
        console.error("Test Failed!");
        if (error.response) {
            console.error(error.response.status, error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

runTest();
