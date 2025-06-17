// js/app.js - Main application script

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("App DOMContentLoaded");

    const mainTabs = document.getElementById('mainTabs');
    const defaultTabId = 'cotizaciones'; // Default tab to show

    // --- Tab Management ---

    /**
     * Activates a tab and its content pane.
     * @param {string} tabId - The ID of the tab content pane (e.g., 'cotizaciones', 'clientes').
     */
    function showTab(tabId) {
        const tabButton = document.querySelector(`#mainTabs .nav-link[data-bs-target="#${tabId}"]`);
        if (tabButton) {
            const tabInstance = new bootstrap.Tab(tabButton);
            tabInstance.show();
            // The 'shown.bs.tab' event will handle localStorage and module initialization
        } else {
            console.error(`Tab button for target #${tabId} not found.`);
        }
    }

    // Event listener for when a tab has been shown
    if (mainTabs) {
        mainTabs.addEventListener('shown.bs.tab', event => {
            // event.target is the nav link that was clicked
            // event.relatedTarget is the previous active tab nav link
            const activeTabId = event.target.dataset.bsTarget.substring(1); // e.g., '#cotizaciones' -> 'cotizaciones'
            console.log(`Tab shown: ${activeTabId}`);
            localStorage.setItem('activeTab', activeTabId);

            // Initialize module associated with the tab
            initializeModuleForTab(activeTabId);
        });
    }

    /**
     * Initializes the JavaScript module corresponding to the active tab.
     * Modules should expose an init() function and an isInitialized flag.
     * @param {string} tabId - The ID of the currently active tab.
     */
    function initializeModuleForTab(tabId) {
        console.log(`Attempting to initialize module for tab: ${tabId}`);
        let moduleToInit = null;

        switch (tabId) {
            case 'cotizaciones':
                moduleToInit = window.cotizacionesModule;
                break;
            case 'clientes':
                moduleToInit = window.clientesModule;
                break;
            case 'materiales':
                moduleToInit = window.materialesModule;
                break;
            case 'calculadoras':
                moduleToInit = window.calculadorasModule;
                break;
            case 'historial':
                moduleToInit = window.historialModule;
                break;
            case 'configuracion':
                moduleToInit = window.configuracionModule;
                break;
            default:
                console.log(`No specific module initialization configured for tab: ${tabId}`);
                return;
        }

        if (moduleToInit && typeof moduleToInit.init === 'function') {
            if (!moduleToInit.isInitialized) {
                console.log(`Initializing ${tabId} module.`);
                moduleToInit.init();
                moduleToInit.isInitialized = true; // Set flag to prevent re-initialization
            } else {
                console.log(`${tabId} module already initialized.`);
                // Optionally, call an 'onShow' or 'refresh' function if modules need to react to being shown again
                if (typeof moduleToInit.onTabShow === 'function') {
                    moduleToInit.onTabShow();
                }
            }
        } else {
            console.warn(`${tabId} module or its init function not found or not a function.`);
        }
    }

    // --- Initial Tab State ---
    const savedTab = localStorage.getItem('activeTab');
    if (savedTab) {
        console.log(`Found saved tab: ${savedTab}`);
        // Directly call initializeModuleForTab here because showTab might not fire shown.bs.tab
        // if the tab is already active in the DOM from server-side or previous state.
        // However, Bootstrap's `show()` method *should* trigger `shown.bs.tab`.
        // Let's rely on shown.bs.tab for consistency.
        showTab(savedTab);
    } else {
        console.log(`No saved tab, showing default: ${defaultTabId}`);
        showTab(defaultTabId);
    }

    // --- Firebase Auth State Listener (Enhanced) ---
    function setupFirebaseAuthListener() {
        if (typeof firebase !== 'undefined' && typeof firebase.auth === 'function') {
            firebase.auth().onAuthStateChanged(async user => {
                const loginNavButtonContainer = document.getElementById('loginNavButtonContainer');
                const userNavDropdownContainer = document.getElementById('userNavDropdownContainer');
                const userEmailNavbar = document.getElementById('userEmailNavbar');

                if (user) {
                    console.log('User is signed in:', user.uid, user.email);
                    if (userEmailNavbar && user.email) userEmailNavbar.textContent = user.email;
                    else if (userEmailNavbar) userEmailNavbar.textContent = "Usuario Logueado";

                    if (loginNavButtonContainer) loginNavButtonContainer.style.display = 'none';
                    if (userNavDropdownContainer) userNavDropdownContainer.style.display = 'block';

                    if (window.authModule && typeof window.authModule.getUserRole === 'function') {
                        window.currentUserRole = await window.authModule.getUserRole(user.uid);
                        console.log("User role:", window.currentUserRole);
                    } else {
                        console.error("authModule or getUserRole function not available.");
                        window.currentUserRole = null;
                    }
                    applyRoleBasedUI(window.currentUserRole); // Apply UI changes based on role

                    if (window.authModule && typeof window.authModule.dismissLoginModal === 'function') {
                        window.authModule.dismissLoginModal();
                    }

                } else {
                    console.log('User is signed out.');
                    if (userEmailNavbar) userEmailNavbar.textContent = 'Usuario';
                    if (loginNavButtonContainer) loginNavButtonContainer.style.display = 'block';
                    if (userNavDropdownContainer) userNavDropdownContainer.style.display = 'none';
                    window.currentUserRole = null;
                    console.log("User role set to null on logout.");
                    applyRoleBasedUI(null); // Apply UI changes for logged-out state
                }
            });
            console.log("Enhanced Firebase Auth listener set up with role application.");
        } else {
            console.warn("Firebase Auth not available for listener setup. Retrying in 2s...");
            setTimeout(setupFirebaseAuthListener, 2000);
        }
    }

    // Initial call to setup listener
    setTimeout(setupFirebaseAuthListener, 500);


    // Initialize Auth Module
    if (window.authModule && typeof window.authModule.initAuth === 'function') {
        window.authModule.initAuth();
    } else {
        console.error("Auth module or its initAuth function not found!");
    }

    // Initialize Communication Module
    if (window.communicationModule && typeof window.communicationModule.init === 'function') {
        window.communicationModule.init();
    } else {
        console.error("Communication module or its init function not found!");
    }

    // --- Role-Based UI Control ---
    function applyRoleBasedUI(role) {
        console.log("Applying UI based on role:", role);
        const configuracionTabLink = document.getElementById('configuracion-tab');
        
        if (role === 'admin') {
            if (configuracionTabLink) configuracionTabLink.style.display = 'list-item'; // Or 'block' if it's not a list item
             // Other admin-specific UI elements can be shown here
        } else {
            // Non-admin or no role
            if (configuracionTabLink) configuracionTabLink.style.display = 'none';

            // If user is currently on a tab that is now hidden, redirect them
            const activeTabEl = document.querySelector('#mainTabs .nav-link.active');
            if (activeTabEl && activeTabEl.id === 'configuracion-tab') {
                console.log("Configuracion tab was active but is now hidden due to role. Redirecting to cotizaciones.");
                showTab('cotizaciones'); // showTab is defined earlier in app.js
            }
            // Other admin-specific UI elements can be hidden here
        }

        // Notify modules about role change so they can update their internal UI
        if (window.configuracionModule && typeof window.configuracionModule.updateUIAccess === 'function') {
            window.configuracionModule.updateUIAccess(role);
        }
        // Add calls for other modules if they implement updateUIAccess
        // if (window.clientesModule && typeof window.clientesModule.updateUIAccess === 'function') {
        //     window.clientesModule.updateUIAccess(role);
        // }
    }
    window.applyRoleBasedUI = applyRoleBasedUI; // Make it accessible if needed, or keep private

    // Temporary Test Button for Email Modal Logic
    const tempTestEmailBtn = document.getElementById('tempTestEmailModal');
    if (tempTestEmailBtn) {
        tempTestEmailBtn.addEventListener('click', () => {
            if (window.communicationModule && typeof window.communicationModule.openEmailQuoteModal === 'function') {
                console.log("Manually triggering email modal for testing.");
                // Dummy data for testing:
                const dummyQuoteId = "DUMMY_QUOTE_ID_001";
                const dummyClientEmail = "testcliente@example.com";
                const dummyQuoteNumber = "Q-DUMMY-001";
                const dummyClientName = "Cliente de Prueba";
                window.communicationModule.openEmailQuoteModal(dummyQuoteId, dummyClientEmail, dummyQuoteNumber, dummyClientName);
            } else {
                alert("Communication module or openEmailQuoteModal function not found.");
            }
        });
    }

    console.log("app.js setup complete.");
});

// Global reference for current user's role
window.currentUserRole = null;

// --- Global Helper Functions (Example, if needed) ---
// window.AppUtils = {
//     formatDate: function(dateString) {
//         const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
//         return new Date(dateString).toLocaleDateString('es-ES', options);
//     },
//     // ... other utils
// };

console.log("app.js script loaded and parsed.");

// Enhance onAuthStateChanged in app.js
// This is a conceptual placement. The actual onAuthStateChanged is already within the DOMContentLoaded.
// I need to modify the existing setupFirebaseAuthListener function.

// The following is the MODIFIED setupFirebaseAuthListener function
// (The diff tool can't easily replace a function body if the signature isn't part of the search)
// So, I will provide the full new function content for `setupFirebaseAuthListener`
// and ask to replace the existing `setupFirebaseAuthListener` block.

// **NEW CONTENT FOR setupFirebaseAuthListener IN app.js**
// function setupFirebaseAuthListener() {
//     if (typeof firebase !== 'undefined' && typeof firebase.auth === 'function') {
//         firebase.auth().onAuthStateChanged(async user => {
//             const loginNavButtonContainer = document.getElementById('loginNavButtonContainer');
//             const userNavDropdownContainer = document.getElementById('userNavDropdownContainer');
//             const userEmailNavbar = document.getElementById('userEmailNavbar');

//             if (user) {
//                 console.log('User is signed in:', user.uid, user.email);
//                 if (userEmailNavbar && user.email) userEmailNavbar.textContent = user.email;
//                 else if (userEmailNavbar) userEmailNavbar.textContent = "Usuario Logueado";

//                 if (loginNavButtonContainer) loginNavButtonContainer.style.display = 'none';
//                 if (userNavDropdownContainer) userNavDropdownContainer.style.display = 'block';

//                 if (window.authModule && typeof window.authModule.getUserRole === 'function') {
//                     window.currentUserRole = await window.authModule.getUserRole(user.uid);
//                     console.log("User role:", window.currentUserRole);
//                 } else {
//                     console.error("authModule or getUserRole function not available.");
//                     window.currentUserRole = null;
//                 }
//                 applyRoleBasedUI(window.currentUserRole); // Apply UI changes based on role

//                 if (window.authModule && typeof window.authModule.dismissLoginModal === 'function') {
//                     window.authModule.dismissLoginModal();
//                 }

//             } else {
//                 console.log('User is signed out.');
//                 if (userEmailNavbar) userEmailNavbar.textContent = 'Usuario';
//                 if (loginNavButtonContainer) loginNavButtonContainer.style.display = 'block';
//                 if (userNavDropdownContainer) userNavDropdownContainer.style.display = 'none';
//                 window.currentUserRole = null;
//                 console.log("User role set to null on logout.");
//                 applyRoleBasedUI(null); // Apply UI changes for logged-out state
//             }
//         });
//         console.log("Enhanced Firebase Auth listener set up.");
//     } else {
//         console.warn("Firebase Auth not available for listener setup. Retrying in 2s...");
//         setTimeout(setupFirebaseAuthListener, 2000);
//     }
// }
