// auth.js
let kinde;

async function initAuth() {
    const waitForKinde = () => {
        return new Promise((resolve) => {
            if (window.KindeAuth) return resolve(window.KindeAuth);
            const interval = setInterval(() => {
                if (window.KindeAuth) {
                    clearInterval(interval);
                    resolve(window.KindeAuth);
                }
            }, 50);
        });
    };

    try {
        const kindeLib = await waitForKinde();

        kinde = await kindeLib.createKindeClient({
            client_id: "8ef309ff506b4999b2356de7a95f97f8",
            domain: "https://monarchmetal.kinde.com",
            redirect_uri: "https://monarchzclip.netlify.app/",
            logout_uri: "https://monarchintranet.netlify.app/",
            is_dangerously_use_local_storage: true
        });

        // Handle returning from Google
        if (window.location.search.includes("code=")) {
            await kinde.handleRedirectCallback();
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        const isAuthenticated = await kinde.isAuthenticated();
        const authScreen = document.getElementById("auth-screen");
        const appScreen = document.getElementById("app");
        const loginBtn = document.getElementById("loginBtn");

        if (!isAuthenticated) {
            authScreen.classList.remove("hidden");
            appScreen.classList.add("hidden");

            // Use addEventListener instead of onclick for better reliability
            loginBtn.addEventListener("click", async () => {
                loginBtn.innerText = "Connecting..."; // Visual feedback
                loginBtn.style.opacity = "0.7";
                try {
                    await kinde.login();
                } catch (err) {
                    console.error("Login failed:", err);
                    loginBtn.innerText = "Sign in with Google";
                    loginBtn.style.opacity = "1";
                }
            });
        } else {
            authScreen.classList.add("hidden");
            appScreen.classList.remove("hidden");
        }

    } catch (error) {
        console.error("Kinde Auth Error:", error);
    }
}

// Fire immediately
initAuth();