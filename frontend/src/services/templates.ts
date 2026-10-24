export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  graph: {
    nodes: any[];
    edges: any[];
  };
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'skincare-pipeline',
    name: 'Skincare Brand Product & Campaign Engine',
    description: '3-stage AI pipeline: Generate 15 Ayurvedic product concepts -> Score & filter top 5 -> Produce launch strategy deliverable.',
    icon: 'Sparkles',
    graph: {
      nodes: [
        {
          id: 'input_node',
          type: 'workflowInput',
          position: { x: 50, y: 220 },
          data: {
            label: 'Brand & Market Input',
            description: 'Starting parameters for the pipeline',
            input_fields: {
              brand: 'AuraVeda Botanicals',
              category: 'Clean Ayurvedic Skincare',
              audience: 'Urban women ages 22-38 looking for skin barrier repair',
              tone: 'Authentic, luxurious, scientifically backed'
            }
          }
        },
        {
          id: 'node_1',
          type: 'universalAi',
          position: { x: 380, y: 150 },
          data: {
            label: 'Product Ideator',
            description: 'Generates 15 distinct product concepts',
            model: 'deepseek-v4-flash-0731',
            enabled: true,
            system_prompt: 'You are an elite cosmetic formulation and product innovation director.',
            user_prompt: 'Analyze the brand {{input.brand}} targeting {{input.audience}} in {{input.category}}.\nGenerate 15 innovative, authentic Ayurvedic skincare product concepts. Do not invent unrealistic claims.',
            output_mode: 'structured_json',
            row_mode: 'multiple',
            row_count: 15,
            enforce_uniqueness: true,
            schema_fields: [
              { name: 'product_name', type: 'string', required: true, description: 'Product title' },
              { name: 'category', type: 'string', required: true, description: 'Product category' },
              { name: 'selling_points', type: 'array', required: true, items_type: 'string', description: 'Top 3 selling highlights' },
              { name: 'target_audience', type: 'string', required: true, description: 'Primary target segment' }
            ],
            json_schema: {
              type: 'object',
              properties: {
                product_name: { type: 'string' },
                category: { type: 'string' },
                selling_points: { type: 'array', items: { type: 'string' } },
                target_audience: { type: 'string' }
              },
              required: ['product_name', 'selling_points', 'target_audience']
            }
          }
        },
        {
          id: 'node_2',
          type: 'universalAi',
          position: { x: 800, y: 150 },
          data: {
            label: 'Scoring & Filter',
            description: 'Filters the 15 concepts down to the top 5 highest potential items',
            model: 'deepseek-v4-flash-0731',
            enabled: true,
            system_prompt: 'You are a venture capital brand evaluator and commercialization expert.',
            user_prompt: 'Take the product concepts from {{nodes.node_1.output.rows}}.\nEvaluate formulation feasibility and commercial appeal. Score each item from 1-10 and select the 5 strongest products to proceed with.',
            output_mode: 'structured_json',
            row_mode: 'multiple',
            row_count: 5,
            enforce_uniqueness: true,
            schema_fields: [
              { name: 'product_name', type: 'string', required: true },
              { name: 'feasibility_score', type: 'number', required: true },
              { name: 'market_appeal_score', type: 'number', required: true },
              { name: 'rationale', type: 'string', required: true }
            ],
            json_schema: {
              type: 'object',
              properties: {
                product_name: { type: 'string' },
                feasibility_score: { type: 'number' },
                market_appeal_score: { type: 'number' },
                rationale: { type: 'string' }
              },
              required: ['product_name', 'feasibility_score', 'market_appeal_score']
            }
          }
        },
        {
          id: 'node_3',
          type: 'universalAi',
          position: { x: 1220, y: 150 },
          data: {
            label: 'Marketing Strategy Deliverable',
            description: 'Transforms the top 5 products into an executive go-to-market plan',
            model: 'deepseek-v4-flash-0731',
            enabled: true,
            system_prompt: 'You are a Chief Marketing Officer specializing in Indian D2C premium brands.',
            user_prompt: 'Take the top 5 evaluated products: {{nodes.node_2.output.rows}}.\nRewrite them in a premium Indian skincare brand voice: {{input.tone}}.\nProduce the final unified go-to-market deliverable with launch hooks and strategic direction.',
            output_mode: 'structured_json',
            row_mode: 'single',
            row_count: 1,
            enforce_uniqueness: false,
            schema_fields: [
              { name: 'campaign_title', type: 'string', required: true },
              { name: 'brand_narrative', type: 'string', required: true },
              { name: 'hero_hook', type: 'string', required: true },
              { name: 'launch_channels', type: 'array', required: true, items_type: 'string' },
              { name: 'executive_summary', type: 'string', required: true }
            ],
            json_schema: {
              type: 'object',
              properties: {
                campaign_title: { type: 'string' },
                brand_narrative: { type: 'string' },
                hero_hook: { type: 'string' },
                launch_channels: { type: 'array', items: { type: 'string' } },
                executive_summary: { type: 'string' }
              },
              required: ['campaign_title', 'brand_narrative', 'hero_hook']
            }
          }
        },
        {
          id: 'output_node',
          type: 'outputViewer',
          position: { x: 1640, y: 220 },
          data: {
            label: 'Results & Export Sink',
            description: 'Inspect, copy, and export final pipeline deliverables'
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'input_node', target: 'node_1' },
        { id: 'e2', source: 'node_1', target: 'node_2' },
        { id: 'e3', source: 'node_2', target: 'node_3' },
        { id: 'e4', source: 'node_3', target: 'output_node' }
      ]
    }
  },
  {
    id: 'social-viral-content',
    name: 'Social Media Viral Content Engine',
    description: 'Topic input -> 20 viral hooks -> 5 multi-channel formatted posts with hashtags and CTAs.',
    icon: 'Share2',
    graph: {
      nodes: [
        {
          id: 'input_social',
          type: 'workflowInput',
          position: { x: 50, y: 200 },
          data: {
            label: 'Campaign Topic',
            input_fields: {
              topic: 'How to fix a damaged skin barrier in 14 days',
              platform: 'Instagram Reels & LinkedIn'
            }
          }
        },
        {
          id: 'hook_generator',
          type: 'universalAi',
          position: { x: 420, y: 150 },
          data: {
            label: 'Hook & Angle Generator',
            description: 'Generates 20 high-converting hooks',
            model: 'deepseek-v4-flash-0731',
            enabled: true,
            user_prompt: 'Generate 20 scroll-stopping hooks for the topic: {{input.topic}}.\nFocus on counter-intuitive truths, warning signs, and relatable skincare pain points.',
            output_mode: 'structured_json',
            row_mode: 'multiple',
            row_count: 20,
            enforce_uniqueness: true,
            schema_fields: [
              { name: 'hook', type: 'string', required: true },
              { name: 'angle_type', type: 'string', required: true },
              { name: 'estimated_retention_score', type: 'number', required: true }
            ],
            json_schema: {
              type: 'object',
              properties: {
                hook: { type: 'string' },
                angle_type: { type: 'string' },
                estimated_retention_score: { type: 'number' }
              },
              required: ['hook', 'angle_type']
            }
          }
        },
        {
          id: 'caption_writer',
          type: 'universalAi',
          position: { x: 860, y: 150 },
          data: {
            label: 'Caption & Carousel Writer',
            description: 'Takes the best hooks and builds complete posts',
            model: 'deepseek-v4-flash-0731',
            enabled: true,
            user_prompt: 'Take the hooks from {{nodes.hook_generator.output.rows}}.\nSelect the 5 highest scoring hooks and generate full Instagram captions, slide breakdowns, and high-converting CTAs.',
            output_mode: 'structured_json',
            row_mode: 'multiple',
            row_count: 5,
            schema_fields: [
              { name: 'hook', type: 'string', required: true },
              { name: 'caption_body', type: 'string', required: true },
              { name: 'call_to_action', type: 'string', required: true },
              { name: 'hashtags', type: 'array', required: true, items_type: 'string' }
            ],
            json_schema: {
              type: 'object',
              properties: {
                hook: { type: 'string' },
                caption_body: { type: 'string' },
                call_to_action: { type: 'string' },
                hashtags: { type: 'array', items: { type: 'string' } }
              },
              required: ['hook', 'caption_body', 'call_to_action']
            }
          }
        },
        {
          id: 'output_social',
          type: 'outputViewer',
          position: { x: 1300, y: 200 },
          data: {
            label: 'Publishing Queue',
            description: 'Ready to review and export to social calendar'
          }
        }
      ],
      edges: [
        { id: 'es1', source: 'input_social', target: 'hook_generator' },
        { id: 'es2', source: 'hook_generator', target: 'caption_writer' },
        { id: 'es3', source: 'caption_writer', target: 'output_social' }
      ]
    }
  }
];
