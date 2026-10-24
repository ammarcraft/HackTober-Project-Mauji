import json
import time
import random
import re
from typing import Dict, Any, Optional, List, Tuple
from app.providers.base import BaseAIProvider, ProviderResponse

class IntelligentMockProvider(BaseAIProvider):
    """
    Intelligent mock AI provider that dynamically analyzes custom prompts,
    resolved input variables, and JSON schemas to craft context-aware,
    semantically aligned outputs and reasoning traces.
    """

    async def test_connection(self) -> Dict[str, Any]:
        return {
            "success": True,
            "message": "Connected to Mock AI Engine (DeepSeek V4 Flash ready). To use live inference, paste your Jarvis Labs API Key in Settings.",
            "latency_ms": 12,
            "models_available": [
                "deepseek-v4-flash-0731",
                "deepseek-ai/DeepSeek-V4-Flash-0731",
                "meta-llama/Llama-3-70b-instruct",
                "mistralai/Mixtral-8x7B-Instruct-v0.1"
            ]
        }

    def _extract_prompt_context(self, prompt: str) -> Dict[str, Any]:
        """Analyzes prompt text to identify domain, entities, industry, and tone."""
        prompt_lower = prompt.lower()

        # Domain & Industry detection
        domain = "general"
        industry = "technology"

        if any(w in prompt_lower for w in ["fintech", "finance", "banking", "payment", "crypto", "defi", "invest", "venture", "fund"]):
            domain = "fintech"
            industry = "Fintech & Financial Infrastructure"
        elif any(w in prompt_lower for w in ["ai", "machine learning", "agent", "llm", "neural", "deep learning", "model"]):
            domain = "ai"
            industry = "Artificial Intelligence & ML Infrastructure"
        elif any(w in prompt_lower for w in ["health", "biotech", "med", "clinic", "pharma", "patient", "dna"]):
            domain = "health"
            industry = "Digital Health & Biotechnology"
        elif any(w in prompt_lower for w in ["skin", "beauty", "cosmetic", "derma", "serum", "clean beauty"]):
            domain = "skincare"
            industry = "Cosmetics & Skincare"
        elif any(w in prompt_lower for w in ["dev", "developer", "code", "api", "database", "infrastructure", "cloud", "software"]):
            domain = "devtools"
            industry = "Developer Tools & Cloud Infrastructure"
        elif any(w in prompt_lower for w in ["ecommerce", "e-commerce", "retail", "shop", "consumer", "dtc", "brand"]):
            domain = "ecommerce"
            industry = "E-Commerce & Consumer Brands"
        elif any(w in prompt_lower for w in ["climate", "green", "carbon", "solar", "energy", "clean energy"]):
            domain = "climate"
            industry = "Climate Tech & Clean Energy"
        elif any(w in prompt_lower for w in ["cyber", "security", "auth", "fraud", "pentest", "vulnerability"]):
            domain = "security"
            industry = "Cybersecurity & Data Privacy"

        # Accelerator / Program context
        is_yc = "yc" in prompt_lower or "y combinator" in prompt_lower
        is_usa = "usa" in prompt_lower or "us" in prompt_lower or "united states" in prompt_lower or "american" in prompt_lower

        # Extract potential custom industry keyword from prompt
        industry_match = re.search(r"in\s+([a-zA-Z\s]+?)\s+(?:from|under|with|for|\.|$)", prompt, re.IGNORECASE)
        custom_topic = industry_match.group(1).strip() if industry_match else None

        return {
            "domain": domain,
            "industry": custom_topic or industry,
            "is_yc": is_yc,
            "is_usa": is_usa,
            "raw_prompt": prompt
        }

    def _get_curated_entities_for_domain(self, domain: str, is_yc: bool, is_usa: bool) -> List[Dict[str, Any]]:
        """Provides realistic entities matching the extracted prompt domain."""
        if domain == "fintech":
            return [
                {
                    "name": "Brex",
                    "website_url": "https://www.brex.com",
                    "summary": "AI-powered corporate cards, global treasury management, and automated expense controls built for high-growth tech companies.",
                    "insights": [
                        "YC W17 batch graduate, currently valued at over $12B",
                        "Processes tens of billions in annual corporate spending",
                        "Automated multi-currency billing and instant spend management"
                    ],
                    "justification": "Leading YC-backed US fintech unicorn transforming enterprise corporate card operations."
                },
                {
                    "name": "Stripe",
                    "website_url": "https://stripe.com",
                    "summary": "Core economic infrastructure suite enabling internet businesses to accept payments, send payouts, and manage finances worldwide.",
                    "insights": [
                        "YC S09 batch alumni, one of the most successful YC companies in history",
                        "Handles over 1% of entire global GDP transaction volume",
                        "99.999% uptime core payments engine with turnkey developer APIs"
                    ],
                    "justification": "The foundational benchmark for US fintech infrastructure originating from YC."
                },
                {
                    "name": "Ramp",
                    "website_url": "https://ramp.com",
                    "summary": "Next-generation finance automation platform combining corporate cards, bill pay, vendor negotiations, and accounting automation.",
                    "insights": [
                        "Fastest growing US fintech company reaching $300M+ in ARR",
                        "Saves businesses an average of 5% on annual vendor and operational costs",
                        "Backed by top US venture firms and fintech angel syndicates"
                    ],
                    "justification": "Category leader in AI-driven corporate spend optimization and cash management."
                },
                {
                    "name": "Modern Treasury",
                    "website_url": "https://www.moderntreasury.com",
                    "summary": "Payment operations software and money movement APIs for real-time bank ledgering and enterprise programmatic payouts.",
                    "insights": [
                        "YC S18 batch graduate powering money movement for leading enterprises",
                        "Direct banking core integrations with JPMorgan Chase and Wells Fargo",
                        "Automated wire, ACH, and RTP settlement tracking"
                    ],
                    "justification": "Premier real-time payment operations API provider funded by YC."
                },
                {
                    "name": "Mercury",
                    "website_url": "https://mercury.com",
                    "summary": "Modern digital banking technology engineered specifically for startups, venture-backed companies, and high-growth founders.",
                    "insights": [
                        "Powers over 100,000 venture-backed companies and startups",
                        "FDIC insurance up to $5M through partner banking networks",
                        "Built-in treasury yield products with instant wire capabilities"
                    ],
                    "justification": "The primary digital banking choice for modern tech founders and YC startups."
                },
                {
                    "name": "Plaid",
                    "website_url": "https://plaid.com",
                    "summary": "Data network connecting consumer and business bank accounts with thousands of fintech apps securely.",
                    "insights": [
                        "Powers financial data connectivity for 8,000+ fintech applications",
                        "Covers over 12,000 financial institutions in North America and Europe",
                        "Standard open banking protocol adopted across the US market"
                    ],
                    "justification": "Essential open banking API backbone connecting US consumers to modern fintech services."
                },
                {
                    "name": "Gusto",
                    "website_url": "https://gusto.com",
                    "summary": "Modern cloud platform providing automated payroll, employee benefits, and human resource compliance for growing businesses.",
                    "insights": [
                        "YC W12 batch breakout serving 300,000+ US businesses",
                        "Automated multi-state payroll tax filing and benefits administration",
                        "Full integrated workforce financial wellness suite"
                    ],
                    "justification": "Core US payroll and financial operations engine from YC."
                },
                {
                    "name": "Deel",
                    "website_url": "https://www.deel.com",
                    "summary": "All-in-one global payroll, compliance, and HR platform simplifying hiring and international payouts.",
                    "insights": [
                        "YC S19 batch standout with over $500M in annual recurring revenue",
                        "Directly owned local legal entities in 100+ countries",
                        "Fastest global expansion in remote workforce history"
                    ],
                    "justification": "Breakout YC company revolutionizing international contractor and employee payments."
                }
            ]

        elif domain == "ai":
            return [
                {
                    "name": "Scale AI",
                    "website_url": "https://scale.com",
                    "summary": "Data-centric AI platform providing training data annotation, RLHF, and evaluation infrastructure for leading frontier models.",
                    "insights": ["YC S16 graduate", "$14B valuation", "Powers data pipelines for OpenAI, Meta, and US defense"],
                    "justification": "Benchmark AI infrastructure company originated in YC."
                },
                {
                    "name": "Cursor (Anysphere)",
                    "website_url": "https://www.cursor.com",
                    "summary": "AI-first code editor designed for pair-programming and instant multi-file codebase manipulation.",
                    "insights": ["YC W23 graduate", "Rapidly adopted across 50,000+ engineering teams", "Deep context agentic codebase synthesis"],
                    "justification": "Breakout YC AI development tool transforming software engineering."
                },
                {
                    "name": "Perplexity AI",
                    "website_url": "https://www.perplexity.ai",
                    "summary": "Conversational answer engine delivering real-time cited research synthesis and knowledge discovery.",
                    "insights": ["Fastest growing AI search engine", "Answers 100M+ research queries monthly", "Multi-source neural verification"],
                    "justification": "Pioneering AI search and synthesized research platform."
                },
                {
                    "name": "LangChain",
                    "website_url": "https://www.langchain.com",
                    "summary": "Standard framework and observability platform for developers building production-grade LLM applications.",
                    "insights": ["100K+ GitHub stars ecosystem", "LangSmith observability suite", "Industry standard for context retrieval"],
                    "justification": "Essential developer framework for LLM orchestration."
                }
            ]

        elif domain == "health":
            return [
                {
                    "name": "Tempus AI",
                    "website_url": "https://www.tempus.com",
                    "summary": "Precision medicine platform leveraging genomic sequencing and clinical data to personalize patient therapeutics.",
                    "insights": ["Clinical genomics library", "Partnerships with 90% of top pharma", "AI-guided clinical trial matching"],
                    "justification": "Leader in precision oncology and healthcare data analytics."
                },
                {
                    "name": "Color Health",
                    "website_url": "https://www.color.com",
                    "summary": "Population health delivery and preventative oncology screening infrastructure for major health systems.",
                    "insights": ["YC W19 cohort ties", "Deployed across millions of US patients", "Enterprise preventative care access"],
                    "justification": "High-impact US digital health delivery and diagnostic infrastructure."
                }
            ]

        # Generic / Dynamic fallback entities
        topic_clean = domain.capitalize() if domain != "general" else "Innovate"
        return [
            {
                "name": f"{topic_clean}Nexus Technologies",
                "website_url": f"https://www.{topic_clean.lower()}nexus.io",
                "summary": f"Next-generation enterprise platform optimizing high-performance workflows and analytics in {domain}.",
                "insights": [
                    f"Category-leading solution for modern {domain} infrastructure",
                    "Built with high-throughput distributed architecture",
                    "Ranked in top 10 high-growth market innovators"
                ],
                "justification": f"Selected for exceptional execution and alignment with prompt directives."
            },
            {
                "name": f"{topic_clean}Pulse Labs",
                "website_url": f"https://www.{topic_clean.lower()}pulse.com",
                "summary": f"AI-enabled automation system delivering measurable efficiency and data-driven insights for {domain}.",
                "insights": [
                    "Over 40% reduction in operational latency",
                    "Comprehensive API and turnkey integrations",
                    "Enterprise security and SOC2 Type II verified"
                ],
                "justification": f"High-impact domain provider matching specified search criteria."
            }
        ]

    def _generate_value_for_schema_field(
        self,
        field_name: str,
        field_def: Dict[str, Any],
        index: int,
        context: Dict[str, Any],
        entity: Dict[str, Any]
    ) -> Any:
        f_type = field_def.get("type", "string")
        f_name_lower = field_name.lower()

        # Check if entity directly has this property
        for k in [f_name_lower, field_name]:
            if k in entity:
                val = entity[k]
                if f_type == "array" and not isinstance(val, list):
                    return [val]
                if f_type == "string" and isinstance(val, list):
                    return ", ".join(str(x) for x in val)
                return val

        # Handle specific common field semantics
        if f_type == "string":
            if "name" in f_name_lower or "title" in f_name_lower or "company" in f_name_lower:
                return entity.get("name", f"Company #{index}")
            elif "url" in f_name_lower or "website" in f_name_lower or "link" in f_name_lower:
                return entity.get("website_url", f"https://www.company{index}.com")
            elif "summary" in f_name_lower or "description" in f_name_lower or "overview" in f_name_lower:
                return entity.get("summary", f"A leading enterprise platform providing comprehensive capabilities for item {index}.")
            elif "justification" in f_name_lower or "reason" in f_name_lower:
                return entity.get("justification", f"Matches required parameters for item {index}.")
            elif "industry" in f_name_lower or "sector" in f_name_lower:
                return context.get("industry", "Technology")
            elif "country" in f_name_lower or "region" in f_name_lower or "location" in f_name_lower:
                return "United States" if context.get("is_usa") else "Global"
            elif "batch" in f_name_lower or "accelerator" in f_name_lower:
                batches = ["W17", "S19", "W20", "S21", "W22", "S23"]
                return f"YC {batches[index % len(batches)]}" if context.get("is_yc") else "Techstars 2022"
            elif "status" in f_name_lower:
                return "active"
            else:
                return f"Verified {field_name} for {entity.get('name', f'item {index}')}"

        elif f_type in ("number", "integer"):
            if "year" in f_name_lower or "founded" in f_name_lower:
                return 2016 + (index % 8)
            elif "score" in f_name_lower or "rating" in f_name_lower:
                return round(8.8 + (index % 10) * 0.1, 1) if f_type == "number" else random.randint(88, 98)
            elif "valuation" in f_name_lower or "funding" in f_name_lower:
                return (index * 15 + 25) * 1000000
            elif "rank" in f_name_lower or "index" in f_name_lower:
                return index
            else:
                return random.randint(10, 100) if f_type == "integer" else round(random.uniform(10.0, 100.0), 2)

        elif f_type == "boolean":
            return True

        elif f_type == "array":
            if "insight" in f_name_lower or "highlight" in f_name_lower or "feature" in f_name_lower or "key" in f_name_lower:
                return entity.get("insights", [
                    f"Strong market penetration in {context.get('industry', 'tech')}",
                    "Proven operational scalability and capital efficiency",
                    "Validated product-market fit with top-tier enterprise clients"
                ])
            elif "tag" in f_name_lower or "categor" in f_name_lower:
                return [context.get("industry", "Technology"), "Enterprise", "High Growth"]
            elif "url" in f_name_lower or "website" in f_name_lower:
                return [entity.get("website_url", f"https://www.company{index}.com")]
            else:
                return [f"{field_name} detail A", f"{field_name} detail B"]

        elif f_type == "object":
            sub_props = field_def.get("properties", {})
            return {
                k: self._generate_value_for_schema_field(k, v, index, context, entity)
                for k, v in sub_props.items()
            }

        return f"Value for {field_name}"

    def _generate_record_from_schema(
        self,
        schema: Dict[str, Any],
        index: int,
        context: Dict[str, Any],
        entities: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        properties = schema.get("properties", {})
        entity = entities[(index - 1) % len(entities)]
        record = {}
        for prop_name, prop_spec in properties.items():
            record[prop_name] = self._generate_value_for_schema_field(prop_name, prop_spec, index, context, entity)
        return record

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        output_mode: str = "auto",
        json_schema: Optional[Dict[str, Any]] = None,
        row_mode: str = "single",
        row_count: int = 1,
        reasoning_effort: Optional[str] = "high",
        temperature: float = 0.7,
        max_tokens: int = 16384
    ) -> ProviderResponse:
        start_time = time.time()
        time.sleep(0.04)

        chosen_model = model or "deepseek-v4-flash-0731"

        # 1. Analyze prompt context
        combined_text = f"{prompt} {system_prompt or ''}"
        context = self._extract_prompt_context(combined_text)
        entities = self._get_curated_entities_for_domain(
            domain=context["domain"],
            is_yc=context["is_yc"],
            is_usa=context["is_usa"]
        )

        prompt_snippet = prompt.strip().replace('\n', ' ')[:90]
        reasoning = (
            f"DeepSeek V4 Reasoning Chain [Effort: {reasoning_effort or 'High'}]:\n"
            f"1. Deconstruct user directives: '{prompt_snippet}...'\n"
            f"2. Contextual domain identified: {context['industry']} (YC: {context['is_yc']}, USA: {context['is_usa']}).\n"
            f"3. Resolving output mode '{output_mode}' with target row count: {row_count}.\n"
            f"4. Synthesized schema-conforming records adhering to prompt constraints."
        )

        if output_mode == "raw_text":
            first_entity = entities[0]
            content = (
                f"### Analysis & Generation Deliverable: {context['industry']}\n\n"
                f"**Target Company**: {first_entity['name']} ({first_entity.get('website_url', '')})\n\n"
                f"**Executive Summary**:\n{first_entity['summary']}\n\n"
                f"**Key Strategic Insights**:\n" +
                "\n".join([f"- {item}" for item in first_entity.get("insights", [])]) +
                f"\n\n**Justification**:\n{first_entity['justification']}"
            )
            elapsed_ms = int((time.time() - start_time) * 1000)
            return ProviderResponse(
                content=content,
                reasoning_content=reasoning,
                model=chosen_model,
                tokens_used=random.randint(280, 620),
                duration_ms=elapsed_ms,
                is_mock=True
            )

        elif output_mode == "structured_json" and json_schema:
            schema_type = json_schema.get("type", "object")

            if row_mode == "multiple" and row_count > 1:
                records = [
                    self._generate_record_from_schema(json_schema, idx + 1, context, entities)
                    for idx in range(row_count)
                ]
                content = json.dumps({"rows": records}, indent=2)
            else:
                if schema_type == "array":
                    count = row_count if row_count > 1 else 3
                    item_schema = json_schema.get("items", {})
                    records = [
                        self._generate_record_from_schema(item_schema, idx + 1, context, entities)
                        for idx in range(count)
                    ]
                    content = json.dumps(records, indent=2)
                else:
                    record = self._generate_record_from_schema(json_schema, 1, context, entities)
                    content = json.dumps(record, indent=2)

        else: # Auto mode
            if row_mode == "multiple" and row_count > 1:
                records = []
                for i in range(1, row_count + 1):
                    ent = entities[(i - 1) % len(entities)]
                    records.append({
                        "id": i,
                        "name": ent["name"],
                        "website_url": ent.get("website_url", f"https://{ent['name'].lower().replace(' ', '')}.com"),
                        "industry": context["industry"],
                        "summary": ent["summary"],
                        "insights": ent.get("insights", []),
                        "justification": ent.get("justification", f"Matches {context['industry']} criteria.")
                    })
                content = json.dumps({"rows": records}, indent=2)
            else:
                first_ent = entities[0]
                content = json.dumps({
                    "name": first_ent["name"],
                    "website_url": first_ent.get("website_url", "https://company.com"),
                    "industry": context["industry"],
                    "summary": first_ent["summary"],
                    "insights": first_ent.get("insights", []),
                    "justification": first_ent.get("justification", "Matches prompt requirements.")
                }, indent=2)

        elapsed_ms = int((time.time() - start_time) * 1000)
        return ProviderResponse(
            content=content,
            reasoning_content=reasoning,
            model=chosen_model,
            tokens_used=random.randint(320, 850),
            duration_ms=elapsed_ms,
            is_mock=True
        )
