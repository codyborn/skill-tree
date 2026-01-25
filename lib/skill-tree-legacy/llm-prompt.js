/**
 * llm-prompt.js - LLM prompt template generator
 */

const LLMPrompt = {
    /**
     * Show LLM prompt template modal
     */
    showPromptTemplate() {
        const template = this.generateTemplate();

        const content = `
            <div style="margin-bottom: 1rem;">
                <p style="margin-bottom: 1rem; color: var(--text-secondary);">
                    Copy this prompt template and paste it into ChatGPT, Claude, or another LLM to generate a skill tree.
                    The AI will return JSON that you can import directly into the visualizer.
                </p>
                <textarea
                    id="llmPromptText"
                    readonly
                    style="width: 100%; padding: 0.75rem; font-family: monospace; font-size: 0.875rem;
                           background: var(--bg-tertiary); border: 1px solid var(--border-color);
                           border-radius: var(--radius-md); resize: vertical; min-height: 400px; line-height: 1.5;"
                >${template}</textarea>
            </div>
            <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-tertiary); border-radius: var(--radius-md);">
                <h4 style="margin: 0 0 0.5rem 0; color: var(--accent-primary); font-size: 0.875rem;">
                    How to use:
                </h4>
                <ol style="margin: 0; padding-left: 1.5rem; color: var(--text-secondary); font-size: 0.875rem; line-height: 1.6;">
                    <li>Click "Copy Template" below</li>
                    <li>Paste into ChatGPT/Claude and customize the topic</li>
                    <li>Copy the generated JSON response</li>
                    <li>Use the Import button to load it into the visualizer</li>
                </ol>
            </div>
        `;

        UIControls.showModal('Generate with AI', content, [
            {
                label: 'Copy Template',
                primary: true,
                action: () => {
                    this.copyTemplate(template);
                }
            },
            {
                label: 'Close',
                primary: false,
                action: () => UIControls.closeModal()
            }
        ]);

        // Auto-select the text
        setTimeout(() => {
            const textarea = document.getElementById('llmPromptText');
            if (textarea) {
                textarea.select();
            }
        }, 100);
    },

    /**
     * Generate the prompt template
     */
    generateTemplate() {
        const exampleNode = {
            id: "example_id",
            label: "Skill Name",
            description: "Detailed description in markdown",
            image: "",
            completed: false,
            locked: true,
            parent: "parent_id",
            prerequisites: ["prereq_id"],
            metadata: {}
        };

        const exampleTree = {
            version: "1.0",
            name: "Example Skill Tree",
            description: "A sample skill tree structure",
            nodes: [exampleNode],
            edges: [
                { from: "parent_id", to: "child_id" }
            ]
        };

        return `Create a comprehensive skill tree for [TOPIC] using the following JSON structure.

INSTRUCTIONS:
1. Create a hierarchical skill tree with a single root node
2. Each skill should have clear prerequisites (parent skills that must be learned first)
3. Leverage known courses, training material, and certifications to generate a realistic skill tree.
4. Include 15-25 nodes total, organized into 3-5 depth levels
5. Use meaningful names and descriptions
6. Organize skills from foundational (root) to advanced (leaves)
7. Return ONLY valid JSON, no explanations

TOPIC: [Replace this with your topic, e.g., "Machine Learning", "Guitar Playing", "Game Development"]

JSON SCHEMA:
${JSON.stringify(exampleTree, null, 2)}

FIELD DESCRIPTIONS:
- version: Always "1.0"
- name: Name of the skill tree
- description: Brief description of what this skill tree covers
- nodes: Array of skill nodes
  - id: Unique identifier (use snake_case)
  - label: Display name of the skill
  - description: Detailed explanation (markdown supported)
  - image: Leave empty ("")
  - completed: Always false for new trees
  - locked: true for non-root nodes, false for root
  - parent: ID of parent node (null for root node)
  - prerequisites: Array of node IDs that must be completed first (empty for root)
  - metadata: Can include custom fields like difficulty, category, etc.
- edges: Array of parent-child relationships
  - from: Parent node ID
  - to: Child node ID

REQUIREMENTS:
- Start with ONE root node (parent: null, prerequisites: [], locked: false)
- Every other node should have a parent
- Prerequisites should match the tree hierarchy
- Each node ID must be unique
- Edge relationships must match parent-child relationships
- Use descriptive labels and detailed descriptions

EXAMPLE STRUCTURE:
Root Skill
├── Beginner Skill A
│   ├── Intermediate Skill A1
│   └── Intermediate Skill A2
├── Beginner Skill B
│   └── Intermediate Skill B1
│       └── Advanced Skill B1a
└── Beginner Skill C

Please generate the JSON now:`;
    },

    /**
     * Copy template to clipboard
     */
    async copyTemplate(template) {
        try {
            await navigator.clipboard.writeText(template);
            UIControls.showToast('Template copied to clipboard!', 'success');
        } catch (error) {
            console.error('Failed to copy:', error);

            // Fallback
            const textarea = document.getElementById('llmPromptText');
            if (textarea) {
                textarea.select();
                document.execCommand('copy');
                UIControls.showToast('Template copied to clipboard!', 'success');
            } else {
                UIControls.showToast('Failed to copy template', 'error');
            }
        }
    },

    /**
     * Show simplified prompt for quick generation
     */
    showQuickPrompt() {
        const content = `
            <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
                    What skill tree would you like to create?
                </label>
                <input
                    type="text"
                    id="quickTopic"
                    placeholder="e.g., Web Development, Piano, Data Science"
                    style="width: 100%; padding: 0.75rem; font-size: 0.875rem;
                           background: var(--bg-tertiary); border: 1px solid var(--border-color);
                           border-radius: var(--radius-md);"
                >
            </div>
            <div style="margin-top: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
                    Number of skills:
                </label>
                <input
                    type="number"
                    id="skillCount"
                    value="20"
                    min="5"
                    max="50"
                    style="width: 100%; padding: 0.75rem; font-size: 0.875rem;
                           background: var(--bg-tertiary); border: 1px solid var(--border-color);
                           border-radius: var(--radius-md);"
                >
            </div>
        `;

        UIControls.showModal('Quick AI Generation', content, [
            {
                label: 'Generate Prompt',
                primary: true,
                action: () => {
                    const topic = document.getElementById('quickTopic')?.value;
                    const count = document.getElementById('skillCount')?.value;

                    if (!topic) {
                        UIControls.showToast('Please enter a topic', 'error');
                        return;
                    }

                    const customTemplate = this.generateTemplate()
                        .replace('[TOPIC]', topic)
                        .replace('[Replace this with your topic, e.g., "Machine Learning", "Guitar Playing", "Game Development"]', topic)
                        .replace('15-25 nodes', `approximately ${count} nodes`);

                    UIControls.closeModal();

                    setTimeout(() => {
                        const content = `
                            <textarea
                                id="customPromptText"
                                readonly
                                style="width: 100%; padding: 0.75rem; font-family: monospace; font-size: 0.875rem;
                                       background: var(--bg-tertiary); border: 1px solid var(--border-color);
                                       border-radius: var(--radius-md); resize: vertical; min-height: 400px; line-height: 1.5;"
                            >${customTemplate}</textarea>
                        `;

                        UIControls.showModal(`AI Prompt for "${topic}"`, content, [
                            {
                                label: 'Copy to Clipboard',
                                primary: true,
                                action: async () => {
                                    try {
                                        await navigator.clipboard.writeText(customTemplate);
                                        UIControls.showToast('Prompt copied! Paste it into ChatGPT or Claude', 'success');
                                    } catch (e) {
                                        UIControls.showToast('Failed to copy', 'error');
                                    }
                                }
                            },
                            {
                                label: 'Close',
                                primary: false,
                                action: () => UIControls.closeModal()
                            }
                        ]);
                    }, 100);
                }
            },
            {
                label: 'Cancel',
                primary: false,
                action: () => UIControls.closeModal()
            }
        ]);

        // Focus the topic input
        setTimeout(() => {
            document.getElementById('quickTopic')?.focus();
        }, 100);
    }
};

// Expose to global scope
window.LLMPrompt = LLMPrompt;
