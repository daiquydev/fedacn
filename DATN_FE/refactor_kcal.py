import os
import re

src_dir = r"c:\DATN\fedacn\DATN_FE\src"
patterns = [
    (r"Math\.round\((totalCalories)\)", r"roundKcal(\1)"),
    (r"Math\.round\((totalKcal)\)", r"roundKcal(\1)"),
    (r"Math\.round\((kcal)\)", r"roundKcal(\1)"),
    (r"Math\.round\((a\.calories)\)", r"roundKcal(\1)"),
    (r"Math\.round\((activity\.calories)\)", r"roundKcal(\1)"),
    (r"Math\.round\((deleteActivity\.calories)\)", r"roundKcal(\1)"),
    (r"Math\.round\((entry\.calories)\)", r"roundKcal(\1)"),
    (r"Math\.round\((deleteEntry\.calories)\)", r"roundKcal(\1)"),
    (r"Math\.round\((dayStats\.totalCalories)\)", r"roundKcal(\1)"),
    (r"Math\.round\((nutrition\?\.calories \|\| 0)\)", r"roundKcal(\1)"),
    (r"Math\.round\((tick \* maxCalories)\)", r"roundKcal(\1)"),
    (r"Math\.round\((totals\.calories / divisor)\)", r"roundKcal(\1)"),
    (r"Math\.round\((calories - 500)\)", r"roundKcal(\1)"),
    (r"Math\.round\((calories \+ 500)\)", r"roundKcal(\1)"),
    (r"Math\.round\((Number\(distance\) \* kcalPerKm)\)", r"roundKcal(\1)"),
    (r"Math\.round\((Number\(form\.goal_value\) \* selectedCat\.kcal_per_unit)\)", r"roundKcal(\1)"),
    (r"Math\.round\((Number\(form\.goal_value\) \* \(selectedCat\.kcal_per_unit \|\| 0\))\)", r"roundKcal(\1)"),
    (r"Math\.round\((kcalPerKm \* distanceKm)\)", r"roundKcal(\1)"),
    (r"Math\.round\((totalCalories / caloriesData\.length)\)", r"roundKcal(\1)"),
    (r"Math\.round\((item\.calories)\)", r"roundKcal(\1)")
]

modified_files = []

for root, _, files in os.walk(src_dir):
    for f in files:
        if f.endswith(('.js', '.jsx')):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                content = file.read()
            
            original_content = content
            for p, r in patterns:
                content = re.sub(p, r, content)
            
            if content != original_content:
                # Add import if needed
                if "import { roundKcal } from '~/utils/mathUtils'" not in content and 'import { roundKcal }' not in content:
                    # find the last import
                    last_import_index = content.rfind('import ')
                    if last_import_index != -1:
                        end_of_last_import_line = content.find('\n', last_import_index)
                        content = content[:end_of_last_import_line+1] + "import { roundKcal } from '~/utils/mathUtils'\n" + content[end_of_last_import_line+1:]
                    else:
                        content = "import { roundKcal } from '~/utils/mathUtils'\n" + content

                with open(path, 'w', encoding='utf-8') as file:
                    file.write(content)
                modified_files.append(f)

print(f"Modified {len(modified_files)} files: {', '.join(modified_files)}")
