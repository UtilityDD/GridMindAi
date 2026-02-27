"""Load system and user prompt templates from prompts/ directory."""

import config


def _load_prompt(filename: str) -> str:
    return (config.PROMPTS_DIR / filename).read_text(encoding="utf-8").strip()


def _load_verbosity_map() -> dict[int, str]:
    raw = _load_prompt("verbosity.txt")
    mapping: dict[int, str] = {}
    for line in raw.splitlines():
        if "|" in line:
            level_str, instruction = line.split("|", 1)
            mapping[int(level_str.strip())] = instruction.strip()
    return mapping


SYSTEM_PROMPT = _load_prompt("system.txt")
_USER_TEMPLATE = _load_prompt("user_query.txt")
_VERBOSITY_MAP = _load_verbosity_map()


def get_verbosity_instruction(level: int) -> str:
    level = max(1, min(5, level))
    return _VERBOSITY_MAP.get(level, _VERBOSITY_MAP[3])


def build_user_prompt(
    question: str,
    context: str,
    sources: list[dict],
    verbosity: int = 3,
) -> str:
    source_list = "\n".join(
        f"  - {s['ref']} ({s['date']}): {s['title']}" for s in sources
    )
    return _USER_TEMPLATE.format(
        context=context,
        source_list=source_list,
        question=question,
        verbosity_instruction=get_verbosity_instruction(verbosity),
    )
