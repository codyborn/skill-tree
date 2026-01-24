import OpenAI from 'openai';
import type { AIGenerationRequest, AIGenerationResponse } from '@/types/skill-tree';

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });
}

export async function generateSkillTree(params: AIGenerationRequest): Promise<AIGenerationResponse> {
  const openai = getOpenAIClient();
  const { topic, nodeCount = 10, style = 'technical' } = params;

  const stylePrompts = {
    technical: 'Focus on practical, technical skills with clear progression from fundamentals to advanced concepts.',
    creative: 'Emphasize creative and artistic aspects with exploration and experimentation paths.',
    academic: 'Structure learning in an academic progression with theoretical foundations building to applications.',
    gaming: 'Design like a video game skill tree with exciting abilities and power-ups.',
  };

  const prompt = `Generate a skill tree for "${topic}" with approximately ${nodeCount} nodes.
Style: ${stylePrompts[style]}

Return ONLY valid JSON (no markdown, no explanations) in this exact format:
{
  "nodes": [
    {
      "id": "unique_id",
      "label": "Skill Name",
      "description": "Brief description",
      "parent": "parent_id or null for root",
      "prerequisites": ["parent_id"],
      "weight": 1-10,
      "iconData": { "type": "emoji", "icon": "🎮", "color": "#6366f1" },
      "completed": false,
      "locked": true,
      "subtreeCompletion": 0,
      "subtreeProgress": { "completed": 0, "total": 0 },
      "metadata": {}
    }
  ],
  "edges": [
    { "group": "edges", "data": { "id": "edge_id", "source": "parent", "target": "child" } }
  ]
}

Requirements:
- Create a hierarchical tree structure (one root, branching paths)
- Include exactly 1 root node (parent: null, locked: false)
- All other nodes should have parent set correctly and locked: true initially
- Make prerequisites match parent relationships
- Use relevant and visually distinct emojis for icons (avoid repeating the same emoji)
- Use a variety of colors from this palette: #6366f1, #8b5cf6, #ec4899, #10b981, #f59e0b, #ef4444, #06b6d4
- Assign weights 1-10 based on complexity (1=basic foundational, 5=intermediate, 10=advanced/mastery)
- Create around ${nodeCount} total nodes in a balanced tree
- Ensure descriptions are clear and actionable`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a skill tree generator. Return only valid JSON with no markdown formatting.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content returned from OpenAI');
    }

    const parsed = JSON.parse(content);
    return parsed as AIGenerationResponse;
  } catch (error) {
    console.error('OpenAI generation error:', error);
    throw new Error('Failed to generate skill tree');
  }
}
