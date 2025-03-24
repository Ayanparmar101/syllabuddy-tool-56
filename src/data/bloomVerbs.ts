
export const bloomVerbsData = {
  remember: [
    'define', 'describe', 'identify', 'list', 'match', 'name', 'recall', 
    'recognize', 'retrieve', 'state', 'select', 'outline', 'reproduce', 
    'locate', 'label', 'memorize', 'quote', 'repeat', 'recite', 'tell'
  ],
  understand: [
    'explain', 'interpret', 'classify', 'compare', 'contrast', 'discuss', 
    'distinguish', 'estimate', 'summarize', 'translate', 'paraphrase', 
    'infer', 'predict', 'report', 'convert', 'differentiate', 'extend', 
    'generalize', 'illustrate', 'conclude'
  ],
  apply: [
    'apply', 'demonstrate', 'implement', 'solve', 'use', 'compute', 'develop', 
    'modify', 'prepare', 'produce', 'relate', 'show', 'transfer', 'change', 
    'construct', 'manipulate', 'operate', 'predict', 'calculate', 'complete'
  ],
  analyze: [
    'analyze', 'break down', 'categorize', 'compare', 'contrast', 'differentiate', 
    'distinguish', 'examine', 'organize', 'test', 'appraise', 'calculate', 
    'criticize', 'diagram', 'discriminate', 'experiment', 'question', 'relate', 
    'solve', 'inspect'
  ],
  evaluate: [
    'evaluate', 'appraise', 'argue', 'assess', 'choose', 'conclude', 'critique', 
    'decide', 'defend', 'judge', 'justify', 'prioritize', 'rate', 'recommend', 
    'select', 'support', 'value', 'debate', 'determine', 'measure'
  ],
  create: [
    'create', 'assemble', 'compose', 'construct', 'design', 'develop', 'formulate', 
    'generate', 'invent', 'plan', 'produce', 'build', 'devise', 'establish', 
    'integrate', 'make', 'organize', 'propose', 'synthesize', 'compile'
  ]
};

export type BloomLevel = keyof typeof bloomVerbsData;
