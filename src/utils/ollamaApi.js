import axios from 'axios';

const OLLAMA_API_BASE = (import.meta.env.VITE_OLLAMA_API_URL || 'http://localhost:11434').replace(/\/+$/, '');
export const DEFAULT_MODEL = import.meta.env.VITE_DEFAULT_MODEL || 'gemma4:4b';
const MAX_PROMPT_SECTION_CHARS = 20000;
const CATEGORIES = ['usability', 'accessibility', 'visual_hierarchy', 'interaction_design', 'consistency'];
const CATEGORY_KEYWORDS = {
  usability: ['usability', 'ux', 'user experience', 'friction', 'clarity'],
  accessibility: ['accessibility', 'a11y', 'wcag', 'contrast', 'screen reader', 'keyboard'],
  visual_hierarchy: ['visual hierarchy', 'hierarchy', 'layout', 'spacing', 'typography'],
  interaction_design: ['interaction', 'flow', 'feedback', 'state', 'affordance'],
  consistency: ['consistency', 'design system', 'token', 'uniform', 'cohesion']
};

const getOllamaErrorMessage = (error) => {
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }
  if (typeof error?.response?.data === 'string' && error.response.data.trim()) {
    return error.response.data;
  }
  if (error?.response?.status) {
    return `HTTP ${error.response.status}`;
  }
  return error?.message || 'Unknown request error';
};

export const analyzeInterface = async (
  { screenshot, html, css, dom, description },
  model = DEFAULT_MODEL
) => {
  const clamp = (value) => {
    if (!value) return '';
    if (value.length <= MAX_PROMPT_SECTION_CHARS) return value;
    return `${value.slice(0, MAX_PROMPT_SECTION_CHARS)}\n\n[Truncated for prompt size limits]`;
  };

  const systemPrompt = `You are an expert UX Design Critic with deep knowledge of usability, accessibility, visual hierarchy, interaction design, and consistency principles.

Analyze the provided interface inputs and provide feedback ONLY as a valid JSON object with the following exact structure. Return ONLY the JSON, no other text.

{
  "usability": [],
  "accessibility": [],
  "visual_hierarchy": [],
  "interaction_design": [],
  "consistency": []
}`;

  const promptParts = [];
  promptParts.push(
    'Analyze the provided interface using the available inputs. Combine visual evidence, markup structure, CSS styling, DOM semantics, and product goals into one unified critique.'
  );
  promptParts.push(
    'If a screenshot is available, prioritize visible layout, spacing, hierarchy, contrast, and interaction cues. If HTML/CSS/DOM are available, inspect semantic structure, form labeling, accessibility attributes, responsive layout hints, and visual system consistency.'
  );
  promptParts.push('If inputs conflict, note the conflict clearly and prefer the screenshot for visual appearance when it is present.');

  if (description) {
    promptParts.push(`Product description:\n${clamp(description)}`);
  }

  if (screenshot) {
    promptParts.push('Screenshot: Included as image attachment in this request.');
  }

  if (html) {
    promptParts.push(`HTML:\n${clamp(html)}`);
  }

  if (css) {
    promptParts.push(`CSS:\n${clamp(css)}`);
  }

  if (dom) {
    promptParts.push(`DOM:\n${clamp(dom)}`);
  }

  const prompt = promptParts.join('\n\n');
  const imagePayload = toOllamaImagePayload(screenshot);

  const runGenerate = async (targetModel) => {
    const requestBody = {
      model: targetModel,
      prompt,
      system: systemPrompt,
      stream: false,
      format: 'json'
    };

    if (imagePayload) {
      requestBody.images = [imagePayload];
    }

    return axios.post(`${OLLAMA_API_BASE}/api/generate`, requestBody);
  };

  try {
    let response;

    try {
      response = await runGenerate(model);
    } catch (error) {
      const serverMessage = String(getOllamaErrorMessage(error)).toLowerCase();
      const modelMissing = serverMessage.includes('model') && serverMessage.includes('not found');

      if (!modelMissing) {
        throw error;
      }

      const tags = await axios.get(`${OLLAMA_API_BASE}/api/tags`);
      const fallbackModel = tags?.data?.models?.[0]?.name;
      if (!fallbackModel) {
        throw error;
      }

      response = await runGenerate(fallbackModel);
    }

    const responseText = typeof response?.data?.response === 'string'
      ? response.data.response
      : JSON.stringify(response?.data?.response || {});
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) return buildFallbackCritiqueFromText(responseText);

    const normalized = normalizeCritiquePayload(JSON.parse(jsonMatch[0]));
    const totalIssues = Object.values(normalized).flat().length;
    if (totalIssues > 0) return normalized;

    return buildFallbackCritiqueFromText(responseText);
  } catch (error) {
    console.error('Error analyzing interface with Ollama:', error);
    throw new Error(`Failed to analyze interface: ${getOllamaErrorMessage(error)}`);
  }
};

export const askFollowUpQuestion = async (
  { screenshot, html, css, dom, description },
  { category, issue, element, fix, severity, message },
  model = DEFAULT_MODEL
) => {
  const clamp = (value) => {
    if (!value) return '';
    if (value.length <= MAX_PROMPT_SECTION_CHARS) return value;
    return `${value.slice(0, MAX_PROMPT_SECTION_CHARS)}\n\n[Truncated for prompt size limits]`;
  };

  const systemPrompt = `You are a senior UX reviewer answering follow-up questions about a previously identified interface issue.
Provide practical, concrete guidance. Keep the response concise and action-oriented.
Do not return JSON.`;

  const promptParts = [
    'You are answering a follow-up question about a UX critique item.',
    `Category: ${category || 'General'}`,
    `Issue: ${issue || 'Unspecified issue'}`,
    `Element: ${element || 'General interface'}`,
    `Suggested fix: ${fix || 'N/A'}`,
    `Severity: ${severity || 'Medium'}`,
    `User question: ${message || ''}`
  ];

  if (description) {
    promptParts.push(`Page context:\n${clamp(description)}`);
  }
  if (html) {
    promptParts.push(`HTML context:\n${clamp(html)}`);
  }
  if (css) {
    promptParts.push(`CSS context:\n${clamp(css)}`);
  }
  if (dom) {
    promptParts.push(`DOM context:\n${clamp(dom)}`);
  }
  if (screenshot) {
    promptParts.push('Screenshot: Included as image attachment in this request.');
  }

  const imagePayload = toOllamaImagePayload(screenshot);
  const requestBody = {
    model,
    system: systemPrompt,
    prompt: promptParts.join('\n\n'),
    stream: false
  };
  if (imagePayload) {
    requestBody.images = [imagePayload];
  }

  try {
    const response = await axios.post(`${OLLAMA_API_BASE}/api/generate`, requestBody);
    const text = String(response?.data?.response || '').trim();
    if (!text) {
      throw new Error('Empty follow-up response from model');
    }
    return text;
  } catch (error) {
    console.error('Error running follow-up question:', error);
    throw new Error(`Failed to answer follow-up question: ${getOllamaErrorMessage(error)}`);
  }
};

const toOllamaImagePayload = (screenshot) => {
  if (!screenshot || typeof screenshot !== 'string') return null;
  if (screenshot.startsWith('data:')) {
    const parts = screenshot.split(',', 2);
    if (parts.length === 2 && parts[1]) {
      return parts[1];
    }
  }
  return screenshot.trim() || null;
};

const normalizeSeverity = (value) => {
  const text = String(value || '').toLowerCase();
  if (text.includes('high')) return 'High';
  if (text.includes('medium') || text.includes('med')) return 'Medium';
  if (text.includes('low')) return 'Low';
  return 'Medium';
};

const toIssueObject = (item) => {
  if (typeof item === 'string') {
    return {
      issue: item.trim() || 'Unspecified issue',
      element: 'General interface',
      fix: 'Review this issue and apply a concrete UX fix.',
      severity: 'Medium'
    };
  }

  if (!item || typeof item !== 'object') {
    return null;
  }

  const issue = item.issue || item.problem || item.observation || item.finding || 'Unspecified issue';
  const element = item.element || item.target || item.component || 'General interface';
  const fix = item.fix || item.recommendation || item.solution || item.suggestion || 'Apply a UX improvement based on this issue.';
  const severity = normalizeSeverity(item.severity || item.impact || item.priority);

  return {
    issue: String(issue).trim(),
    element: String(element).trim(),
    fix: String(fix).trim(),
    severity
  };
};

const normalizeCategoryArray = (value) => {
  if (Array.isArray(value)) {
    return value.map(toIssueObject).filter(Boolean);
  }
  if (value && typeof value === 'object') {
    return [toIssueObject(value)].filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return [toIssueObject(value)];
  }
  return [];
};

const pickCategoryValue = (payload, category) => {
  const aliases = {
    usability: ['usability', 'ux', 'user_experience', 'userExperience'],
    accessibility: ['accessibility', 'a11y'],
    visual_hierarchy: ['visual_hierarchy', 'visualHierarchy', 'visual hierarchy'],
    interaction_design: ['interaction_design', 'interactionDesign', 'interaction design'],
    consistency: ['consistency', 'design_consistency', 'designConsistency']
  };

  const keys = aliases[category] || [category];
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      return payload[key];
    }
  }
  return undefined;
};

const normalizeCritiquePayload = (payload) => {
  const base = {};
  const source = payload && typeof payload === 'object' ? payload : {};

  for (const category of CATEGORIES) {
    base[category] = normalizeCategoryArray(pickCategoryValue(source, category));
  }

  routeLoosePayloadIntoCategories(source, base);

  if (CATEGORIES.every((category) => base[category].length === 0)) {
    return buildGuaranteedCategoryFallback();
  }

  return base;
};

const inferCategory = (...values) => {
  const combined = values
    .filter(Boolean)
    .map((value) => String(value).toLowerCase())
    .join(' ');

  for (const category of CATEGORIES) {
    if (CATEGORY_KEYWORDS[category].some((keyword) => combined.includes(keyword))) {
      return category;
    }
  }

  return null;
};

const routeIssue = (issue, buckets, fallbackCategory = 'usability') => {
  if (!issue) return;
  const category = inferCategory(issue.category, issue.type, issue.dimension, issue.issue, issue.fix) || fallbackCategory;
  buckets[category].push(issue);
};

const routeLoosePayloadIntoCategories = (source, buckets) => {
  if (!source || typeof source !== 'object') return;

  for (const [key, value] of Object.entries(source)) {
    const keyCategory = inferCategory(key);
    if (keyCategory && buckets[keyCategory].length > 0) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const normalized = toIssueObject(item);
        if (!normalized) continue;
        routeIssue(normalized, buckets, keyCategory || 'usability');
      }
      continue;
    }

    if (value && typeof value === 'object') {
      const normalized = toIssueObject(value);
      if (!normalized) continue;
      routeIssue(normalized, buckets, keyCategory || 'usability');
    }
  }
};

const buildFallbackCritiqueFromText = (responseText) => {
  const lines = String(responseText || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter((line) => line.length > 10)
    .slice(0, 10);

  if (lines.length === 0) {
    return buildGuaranteedCategoryFallback();
  }

  const buckets = {
    usability: [],
    accessibility: [],
    visual_hierarchy: [],
    interaction_design: [],
    consistency: []
  };

  lines.forEach((line, index) => {
    const inferred = inferCategory(line);
    const roundRobin = CATEGORIES[index % CATEGORIES.length];
    const category = inferred || roundRobin;
    buckets[category].push({
      issue: line,
      element: 'General interface',
      fix: 'Apply a targeted UX improvement for this issue.',
      severity: 'Medium'
    });
  });

  return ensureAllCategoriesHaveItems(buckets);
};

const ensureAllCategoriesHaveItems = (payload) => {
  const categoryDefaults = {
    usability: 'Primary flow lacks clarity in at least one step.',
    accessibility: 'Some controls likely need stronger accessibility support.',
    visual_hierarchy: 'Visual emphasis appears uneven across key elements.',
    interaction_design: 'Feedback and state transitions can be clearer.',
    consistency: 'Styles and component behavior are not fully consistent.'
  };

  for (const category of CATEGORIES) {
    if (!Array.isArray(payload[category])) {
      payload[category] = [];
    }
    if (payload[category].length === 0) {
      payload[category].push({
        issue: categoryDefaults[category],
        element: 'General interface',
        fix: 'Review this category and align with UX best practices.',
        severity: 'Low'
      });
    }
  }

  return payload;
};

const buildGuaranteedCategoryFallback = () => {
  return ensureAllCategoriesHaveItems({
    usability: [],
    accessibility: [],
    visual_hierarchy: [],
    interaction_design: [],
    consistency: []
  });
};

export const checkOllamaHealth = async () => {
  try {
    const response = await axios.get(`${OLLAMA_API_BASE}/api/tags`, {
      timeout: 5000
    });
    return response.data;
  } catch (error) {
    console.error('Ollama connection error:', error);
    return null;
  }
};

export const getAvailableModels = async () => {
  try {
    const response = await axios.get(`${OLLAMA_API_BASE}/api/tags`);
    return response.data.models || [];
  } catch (error) {
    console.error('Error fetching models:', error);
    return [];
  }
};
