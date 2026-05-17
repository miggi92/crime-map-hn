with open('/app/playwright.config.ts', 'r') as f:
    content = f.read()

content = content.replace("command: 'npx nuxi build && npx nuxi preview'", "command: 'NODE_OPTIONS=\"--max-old-space-size=4096\" npx nuxi build && npx nuxi preview'")

with open('/app/playwright.config.ts', 'w') as f:
    f.write(content)
