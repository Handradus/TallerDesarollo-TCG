const fs = require('fs');
const path = require('path');

const entitiesPath = path.join(__dirname, 'backend', 'src', 'entities');
const files = fs.readdirSync(entitiesPath).filter(f => f.endsWith('.js'));

let mermaid = "erDiagram\n";
let processedRelations = new Set();

for (const file of files) {
  try {
    const content = fs.readFileSync(path.join(entitiesPath, file), 'utf8');
    
    const nameMatch = content.match(/name:\s*['"]([^'"]+)['"]/);
    if (!nameMatch) continue;
    const name = nameMatch[1];
    
    // Extract relations first to know foreign keys
    const relsList = [];
    const relBlockMatch = content.match(/relations:\s*{([\s\S]*?)}\s*,?\s*}\);?/);
    if (relBlockMatch) {
      const relStr = relBlockMatch[1];
      const rels = [...relStr.matchAll(/([a-zA-Z0-9_]+):\s*{([\s\S]*?)}/g)];
      for (const r of rels) {
        const relName = r[1];
        const inner = r[2];
        const targetMatch = inner.match(/target:\s*['"]([^'"]+)['"]/);
        const typeMatch = inner.match(/type:\s*['"]([^'"]+)['"]/);
        const joinColMatch = inner.match(/joinColumn:\s*(\{.*?\}|true)/);
        
        if (targetMatch && typeMatch) {
          relsList.push({
            relName,
            target: targetMatch[1],
            type: typeMatch[1],
            hasJoinColumn: !!joinColMatch
          });
        }
      }
    }

    mermaid += `  ${name} {\n`;
    
    // Extract columns
    const colMatch = content.match(/columns:\s*{([\s\S]*?)}(?:,\s*relations:|\s*,?\s*}\);?)/);
    const existingCols = new Set();
    if (colMatch) {
      const colStr = colMatch[1];
      const cols = [...colStr.matchAll(/([a-zA-Z0-9_]+):\s*{[^}]*type:\s*['"]([^'"]+)['"][^}]*}/g)];
      for (const c of cols) {
        mermaid += `    ${c[2]} ${c[1]}\n`;
        existingCols.add(c[1]);
      }
    }
    
    // Add implicit Foreign Keys
    for (const rel of relsList) {
      if (rel.type === 'many-to-one' || rel.type === 'one-to-one') {
        let fkCol = rel.relName + 'Id';
        if (!existingCols.has(fkCol)) {
           mermaid += `    int ${fkCol} FK\n`;
        }
      }
    }
    
    mermaid += `  }\n\n`;

    // Add relations
    for (const rel of relsList) {
      const { target, type, relName } = rel;
      
      const relKey = `${name}-${target}-${type}-${relName}`;
      if (!processedRelations.has(relKey)) {
          // Many to One: Left side is Many, Right side is One.
          if (type === 'many-to-one') {
             mermaid += `  ${name} }o--|| ${target} : "${relName}"\n`;
          } else if (type === 'one-to-many') {
             mermaid += `  ${name} ||--o{ ${target} : "${relName}"\n`;
          } else if (type === 'one-to-one') {
             mermaid += `  ${name} ||--|| ${target} : "${relName}"\n`;
          } else {
             mermaid += `  ${name} }o--o{ ${target} : "${relName}"\n`;
          }
          processedRelations.add(relKey);
      }
    }
    mermaid += `\n`;
  } catch (e) {
    console.error("Error with", file, e.message);
  }
}

fs.writeFileSync(path.join(__dirname, 'modelo_relacional_corregido.txt'), mermaid);
console.log("Generado exitosamente.");
