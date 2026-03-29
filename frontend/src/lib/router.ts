export type QueryIntent = 'DIRECT_SEARCH' | 'COMPLEX_SYNTHESIS';

/**
 * A zero-latency heuristic classifier. 
 * Evaluates string length, analytical triggers, and explicit search terminology
 * (including localized Bengali phrases like "khuje din") to decisively bypass heavy LLMs.
 */
export function classifyQueryIntent(question: string): QueryIntent {
    const raw = question.toLowerCase().trim();
    // Remove basic punctuation to help word matching
    const normalized = raw.replace(/[^\w\s]/g, '');
    const wordCount = normalized.split(/\s+/).filter(w => w.length > 0).length;

    // 1. Analytical Triggers: If the user asks for logic or comparison, force the LLM.
    const analyticalKeywords = [
        'why', 'how', 'compare', 'difference', 'explain', 'summarize', 'summary',
        'detail', 'calculate', 'what is the reason', 'meaning', 'pros', 'cons',
        'advantages', 'disadvantages', 'analyze', 'evaluate', 'between', 'vs', 'versus',
        'what happens if', 'steps to', 'procedure for', 'implications'
    ];

    for (const token of analyticalKeywords) {
        if (raw.includes(token)) {
            return 'COMPLEX_SYNTHESIS';
        }
    }

    // 2. Short Keyword Searches: If someone just types "Maternity Leave" or "33KV VCB"
    // and wasn't caught by the analytical triggers, it's almost certainly a direct lookup.
    if (wordCount <= 4) {
        return 'DIRECT_SEARCH';
    }

    // 3. Explicit Search Triggers (including basic localized Bengali phrases)
    const searchKeywords = [
        'find', 'show', 'document', 'pdf', 'circular', 'spec sheet', 'guideline',
        'give me', 'where is', 'download', 'search for', 'looking for', 'copy of',
        'order', 'notification', 'gazette', 'khuje din', 'dekhan', 'dekhabo', 'patra'
    ];

    for (const token of searchKeywords) {
        if (raw.includes(token)) {
            return 'DIRECT_SEARCH';
        }
    }

    // 4. Fallback (If it's ambiguous, assume they want a comprehensive LLM answer)
    return 'COMPLEX_SYNTHESIS';
}
