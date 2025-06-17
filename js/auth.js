// js/auth.js - Authentication module

window.authModule = {
    isInitialized: false,
    loginModalInstance: null,

    initAuth: function() {
        if (this.isInitialized) return;
        console.log("Auth module initializing...");

        if (typeof firebase === 'undefined' || !firebase.auth || !firebase.firestore) {
            console.error("Firebase, Auth, or Firestore is not loaded. Auth module cannot start.");
            return;
        }
        const auth = firebase.auth();
        const db = firebase.firestore();
        const module = this;

        // DOM Elements
        const loginModalElement = document.getElementById('loginModal');
        if (loginModalElement) {
            module.loginModalInstance = new bootstrap.Modal(loginModalElement);
        }

        const loginForm = document.getElementById('loginForm');
        const signUpForm = document.getElementById('signUpForm');
        const loginEmailInput = document.getElementById('loginEmail');
        const loginPasswordInput = document.getElementById('loginPassword');
        const signUpEmailInput = document.getElementById('signUpEmail');
        const signUpPasswordInput = document.getElementById('signUpPassword');
        const signUpConfirmPasswordInput = document.getElementById('signUpConfirmPassword');

        const showSignUpLink = document.getElementById('showSignUpLink');
        const showLoginLink = document.getElementById('showLoginLink');
        const authErrorDiv = document.getElementById('authError');

        const btnLoginNavbar = document.getElementById('btnLoginNavbar'); // In Navbar
        const btnLogoutNavbar = document.getElementById('btnLogoutNavbar'); // In Navbar dropdown

        // --- Event Listeners ---

        if (btnLoginNavbar) {
            btnLoginNavbar.addEventListener('click', () => {
                if (module.loginModalInstance) module.loginModalInstance.show();
                if (authErrorDiv) authErrorDiv.textContent = '';
                if (loginForm) loginForm.style.display = 'block';
                if (signUpForm) signUpForm.style.display = 'none';
                const loginModalLabel = document.getElementById('loginModalLabel');
                if(loginModalLabel) loginModalLabel.textContent = 'Iniciar Sesión';
            });
        }

        if (btnLogoutNavbar) {
            btnLogoutNavbar.addEventListener('click', () => module.logoutUser());
        }

        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (authErrorDiv) authErrorDiv.textContent = '';
                try {
                    await module.loginUser(loginEmailInput.value, loginPasswordInput.value);
                    // Success is handled by onAuthStateChanged in app.js (modal dismiss, UI update)
                } catch (error) {
                    if (authErrorDiv) authErrorDiv.textContent = error.message;
                    console.error("Login error:", error);
                }
            });
        }

        if (signUpForm) {
            signUpForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (authErrorDiv) authErrorDiv.textContent = '';
                if (signUpPasswordInput.value !== signUpConfirmPasswordInput.value) {
                    if (authErrorDiv) authErrorDiv.textContent = "Las contraseñas no coinciden.";
                    return;
                }
                if (signUpPasswordInput.value.length < 6) {
                     if (authErrorDiv) authErrorDiv.textContent = "La contraseña debe tener al menos 6 caracteres.";
                    return;
                }
                try {
                    await module.signUpUser(signUpEmailInput.value, signUpPasswordInput.value);
                    // Success is handled by onAuthStateChanged in app.js
                } catch (error) {
                    if (authErrorDiv) authErrorDiv.textContent = error.message;
                    console.error("Sign up error:", error);
                }
            });
        }

        if (showSignUpLink) {
            showSignUpLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (loginForm) loginForm.style.display = 'none';
                if (signUpForm) signUpForm.style.display = 'block';
                if (authErrorDiv) authErrorDiv.textContent = '';
                 const loginModalLabel = document.getElementById('loginModalLabel');
                if(loginModalLabel) loginModalLabel.textContent = 'Crear Nueva Cuenta';
            });
        }

        if (showLoginLink) {
            showLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (signUpForm) signUpForm.style.display = 'none';
                if (loginForm) loginForm.style.display = 'block';
                if (authErrorDiv) authErrorDiv.textContent = '';
                const loginModalLabel = document.getElementById('loginModalLabel');
                if(loginModalLabel) loginModalLabel.textContent = 'Iniciar Sesión';
            });
        }

        this.isInitialized = true;
        console.log("Auth module initialized.");
    },

    signUpUser: async function(email, password) {
        const auth = firebase.auth();
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        console.log("User signed up:", userCredential.user.uid);
        // Set default role for the new user
        await this.setUserRole(userCredential.user.uid, email, 'user');
        // Modal dismissal and UI updates will be handled by onAuthStateChanged
        return userCredential;
    },

    loginUser: async function(email, password) {
        const auth = firebase.auth();
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log("User logged in:", userCredential.user.uid);
        // Modal dismissal and UI updates will be handled by onAuthStateChanged
        return userCredential;
    },

    logoutUser: async function() {
        const auth = firebase.auth();
        await auth.signOut();
        console.log("User logged out.");
        // UI updates will be handled by onAuthStateChanged
        // Reset any sensitive global state if necessary
        if(window.app) window.app.currentUserRole = null;
    },

    setUserRole: async function(uid, email, role) {
        const db = firebase.firestore();
        try {
            await db.collection('users').doc(uid).set({
                email: email,
                role: role,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true }); // Merge true in case other fields are set by other processes
            console.log(`Role '${role}' set for user ${uid}`);
        } catch (error) {
            console.error("Error setting user role:", error);
            throw error; // Re-throw to be caught by caller if needed
        }
    },

    getUserRole: async function(uid) {
        if (!uid) return null;
        const db = firebase.firestore();
        try {
            const userDoc = await db.collection('users').doc(uid).get();
            if (userDoc.exists) {
                return userDoc.data().role || null;
            } else {
                console.log("No role document found for user:", uid);
                return null; // Or a default role like 'user'
            }
        } catch (error) {
            console.error("Error getting user role:", error);
            return null;
        }
    },

    dismissLoginModal: function() {
        if (this.loginModalInstance) {
            this.loginModalInstance.hide();
        }
    }
};

// It's good practice to ensure app.js calls authModule.initAuth()
// after DOMContentLoaded and after firebase-config.js has loaded firebase.
// This can be done by placing authModule.initAuth() inside app.js's DOMContentLoaded listener.
