import re

with open(r'c:\Users\ADMIN\Downloads\aimedic\src\components\modules\ChatModule.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

def clean_js(js):
    # Remove block comments
    js = re.sub(r'/\*.*?\*/', lambda m: ' ' * len(m.group(0)), js, flags=re.DOTALL)
    # Remove line comments
    js = re.sub(r'//.*', lambda m: ' ' * len(m.group(0)), js)
    
    cleaned = []
    in_string = None
    escaped = False
    
    for i, char in enumerate(js):
        if in_string:
            if escaped:
                cleaned.append(' ')
                escaped = False
            elif char == '\\':
                cleaned.append(' ')
                escaped = True
            elif char == in_string:
                cleaned.append(' ')
                in_string = None
            else:
                cleaned.append(' ')
        else:
            if char in ('"', "'", '`'):
                in_string = char
                cleaned.append(' ')
            else:
                cleaned.append(char)
                
    return "".join(cleaned)

cleaned_code = clean_js(content)
lines = cleaned_code.split('\n')

braces_stack = []
parens_stack = []

for line_num_0, line in enumerate(lines):
    line_num = line_num_0 + 1
    for col_num_0, char in enumerate(line):
        col_num = col_num_0 + 1
        if char == '{':
            braces_stack.append((line_num, col_num))
        elif char == '}':
            if braces_stack:
                braces_stack.pop()
            else:
                print(f"Extra closing brace '}}' at line {line_num}, col {col_num}")
                
        if char == '(':
            parens_stack.append((line_num, col_num))
        elif char == ')':
            if parens_stack:
                parens_stack.pop()
            else:
                print(f"Extra closing paren ')' at line {line_num}, col {col_num}")

print("Remaining braces in stack:")
for b in braces_stack:
    print(f"  Opening brace '{{' at line {b[0]}, col {b[1]}")
    
print("Remaining parens in stack:")
for p in parens_stack:
    print(f"  Opening paren '(' at line {p[0]}, col {p[1]}")
