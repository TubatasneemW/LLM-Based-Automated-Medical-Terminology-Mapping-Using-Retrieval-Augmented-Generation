import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Cpu, 
  Binary, 
  Database, 
  Filter, 
  Layers, 
  BrainCircuit, 
  CheckCircle2, 
  Activity,
  ArrowRight,
  Info,
  ChevronRight,
  Sparkles
} from 'lucide-react';

const PIPELINE_NODES = [
  {
    id: 'input',
    name: 'Clinical Input Processing',
    category: 'Ingestion',
    icon: FileText,
    color: '#00E5FF',
    glow: 'rgba(0, 229, 255, 0.3)',
    summary: 'Clinical text parsing, abbreviation expansion & negation detection.',
    inputData: 'Raw clinical note / diagnostic statement (e.g., "pt c/o severe SOB & HTN")',
    outputData: 'Normalized clinical text with expanded medical acronyms & negation flags',
    techStack: 'Regex Lexicon, Python Preprocessing Pipeline',
    details: 'Standardizes messy clinical language while preserving critical contextual negations (e.g., "no evidence of infarction"). Expands common abbreviations like SOB → Shortness of breath, HTN → Hypertension.'
  },
  {
    id: 'preprocessing',
    name: 'Medical Text Normalization',
    category: 'Preprocessing',
    icon: Cpu,
    color: '#14B8A6',
    glow: 'rgba(20, 184, 166, 0.3)',
    summary: 'Tokenization, stopword filtering and case standardization.',
    inputData: 'Cleaned medical strings',
    outputData: 'Semantic token sequences & clinical boundary markers',
    techStack: 'Python Standard String Services & Custom Bio-tokenizer',
    details: 'Prepares uniform textual tokens without stripping clinical indicators or lab reference integers, ensuring biomedical validity before vector transformation.'
  },
  {
    id: 'embedding',
    name: 'Sentence-BERT Embeddings',
    category: 'Representation',
    icon: Binary,
    color: '#00E5FF',
    glow: 'rgba(0, 229, 255, 0.3)',
    summary: 'High-dimensional biomedical dense semantic representation.',
    inputData: 'Normalized clinical sentence or phrase',
    outputData: '384-dimensional normalized dense float32 vector',
    techStack: 'PyTorch, Hugging Face Transformers, all-MiniLM-L6-v2',
    details: 'Projects clinical expressions into a metric semantic space where conceptual synonyms (e.g., "heart attack" and "myocardial infarction") map into close proximity.'
  },
  {
    id: 'faiss',
    name: 'FAISS Vector Database',
    category: 'Storage & Index',
    icon: Database,
    color: '#8B5CF6',
    glow: 'rgba(139, 92, 246, 0.3)',
    summary: 'High-speed IndexFlatIP vector indexing for cosine similarity.',
    inputData: 'Normalized query embedding vector',
    outputData: 'Top-K candidate nearest neighbors with inner-product similarity scores',
    techStack: 'FAISS (Facebook AI Similarity Search CPU/GPU)',
    details: 'Indexes standard concepts from SNOMED CT, ICD-10-CM, MeSH, and UMLS with sub-5ms lookup latency over normalized Euclidean / Inner-Product space.'
  },
  {
    id: 'retrieval',
    name: 'Top-K Candidate Retrieval',
    category: 'Retrieval',
    icon: Filter,
    color: '#14B8A6',
    glow: 'rgba(20, 184, 166, 0.3)',
    summary: 'Multi-vocabulary candidate extraction across target systems.',
    inputData: 'FAISS vector nearest neighbor indices',
    outputData: 'Top 10 retrieved medical concept records with metadata',
    techStack: 'Vector Search Service, Terminology Lookup Schema',
    details: 'Gathers candidate identifiers, official preferred names, clinical definitions, and synonym catalogs for downstream ranking.'
  },
  {
    id: 'reranking',
    name: 'Hybrid Candidate Re-Ranking',
    category: 'Ranking',
    icon: Layers,
    color: '#00E5FF',
    glow: 'rgba(0, 229, 255, 0.3)',
    summary: 'Multi-feature scoring combining cosine similarity, exact & synonym hits.',
    inputData: 'Top 10 candidate concept records + query signals',
    outputData: 'Top 5 calibrated candidate concepts with hybrid score and confidence',
    techStack: 'Biomedical Ranking Engine, Calibrated Logistic Probability',
    details: 'Balances vector semantic similarity (50%) with exact title matches (35%), synonym alignments (30%), token overlaps (20%), and clinical domain concordance.'
  },
  {
    id: 'reasoning',
    name: 'LLM Semantic Reasoning (RAG)',
    category: 'Intelligence',
    icon: BrainCircuit,
    color: '#8B5CF6',
    glow: 'rgba(139, 92, 246, 0.3)',
    summary: 'Contextual reasoning grounded strictly in retrieved medical records.',
    inputData: 'Patient context + top-5 candidate records with definitions',
    outputData: 'Grounded clinical justification, winner selection, and contrastive reasons',
    techStack: 'Google Gemini 1.5 / OpenAI / Local Grounded Clinical Reasoner',
    details: 'Analyzes nuances, contraindications, and subtle anatomical distinctions without fabricating identifiers or hallucinating medical concepts.'
  },
  {
    id: 'mapping',
    name: 'Final Standardized Concept Mapping',
    category: 'Output',
    icon: CheckCircle2,
    color: '#14B8A6',
    glow: 'rgba(20, 184, 166, 0.3)',
    summary: 'Validated concept mapping with full explainability trace.',
    inputData: 'Synthesized RAG payload and evidence citations',
    outputData: 'Standardized concept (Name, ID, Terminology, Confidence, Alternatives)',
    techStack: 'FastAPI, Pydantic Schema, SQLite Persistence',
    details: 'Outputs the final production-ready clinical terminology mapping along with audit-ready evidence for human clinician verification.'
  }
];

export default function Pipeline({ onNavigate }) {
  const [selectedNode, setSelectedNode] = useState(PIPELINE_NODES[0]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-cyan-electric mb-2 text-sm font-mono tracking-wider">
          <Activity className="w-4 h-4" />
          <span>SYSTEM ARCHITECTURE & INFERENCE FLOW</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Retrieval-Augmented Generation (RAG) Architecture
        </h1>
        <p className="text-slate-muted text-base mt-1 max-w-3xl">
          Interactive architectural visualization of the multi-stage biomedical terminology mapping pipeline. Click any node to inspect operational mechanics, input/output structures, and technology layers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Pipeline Diagram Left/Center */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <BrainCircuit className="w-48 h-48 text-cyan-electric" />
            </div>

            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-electric animate-ping" />
                <span className="font-mono text-xs uppercase tracking-wider text-slate-300">Live Architecture Graph</span>
              </div>
              <span className="text-xs font-mono text-cyan-electric bg-cyan-electric/10 px-2.5 py-1 rounded-full border border-cyan-electric/20">
                8 Execution Stages
              </span>
            </div>

            {/* Nodes Stack */}
            <div className="relative space-y-3">
              {/* Animated connector line */}
              <div className="absolute left-[34px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-cyan-electric via-teal-medical to-violet-soft opacity-30 pointer-events-none" />

              {PIPELINE_NODES.map((node, idx) => {
                const Icon = node.icon;
                const isSelected = selectedNode.id === node.id;
                return (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => setSelectedNode(node)}
                    className={`relative z-10 flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-200 border ${
                      isSelected
                        ? 'bg-midnight-800/90 border-cyan-electric shadow-lg shadow-cyan-electric/10'
                        : 'bg-midnight-900/50 hover:bg-midnight-800/50 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200"
                        style={{
                          backgroundColor: `${node.color}15`,
                          border: `1px solid ${isSelected ? node.color : 'rgba(255,255,255,0.1)'}`
                        }}
                      >
                        <Icon className="w-5 h-5" style={{ color: node.color }} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono text-slate-400">0{idx + 1}.</span>
                          <h4 className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                            {node.name}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-muted mt-0.5 max-w-md line-clamp-1">
                          {node.summary}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10 hidden sm:inline-block">
                        {node.category}
                      </span>
                      <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-cyan-electric translate-x-1' : 'text-slate-600'}`} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Node Detail Inspector Right */}
        <div className="lg:col-span-5 sticky top-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedNode.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="glass-panel-glow p-6 rounded-2xl border border-cyan-electric/30 space-y-6"
            >
              <div className="flex items-start justify-between pb-4 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${selectedNode.color}20`, border: `1px solid ${selectedNode.color}` }}
                  >
                    <selectedNode.icon className="w-6 h-6" style={{ color: selectedNode.color }} />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-electric">
                      {selectedNode.category} Layer
                    </span>
                    <h3 className="text-lg font-bold text-white">{selectedNode.name}</h3>
                  </div>
                </div>
              </div>

              {/* Functional Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Info className="w-3.5 h-3.5 text-cyan-electric" />
                  <span>Component Operational Logic</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed bg-midnight-950/60 p-3.5 rounded-xl border border-white/5">
                  {selectedNode.details}
                </p>
              </div>

              {/* Input / Output Structure */}
              <div className="space-y-3">
                <div>
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                    Input Specification:
                  </span>
                  <div className="font-mono text-xs text-teal-medical bg-midnight-950/80 p-2.5 rounded-lg border border-teal-medical/20">
                    {selectedNode.inputData}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                    Output Payload:
                  </span>
                  <div className="font-mono text-xs text-cyan-electric bg-midnight-950/80 p-2.5 rounded-lg border border-cyan-electric/20">
                    {selectedNode.outputData}
                  </div>
                </div>
              </div>

              {/* Technology Stack */}
              <div>
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                  Underlying Tech Engine:
                </span>
                <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-violet-soft/10 border border-violet-soft/30 text-violet-soft text-xs font-mono">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{selectedNode.techStack}</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onNavigate('workspace')}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-electric to-teal-medical text-midnight-950 font-bold text-xs uppercase tracking-wider hover:opacity-95 transition-opacity flex items-center justify-center space-x-2"
              >
                <span>Test in Mapping Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
