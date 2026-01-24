/**
 * main.js - Application initialization and setup
 */

// Global skill tree instance (exposed to window)
window.skillTree = null;

/**
 * Initialize the application
 */
function initApp() {
    console.log('🎮 Initializing Skill Tree Visualizer...');

    // Register cytoscape extensions
    if (typeof cytoscapeDagre !== 'undefined' && typeof cytoscape !== 'undefined') {
        cytoscape.use(cytoscapeDagre);
        console.log('✓ Dagre layout registered');
    } else {
        console.error('cytoscapeDagre or cytoscape not found!');
    }

    // Note: Using built-in 'cose' layout which doesn't require registration
    console.log('✓ Using built-in Cose layout for multi-directional trees');

    // Create skill tree instance
    window.skillTree = new SkillTree('cy');

    // Initialize UI controls
    UIControls.init(window.skillTree);

    // Try to load from localStorage
    const loaded = window.skillTree.loadFromStorage();
    if (!loaded) {
        console.log('No saved tree found, using sample tree');
    } else {
        console.log('Loaded tree from storage');
    }

    // Check for URL parameter (Phase 4 feature)
    if (window.PermalinkManager && window.location.search.includes('tree=')) {
        PermalinkManager.loadFromURL(window.skillTree);
    }

    console.log('✅ Skill Tree Visualizer ready!');
}

/**
 * Wait for DOM and libraries to load
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

/**
 * Handle window resize
 */
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (window.skillTree && window.skillTree.cy) {
            window.skillTree.cy.resize();
            window.skillTree.fit();
        }
    }, 250);
});

/**
 * Prevent context menu on right-click (we use our custom menu)
 */
document.addEventListener('contextmenu', (e) => {
    // Allow default context menu outside the Cytoscape container
    const cyContainer = document.getElementById('cy');
    if (cyContainer && cyContainer.contains(e.target)) {
        e.preventDefault();
    }
});

/**
 * Auto-save before unload
 */
window.addEventListener('beforeunload', (e) => {
    if (window.skillTree) {
        window.skillTree.autoSave();
    }
});
