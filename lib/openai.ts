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
      "metadata": {},
      "isHeader": false
    }
  ],
  "edges": [
    { "group": "edges", "data": { "id": "edge_id", "source": "parent", "target": "child" } }
  ]
}

Requirements:
- Create a TRUE HIERARCHICAL tree structure with branching paths (not flat)
- Include exactly 1 root node (parent: null, locked: false, isHeader: true)
- The root node MUST have isHeader: true (it's a logical grouping/category)
- All other nodes MUST have isHeader: false (they are regular completable skills)
- Other nodes should have varying depths - create 2-3 levels of hierarchy
- Each node should have 1-3 children on average
- The parent field MUST correctly reference another node's id (or null for root)
- Make prerequisites array match the parent field value
- Use relevant and visually distinct emojis for icons (avoid repeating)
- Use variety of colors: #6366f1, #8b5cf6, #ec4899, #10b981, #f59e0b, #ef4444, #06b6d4
- Assign weights 1-10 based on complexity (1=basic, 5=intermediate, 10=mastery)

Description Requirements (VERY IMPORTANT):
- Labels can be creative/metaphorical (e.g., "CO₂ Champ", "Breath Master")
- Descriptions MUST be objective, specific, and measurable with concrete criteria
- Include specific metrics, thresholds, or deliverables
- Good example: "CO₂ Tolerance: Hold breath past first contraction for ≥ 60–90 seconds"
- Good example: "Complete 3 projects using React hooks with 95%+ test coverage"
- Good example: "Run 5km in under 25 minutes on flat terrain"
- Bad example: "Improve your breathing skills" (too vague)
- Bad example: "Get better at coding" (not measurable)
- Each description should clearly define WHAT constitutes completion`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use more cost-effective model
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
  } catch (error: any) {
    console.error('OpenAI generation error:', error);
    // Pass through the actual error message
    throw new Error(error?.message || 'Failed to generate skill tree');
  }
}
