# Lessons

- For website image paths, always use the correct relative path (e.g., 'images/filename.png') and ensure the images directory exists
- For search results, ensure proper handling of different character encodings (UTF-8) for international queries
- Add debug information to stderr while keeping the main output clean in stdout for better pipeline integration
- When using seaborn styles in matplotlib, use 'seaborn-v0_8' instead of 'seaborn' as the style name due to recent seaborn version changes
- When using Jest, a test suite can fail even if all individual tests pass, typically due to issues in suite-level setup code or lifecycle hooks

## Windsurf learned

- For search results, ensure proper handling of different character encodings (UTF-8) for international queries
- Add debug information to stderr while keeping the main output clean in stdout for better pipeline integration
- When using seaborn styles in matplotlib, use 'seaborn-v0_8' instead of 'seaborn' as the style name due to recent seaborn version changes
- Use 'gpt-4o' as the model name for OpenAI's GPT-4 with vision capabilities
- On Python 3.14 / Windows, grpcio==1.70.0 has no wheel and fails to compile. requirements.txt uses grpcio>=1.70.0; the installed wheel is 1.85.1. This venv has no pip module; install with `uv pip install -r requirements.txt --python .\venv\Scripts\python.exe`. Run tools with `venv\Scripts\python.exe`.

# Scratchpad

## Current task

همراهِ بازی — فوتر را از فهرست تیره و بلند به کارت برچسبی هم‌رنگ بقیهٔ سایت تبدیل کن. موبایل حدود ۴۰۰px و دسکتاپ هر دو دیده شوند.

[X] فوتر برچسبی
[X] چک موبایل و دسکتاپ

`buttonClass` از کامپوننت کلاینت است. در سرور فقط `className={buttonClass}`؛ الحاق رشته‌ای کلاس را خراب می‌کند.

#7968E8 برای متن کوچک رد می‌شود (سفید ۴٫۲۴، جوهر ۳٫۶۹). متن بنفش با #3F348F است.