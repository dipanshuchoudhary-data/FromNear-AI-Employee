import os
import re

directory = "frontend/src"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Typography
    content = content.replace("var(--font-display)", "'Inter', system-ui, sans-serif")
    content = content.replace("fontFamily: 'var(--font-display)'", "fontFamily: \"'Inter', system-ui, sans-serif\"")
    content = content.replace("font-bold", "")
    content = content.replace("fontWeight: 800", "fontWeight: 600")
    content = content.replace("fontWeight: 700", "fontWeight: 600")
    
    # Emojis & Titles
    content = content.replace("Welcome back 👋", "Welcome")
    content = content.replace("🔥 Hot Leads", "Hot Leads")
    content = content.replace("♨️ Warm Leads", "Warm Leads")
    content = content.replace("❄️ Cold Leads", "Cold Leads")

    # Colors
    content = content.replace("var(--brand-50)", "#e8c5471a")
    content = content.replace("var(--brand-100)", "#e8c5471a")
    content = content.replace("var(--brand-200)", "#e8c5471a")
    content = content.replace("var(--brand-300)", "#d4b23a")
    content = content.replace("var(--brand-400)", "#d4b23a")
    content = content.replace("var(--brand-500)", "#e8c547")
    content = content.replace("var(--brand-600)", "#e8c547")
    content = content.replace("var(--brand-700)", "#e8c547")
    content = content.replace("var(--brand-800)", "#0e0e0e")
    content = content.replace("var(--brand-900)", "#0e0e0e")

    content = content.replace("var(--surface-0)", "#0e0e0e")
    content = content.replace("var(--surface-1)", "#161616")
    content = content.replace("var(--surface-2)", "#1e1e1e")
    content = content.replace("var(--surface-3)", "#1e1e1e")
    content = content.replace("var(--border)", "#2a2a2a")

    content = content.replace("var(--text-primary)", "#f0ede8")
    content = content.replace("var(--text-secondary)", "#8a8480")
    content = content.replace("var(--text-muted)", "#4a4744")

    content = content.replace("var(--hot)", "#f97316")
    content = content.replace("var(--warm)", "#e8c547")
    content = content.replace("var(--cold)", "#6b7280")
    
    content = content.replace("#ef4444", "#f97316")
    content = content.replace("#fef2f2", "#f973161a")
    content = content.replace("#f59e0b", "#e8c547")
    content = content.replace("#fffbeb", "#e8c5471a")
    content = content.replace("#6b7280", "#6b7280")
    content = content.replace("#f9fafb", "#6b72801a")
    
    content = content.replace("rounded-full", "rounded-lg")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            process_file(os.path.join(root, file))

print("Done")