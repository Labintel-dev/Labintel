file_path = r'c:\Users\sayan\OneDrive\Desktop\Labintel Project\frontend\src\pages\Dashboards.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Focus on AIReportPrintView (starts around 462, ends 1387)
block = lines[461:1387]
content = "".join(block)

# Let's count divs manually in the return block starting at 807
return_block = lines[806:1386]
open_tags = 0
for i, line in enumerate(return_block):
    # Very crude count
    open_tags += line.count('<div')
    open_tags -= line.count('</div>')
    # Self-closing divs
    open_tags -= line.count('/>')
    if open_tags < 0:
        print(f"ERROR: Extra closing tag at line {807 + i + 1}")
        print(line.strip())
        open_tags = 0

print(f"Final open tags: {open_tags}")
